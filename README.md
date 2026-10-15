# Saurabh Pagrut · Portfolio

Personal site for **[saurabhpagrut.in](https://saurabhpagrut.in)**. The design idea is "Saurabh, as an API": each section is an endpoint, and the hero shows the profile as the JSON response it resolves to.

Plain HTML, CSS and JavaScript with no build step and no dependencies, hosted on Netlify. Fonts and logos are served from the site itself, so the page makes no third-party requests.

```
public/
  index.html          all page content (hero, experience, skills, archive, education, contact)
  assets/styles.css   design tokens and component styles (light + dark)
  assets/app.js       theme switch, background canvas, card hover, JSON toggles, skill filters, contact form
  assets/portrait-*   profile photo (480 and 960 px)
  assets/icons/       skill logos from Devicon (MIT), served locally
  assets/fonts/       Geist and Geist Mono variable fonts (OFL), served locally
  404.html            not-found page
  thanks/index.html   shown after sending a message with JavaScript turned off
  robots.txt, sitemap.xml
public/_redirects     www and *.netlify.app → saurabhpagrut.in
public/_headers       security and cache headers
netlify.toml          tells Netlify to publish public/
```

## Run it locally

Any static server works, for example:

```bash
npx serve public     # or: python3 -m http.server -d public 3000
```

The contact form only sends on Netlify; locally the request has nowhere to go.

## Editing content

Text lives in `public/index.html`. Each section is a `<section class="endpoint" id="...">` block. The **JSON** view of each section is a hand-written copy of the same data inside that section's `<pre>` block, so update both when you change something.

## Contact form

The form uses **Netlify Forms** (no server code and no secrets in the repo). Spam is filtered by Netlify plus a hidden honeypot field.

One-time setup in Netlify:
1. **Forms → Enable form detection**, then redeploy once.
2. **Site configuration → Notifications → Emails and webhooks → Form submission notifications → Add notification → Email notification**, once for `getsaurabhpagrut@gmail.com` and once for `hello@saurabhpagrut.in`, form `contact`.

## Domain

saurabhpagrut.in is registered at Hostinger and points at Netlify:

| Type  | Name | Value                                  |
|-------|------|----------------------------------------|
| A     | @    | 75.2.60.5                              |
| CNAME | www  | saurabhpagrutportfolio.netlify.app   |

In Netlify, `saurabhpagrut.in` is the primary domain and HTTPS is provisioned automatically.
