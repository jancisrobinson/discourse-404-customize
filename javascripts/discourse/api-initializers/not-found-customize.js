import { apiInitializer } from "discourse/lib/api";
import JR_LOGO from "../lib/jr-logo";

export default apiInitializer((api) => {
  function isAnonymous() {
    return !api.getCurrentUser();
  }

  function ssoLoginUrl() {
    const path = window.location.pathname + window.location.search;
    return "/session/sso?return_path=" + encodeURIComponent(path);
  }

  function customizeTitle(root) {
    const title = root.querySelector("h1.title");
    if (title && settings.page_title) {
      title.textContent = settings.page_title;
    }
  }

  function injectMessage(root) {
    const wrapper = root.querySelector(".title_wrapper") || root;
    if (wrapper.querySelector(".jr-404-message")) return;
    if (!settings.message_html) return;

    const message = document.createElement("p");
    message.className = "jr-404-message";
    message.innerHTML = settings.message_html;

    // Rewrite the sentinel links to their real destinations.
    const login = message.querySelector('a[href="#login"]');
    if (login) login.href = ssoLoginUrl();
    const subscribe = message.querySelector('a[href="#subscribe"]');
    if (subscribe) subscribe.href = settings.membership_url;

    const title = wrapper.querySelector("h1.title");
    if (title && title.nextSibling) {
      wrapper.insertBefore(message, title.nextSibling);
    } else {
      wrapper.appendChild(message);
    }
  }

  function customizeButton(root) {
    if (!settings.button_text) return;
    const btn = root.querySelector("a.btn");
    if (!btn) return;
    btn.href = settings.membership_url;
    // Drop the home icon, keep only the label.
    btn.querySelectorAll("svg.d-icon").forEach((el) => el.remove());
    const label = btn.querySelector(".d-button-label") || btn;
    label.textContent = settings.button_text;
  }

  function swapLogo(root) {
    const svg = settings.logo_svg || JR_LOGO;
    const illustration = root.querySelector("img, .d-image-grid, svg");
    if (!illustration || illustration.closest(".jr-404-message")) return;
    const holder = document.createElement("div");
    holder.className = "jr-notfound-logo";
    holder.innerHTML = svg;
    illustration.replaceWith(holder);
  }

  function customize() {
    const root = document.querySelector(".page-not-found");
    if (!root || root.classList.contains("jr-404-done")) return;
    root.classList.add("jr-404-done");

    swapLogo(root);
    if (isAnonymous()) {
      customizeTitle(root);
      injectMessage(root);
      customizeButton(root);
    }
  }

  // The not-found body renders after the route transition; retry a few frames.
  function scheduleCustomize(attempt) {
    if (document.querySelector(".page-not-found.jr-404-done")) return;
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
