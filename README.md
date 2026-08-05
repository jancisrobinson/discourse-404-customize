# 404 Customize

A Discourse theme component for [forum.jancis.com](https://forum.jancis.com/) that reworks the not-found ("Oops! That page doesn't exist or is private.") page for anonymous visitors.

Most threads on the forum are members-only. Discourse deliberately serves the **same** not-found page for a genuine 404 and for a private topic an anonymous visitor may not view — so it can't leak whether the topic exists. This component tailors that shared page toward the members-only case: a clearer title, a message with links to log in (via SSO) or subscribe, a "Become a member" button, and the JR 25th-anniversary monogram in place of the default illustration.

## How it works

1. Runs via Discourse's `apiInitializer`, on each page change and on load
2. Detects the `.page-not-found` page and, for anonymous visitors only, rewrites it:
   - Sets the title (`h1.title`)
   - Injects a message paragraph; `#login` links become an SSO login that returns to the current page, `#subscribe` links point to the membership page
   - Repurposes the primary button to "Become a member" (membership URL) and removes the home icon
3. Replaces the default illustration with the bundled JR monogram for everyone (branding), coloured via CSS

The logged-in vs logged-out distinction is handled by `api.getCurrentUser()` — logged-in visitors keep Discourse's default page, so the "log in" message never shows to someone already signed in.

**SSO-friendly** — no Discourse login modal. Login links route through DiscourseConnect (`/session/sso`) so users authenticate on jancisrobinson.com.

## Requirements

- Discourse 3.1+
- Works on Discourse Pro (hosted) — no server-side plugin required

## Installation

**Admin → Customize → Themes → Install → From a git repository**

```
https://github.com/jancisrobinson/discourse-404-customize.git
```

If the repo is private, add the SSH deploy key shown by Discourse to the repo's **Settings → Deploy keys**.

Then add the component to your active theme. Remove any older inline 404 customization script from Admin so the two don't both run.

## Configuration

All settings are under **Admin → Customize → Themes → 404 Customize**. Leaving a text setting empty keeps Discourse's default for that element.

| Setting | Default | Description |
|---------|---------|-------------|
| `membership_url` | `https://www.jancisrobinson.com/membership` | Destination for the button and `#subscribe` links |
| `page_title` | `Join the conversation` | Replaces the page title (`h1`) |
| `message_html` | see below | Message shown under the title (anonymous only) |
| `button_text` | `Become a member` | Primary button label; button is pointed at `membership_url` and the home icon removed |
| `logo_svg` | *(empty)* | Inline SVG overriding the bundled JR monogram |

### `message_html`

HTML shown under the title. Use `href='#login'` for the SSO login link and `href='#subscribe'` for the membership link — the component rewrites these to real destinations. Default:

```html
This conversation is for JancisRobinson.com members only. <a href='#login'>Log in</a> or <a href='#subscribe'>become a member</a> to join the conversation.
```

Because the same page serves 404s and members-only blocks, keep the copy sensible for both cases.

### Logo colour

The bundled monogram uses `fill="currentColor"`. Set its colour in `common/common.scss`:

```scss
.page-not-found .jr-notfound-logo {
  color: #d19bd6; // JR light purple/pink — adjust to brand
}
```

## File structure

```
├── about.json                  # Component metadata
├── common/
│   └── common.scss             # Message + logo styles
├── javascripts/
│   └── discourse/
│       ├── api-initializers/
│       │   └── not-found-customize.js   # Main logic
│       └── lib/
│           └── jr-logo.js               # Inlined JR monogram (currentColor)
└── settings.yml                # Admin settings definitions
```

## Notes / limitations

- **403 vs 404 cannot be separated.** Discourse normalizes private-topic access for anonymous visitors to the same not-found page, so there's no distinct 403 template to style. The copy is written to read acceptably for both.
- **Session expiry.** When a member's subscription lapses their forum session is cleared and they're logged out, so an expired member sees the anonymous (log in / become a member) version.
- Selectors for the button and illustration (`.page-not-found a.btn`, `img`/`svg`) depend on the Discourse version; the code is defensive (skips silently if an element isn't found). Verify on the live forum after installing.

## Updating

After pushing changes to this repo, go to **Admin → Customize → Themes → 404 Customize** and click the update button to pull the latest version.
