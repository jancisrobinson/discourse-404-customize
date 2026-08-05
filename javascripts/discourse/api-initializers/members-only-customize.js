import { apiInitializer } from "discourse/lib/api";

// Customizes the members-only "forbidden" not-found page toward a membership CTA.
//
// When a visitor opens a members-only topic/category they can't see, Discourse
// (with the `detailed_404` site setting ON) returns 403 and embeds the server's
// `.page-not-found` HTML in the response (extras.html); exception.gjs renders it
// via {{trustHTML errorHtml}}. So on a real (Ember) page load this initializer
// finds `.page-not-found` and rewrites it. Genuine 404s render a different
// template (`.error-page`) and are intentionally left untouched.
//
// Requires `detailed_404` ON — otherwise a restricted topic is turned into a
// plain 404 and no `.page-not-found` appears in the app.
export default apiInitializer((api) => {
  const MEMBERSHIP_URL = "https://www.jancisrobinson.com/membership";
  const TITLE = "Join the conversation";

  function customize() {
    const root = document.querySelector(".page-not-found");
    if (!root || root.classList.contains("jr-404-done")) {
      return;
    }

    const wrapper = root.querySelector(".title_wrapper");
    if (!wrapper) {
      return;
    }
    root.classList.add("jr-404-done");

    const title = wrapper.querySelector("h1.title");
    if (title) {
      title.textContent = TITLE;
      // Core hardcodes the tab title to page_not_found.page_title ("Page Not
      // Found") even for a 403 — realign it, keeping the site suffix.
      const suffix = document.title.includes(" - ")
        ? document.title.slice(document.title.indexOf(" - "))
        : "";
      document.title = TITLE + suffix;
    }

    // The "Log in" link is dropped for signed-in visitors — they're already
    // logged in, they just aren't members.
    if (!wrapper.querySelector(".jr-404-message")) {
      const path = window.location.pathname + window.location.search;
      const ssoUrl = "/session/sso?return_path=" + encodeURIComponent(path);
      const links = api.getCurrentUser()
        ? `<a href="${MEMBERSHIP_URL}">Become a member</a>`
        : `<a href="${ssoUrl}">Log in</a> or <a href="${MEMBERSHIP_URL}">become a member</a>`;

      const msg = document.createElement("p");
      msg.className = "jr-404-message";
      msg.innerHTML =
        "This conversation is for JancisRobinson.com members only. " +
        links +
        " to join the conversation.";

      if (title && title.nextSibling) {
        wrapper.insertBefore(msg, title.nextSibling);
      } else {
        wrapper.appendChild(msg);
      }
    }

    const btn =
      wrapper.querySelector("a.btn.--home") || wrapper.querySelector("a.btn");
    if (btn) {
      btn.href = MEMBERSHIP_URL;
      btn.innerHTML = "Become a member";
    }
  }

  // The forbidden body is injected after the route transition settles, so retry
  // a few frames until `.page-not-found` appears.
  function scheduleCustomize(attempt) {
    if (document.querySelector(".page-not-found.jr-404-done")) {
      return;
    }
    if (document.querySelector(".page-not-found")) {
      customize();
      return;
    }
    if (attempt < 10) {
      setTimeout(() => scheduleCustomize(attempt + 1), 50);
    }
  }

  api.onPageChange(() => scheduleCustomize(0));
  scheduleCustomize(0);
});
