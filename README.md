# 404 Customize

A Discourse theme component for [forum.jancis.com](https://forum.jancis.com/) that rebrands the **members-only** not-found page toward a membership CTA: a "Join the conversation" title, a message with log-in / become-a-member links, a "Become a member" button, and the JR 25th-anniversary monogram in place of Discourse's default illustration.

Most threads on the forum are members-only. When a visitor without access opens one, Discourse shows a not-found page — this component turns that page into an invitation to subscribe.

## ⚠️ Requires the `detailed_404` site setting — ON

**This component does nothing unless `detailed_404` is enabled.** It is the single most important prerequisite, so read this section before installing.

### Where

**Admin → Settings → Security → `detailed_404`** (search "detailed_404"). Tick it on.

### Why it's required

When a visitor can't see a members-only topic, Discourse has two possible responses, chosen by `detailed_404`:

- **`detailed_404` OFF (default):** Discourse converts the access failure into a plain `Discourse::NotFound` so it can't leak whether the topic exists — see `app/controllers/topics_controller.rb`:
  ```ruby
  raise(SiteSetting.detailed_404 ? ex : Discourse::NotFound)
  ```
  The visitor gets a generic **404**. In the app this renders as the `.error-page` template (the `:(` face) — **not** the `.page-not-found` markup this component looks for — so the initializer never matches and nothing happens.

- **`detailed_404` ON:** the access failure stays a **403 (forbidden)**. For a 403, Discourse embeds the server-rendered `.page-not-found` HTML in the response (`extras.html`), and `exception.gjs` renders it:
  ```
  {{#if (and @controller.errorHtml @controller.isForbidden)}}
    <div class="not-found">{{trustHTML @controller.errorHtml}}</div>
  ```
  So `.page-not-found` **is** present in the DOM, and this component's initializer finds it and rewrites it.

In short: **403 → `.page-not-found` in the app → this component runs. 404 → `.error-page` → it doesn't.** Only `detailed_404` produces the 403.

### The trade-off (know before enabling)

Per the setting's own warning, `detailed_404` means visitors can tell that a URL points at a **real** topic (a 403) versus a genuinely missing page (a 404). You are trading a small amount of "does this topic exist" secrecy for the ability to show a tailored members-only page. For a forum whose whole model is "subscribe to read", that trade is usually worth it — but it is a deliberate choice.

### Verifying it's on

Open a members-only topic in a **private/incognito** window (logged out). You should get **HTTP 403** and the customized "Join the conversation" page. If you instead get a 404 with the sad-magnifying-glass illustration, `detailed_404` is off.

## How it works

`javascripts/discourse/api-initializers/members-only-customize.js` runs in the Ember app. On every page change it looks for `.page-not-found` (present only on the 403 members-only page, per above) and, if found:

1. Sets the title (`h1.title`) to **"Join the conversation"**.
2. Fixes the browser tab title — Discourse core hardcodes it to "Page Not Found" even for a 403 (`@page_title = I18n.t("page_not_found.page_title")` in `build_not_found_page`), so the component realigns `document.title` to match.
3. Injects a message under the title. Anonymous visitors get an SSO **Log in** link (`/session/sso?return_path=…`, returns to the current page) **and** a **become a member** link; signed-in visitors get only the membership link — the log-in link is dropped since they're already logged in.
4. Repurposes the "Take me home" button into a **Become a member** button (points at the membership URL, drops the home icon).

`common/common.scss` (scoped under `.jr-404-done`, which the initializer adds) swaps the illustration for the JR monogram — masked and tinted by `logo_color` — styles the injected message, and gives the heading a light card on mobile (below `40rem`) so text stays readable over the theme's fixed purple background.

Anonymous vs signed-in is detected with `api.getCurrentUser()`.

## Configuration

- **Wording / URLs** are hardcoded as consts at the top of `members-only-customize.js` (`MEMBERSHIP_URL`, `TITLE`, message text). Edit them there.
- **Logo colour:** **Admin → Customize → Themes → 404 Customize → `logo_color`** (default `#d19bd6`, JR light purple/pink).

## Known limitations

- **Only the members-only (403) page is customized.** A genuinely missing page (a real 404, e.g. `/not-found` or a typo) is left as Discourse's default — this component deliberately does not touch it.
- **Membership can't be detected.** The page exposes anonymous vs signed-in, but not whether a signed-in user is a *member*. So a signed-in non-member and a signed-in member see the same thing; "hide log in only for non-members" is met to the extent possible — the log-in link is hidden for **all** signed-in visitors.
- **SVG must be an authorized theme asset.** If the monogram doesn't load, add `svg` to the `theme authorized extensions` site setting.

## File structure

```
├── about.json                 # Component metadata + asset registration
├── assets/
│   └── jr-monogram.svg         # JR 25th-anniversary monogram (masked → logo_color)
├── common/
│   └── common.scss             # Logo swap, message + mobile styles
├── javascripts/discourse/api-initializers/
│   └── members-only-customize.js   # The customization logic
└── settings.yml                # logo_color setting
```

## Installation

1. **Enable `detailed_404`** (Admin → Settings → Security) — see above.
2. **Admin → Customize → Themes → Install → From a git repository:**
   ```
   https://github.com/jancisrobinson/discourse-404-customize.git
   ```
3. Add the component to your active theme. Remove any older inline 404 customization script so the two don't both run.

## Updating

After pushing to this repo, go to **Admin → Customize → Themes → 404 Customize** and click **Check for Updates**.
