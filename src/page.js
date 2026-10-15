// The page's markup. Content comes from src/content.js; nothing here should
// need editing to change what the site says.
import * as c from './content.js';
import { icon } from './icons.js';
import { jsonLines } from './json-view.js';
import { duration, esc, formatDate, monogram } from './util.js';

const API = '/v1/engineers/saurabhpagrut';
const fullName = `${c.profile.firstName} ${c.profile.lastName}`;
const list = (items, fn) => items.map(fn).join('');
const chips = (items) =>
  `<ul class="chips" aria-label="Technologies">${list(items, (s) => `<li class="chip">${esc(s)}</li>`)}</ul>`;

/* ---------- Section frame with Human / JSON views ---------- */

function endpoint({ id, title, human, json }) {
  const toggle = json
    ? `<div class="view-toggle" role="group" aria-label="View ${title} as">
              <button type="button" aria-pressed="true" data-view="human" aria-controls="${id}-human">Human</button>
              <button type="button" aria-pressed="false" data-view="json" aria-controls="${id}-json">JSON</button>
            </div>`
    : '';
  const jsonPanel = json
    ? `
          <div class="view-panel json-view" id="${id}-json" data-panel="json" hidden>
            <div class="response-bar">
              <span class="status"><span class="status-dot" aria-hidden="true"></span><span class="status-code">200 OK</span></span>
              <span class="response-type">GET ${API}/${id}</span>
            </div>
            <pre tabindex="0"><code class="json ">${jsonLines(json)}</code></pre>
          </div>`
    : '';
  return `
    <section class="endpoint" id="${id}" aria-labelledby="${id}-title"${json ? ' data-views' : ''}>
      <div class="container">
        <header class="endpoint-head">
          <p class="endpoint-path"><span class="method">GET</span> <span>${API}/<strong>${id}</strong></span></p>
          <div class="endpoint-head-row">
            <h2 class="endpoint-title" id="${id}-title">${title}</h2>
            ${toggle}
          </div>
        </header>
        <div class="endpoint-body">
          <div class="view-panel" id="${id}-human" data-panel="human">
${human}
          </div>${jsonPanel}
        </div>
      </div>
    </section>`;
}

/* ---------- Header ---------- */

function header() {
  const navSections = ['experience', 'skills', c.projects.items.length && 'projects', 'archive', 'education', 'contact'].filter(Boolean);
  return `
    <header class="site-header" data-header>
      <div class="container header-inner">
        <a class="brand" href="#top" aria-label="${fullName}, back to top">
          <span class="brand-mark" aria-hidden="true">${c.profile.initials}</span>
          <span class="brand-name">${fullName}</span>
        </a>

        <nav class="site-nav" aria-label="Sections">
          <ul class="nav-list" id="nav-list" data-nav-list>${list(
            navSections,
            (s) => `<li><a href="#${s}" class="nav-link"><span class="nav-slash" aria-hidden="true">/</span>${s}</a></li>`,
          )}</ul>
        </nav>

        <div class="header-actions">
          <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch to dark theme">
            <span class="theme-icon theme-icon--sun">${icon('sun')}</span>
            <span class="theme-icon theme-icon--moon">${icon('moon')}</span>
          </button>
          <button class="icon-btn menu-btn" type="button" data-menu-toggle aria-expanded="false" aria-controls="nav-list" aria-label="Open menu">
            <span class="menu-icon menu-icon--open">${icon('menu')}</span>
            <span class="menu-icon menu-icon--close">${icon('close')}</span>
          </button>
        </div>
      </div>
    </header>`;
}

/* ---------- Hero ---------- */

function hero() {
  const p = c.profile;
  const services = c.experience.services;
  const response = {
    name: fullName,
    role: p.title,
    company: p.company,
    location: `${p.city}, ${p.country}`,
    since: c.experience.roles.at(-1).start,
    stack: p.stack,
    owns: services.filter((s) => s.role === 'owner').map((s) => s.id),
    contributes_to: services.filter((s) => s.role === 'contributor').map((s) => s.id),
    contact: c.contact.email,
  };
  return `
    <section class="hero" id="top" aria-labelledby="hero-name">
      <div class="container hero-grid">
        <div class="hero-main">
          <p class="request" aria-label="Request: GET ${API}">
            <span class="method">GET</span>
            <span class="path">/v1/engineers/<strong>saurabhpagrut</strong></span>
          </p>

          <div class="hero-id">
            <img
              class="portrait"
              src="${p.portrait.small}"
              srcset="${p.portrait.small} 480w, ${p.portrait.large} 960w"
              sizes="(min-width: 60em) 144px, 96px"
              width="480"
              height="480"
              alt="${esc(p.portrait.alt)}"
              fetchpriority="high"
              decoding="async"
            />
            <h1 id="hero-name" class="hero-name">
              <span>${p.firstName}</span>
              <span>${p.lastName}</span>
            </h1>
          </div>

          <p class="hero-role">${esc(p.title)} at <strong>${esc(p.company)}</strong></p>
          <ul class="stack-line" aria-label="Main technologies">
            ${list(p.heroStack, (s) => `<li>${esc(s)}</li>`)}
          </ul>

          <p class="hero-summary">${esc(p.summary)}</p>

          <div class="hero-cta">
            <a class="btn btn-primary" href="#contact">Get in touch ${icon('arrowRight', 16)}</a>
            <a class="btn btn-quiet" href="${c.contact.github.url}" rel="me noopener" target="_blank">${icon('github', 16)} GitHub</a>
            <a class="btn btn-quiet" href="${c.contact.linkedin.url}" rel="me noopener" target="_blank">${icon('linkedin', 16)} LinkedIn</a>
          </div>
        </div>

        <aside class="response" aria-label="This profile as a JSON response">
          <div class="response-bar">
            <span class="status" data-status>
              <span class="status-dot" aria-hidden="true"></span>
              <span class="status-code">200 OK</span>
              <span class="status-time" data-status-time></span>
            </span>
            <span class="response-type">application/json</span>
          </div>
          <pre class="response-body" tabindex="0"><span class="res-headers"><span class="line" style="--i:0"><span class="h-key">content-type</span>: application/json</span><span class="line" style="--i:1"><span class="h-key">x-served-from</span>: ${p.city}, ${p.countryCode}</span></span><code class="json res-json">${jsonLines(response, 2)}</code></pre>
        </aside>
      </div>
    </section>`;
}

/* ---------- Experience ---------- */

function role(r, today) {
  const current = !r.end;
  const when = current
    ? `<time datetime="${r.start}">${formatDate(r.start)}</time> – Present`
    : `<time datetime="${r.start}">${formatDate(r.start)}</time> – <time datetime="${r.end}">${formatDate(r.end)}</time>`;
  return `
            <li class="role${current ? ' role-current' : ''}">
              <span class="role-node" aria-hidden="true"></span>
              <p class="role-when">
                <span>${when}</span>
                <span class="role-duration"${current ? ` data-since="${r.start}"` : ''}>${duration(r.start, r.end, today)}</span>
              </p>
              <article class="card role-card" data-card>
                <header class="role-card-head">
                  <h3 class="role-title">${esc(r.title)}</h3>
                  ${current ? '<span class="pill pill-live">Current</span>' : ''}
                </header>
                <ul class="role-points">${list(r.points, (pt) => `<li>${esc(pt)}</li>`)}</ul>
                ${chips(r.stack)}
              </article>
            </li>`;
}

function service(s) {
  const owner = s.role === 'owner';
  return `
              <article class="card service" data-card>
                <div class="service-top">
                  <span class="service-icon" aria-hidden="true">${icon('server')}</span>
                  <span class="pill${owner ? ' pill-live' : ''}">${owner ? 'Owner' : 'Contributor'}</span>
                </div>
                <h4 class="service-name">${esc(s.name)}</h4>
                <p class="service-note">${esc(s.note)}</p>
                <ul class="service-work" aria-label="My contributions">${list(s.work, (w) => `<li>${esc(w)}</li>`)}</ul>
                <p class="service-foot">${esc(s.kind)} · ${esc(c.experience.companyShort)}</p>
              </article>`;
}

function experience(today) {
  const e = c.experience;
  const start = e.roles.at(-1).start;
  const human = `
            <div class="company">
              <h3 class="company-name">${esc(e.company)}</h3>
              <p class="company-meta">
                ${esc(e.location)} · ${formatDate(start)} – Present ·
                <span data-since="${start}">${duration(start, null, today)}</span>
              </p>
            </div>
            <ol class="timeline">${list(e.roles, (r) => role(r, today))}
            </ol>

            <div class="subhead">
              <h3>Services I've worked on</h3>
              <p>${e.services.length} services · ${esc(e.companyShort)}</p>
            </div>
            <p class="service-highlight">
              <span class="service-highlight-tag">${esc(e.highlight.tag)}</span>
              <span>${esc(e.highlight.text)}</span>
            </p>
            <div class="services">${list(e.services, service)}
            </div>`;
  const json = {
    experience: [
      {
        company: e.company,
        location: e.location,
        roles: e.roles.map((r) => ({ title: r.title, start: r.start, end: r.end, points: r.points, stack: r.stack })),
      },
    ],
    services: e.services.map((s) => ({ id: s.id, name: s.name, role: s.role, kind: s.kind, work: s.work })),
    highlight: e.highlight.text,
  };
  return endpoint({ id: 'experience', title: 'Experience', human, json });
}

/* ---------- Skills ---------- */

function skills() {
  const all = c.skills.flatMap((g) => g.items.map((s) => ({ ...s, group: g })));
  let i = 0;
  const tile = (s) => {
    const iconHtml = s.logo
      ? `<span class="skill-icon" data-logo-wrap>
                  <img src="/assets/icons/${s.logo}" alt="" width="28" height="28" loading="lazy" decoding="async" data-logo />
                  <span class="skill-mono" aria-hidden="true">${esc(s.mono ?? monogram(s.name))}</span>
                </span>`
      : `<span class="skill-icon skill-icon--glyph">${icon(s.glyph, 22)}</span>`;
    return `
              <li class="card skill-tile${s.primary ? ' is-primary' : ''}" data-card data-group="${s.group.id}" style="--i:${i++}">
                ${iconHtml}
                <span class="skill-text">
                  <span class="skill-name">${esc(s.name)}</span>
                  <span class="skill-group-label">${esc(s.group.label)}</span>
                </span>
                ${s.primary ? '<span class="primary-dot" title="Primary stack"><span class="visually-hidden">Primary stack</span></span>' : ''}
              </li>`;
  };
  const human = `
            <div class="skill-toolbar">
              <div class="skill-filters" role="group" aria-label="Filter skills" data-skill-filters>
                <button type="button" class="filter" aria-pressed="true" data-filter="all">All <span class="filter-count">${all.length}</span></button>${list(
                  c.skills,
                  (g) => `
                <button type="button" class="filter" aria-pressed="false" data-filter="${g.id}">${esc(g.label)} <span class="filter-count">${g.items.length}</span></button>`,
                )}
              </div>
              <p class="skill-legend"><span class="primary-dot" aria-hidden="true"></span> Primary stack</p>
            </div>
            <p class="visually-hidden" aria-live="polite" data-skill-status>Showing all ${all.length} skills</p>

            <ul class="skill-grid" data-skill-grid>${list(all, tile)}
            </ul>`;
  const json = { skills: Object.fromEntries(c.skills.map((g) => [g.label, g.items.map((s) => s.name)])) };
  return endpoint({ id: 'skills', title: 'Skills', human, json });
}

/* ---------- Projects and Archive ---------- */

function project(p) {
  const modules = p.modules
    ? `
                <div class="modules">
                  <p class="modules-label">Modules <span><span class="mine-swatch" aria-hidden="true"></span> built by me</span></p>
                  <ul class="modules-grid">${list(p.modules, (m) => {
                    const mine = p.mine?.includes(m);
                    return `<li class="module${mine ? ' is-mine' : ''}">${esc(m)}${mine ? '<span class="visually-hidden"> (built by me)</span>' : ''}</li>`;
                  })}</ul>
                </div>`
    : '';
  const links = [
    p.links.code &&
      `<a class="project-link" href="${esc(p.links.code)}" target="_blank" rel="noopener">${icon('github', 15)} Code</a>`,
    p.links.demo &&
      `<a class="project-link" href="${esc(p.links.demo)}" target="_blank" rel="noopener">${icon('external', 15)} ${esc(p.links.demoLabel ?? 'Live')}</a>`,
  ].filter(Boolean);
  return `
              <article class="card project${p.featured ? ' project--featured' : ''}" data-card>
                <header class="project-head">
                  <span class="method">${esc(p.tag)}</span>
                  <span class="project-year">${p.year}${p.team ? ` · team of ${p.team}` : ''}</span>
                </header>
                <h3 class="project-name">${esc(p.name)}</h3>
                <p class="project-desc">${esc(p.description)}</p>
                ${p.role ? `<p class="project-role"><span>My part</span> ${esc(p.role)}</p>` : ''}${modules}
                <footer class="project-foot">
                  ${chips(p.stack)}
                  ${links.length ? `<div class="project-links">${links.join('')}</div>` : ''}
                </footer>
              </article>`;
}

const projectJson = (p) => ({
  name: p.name,
  year: p.year,
  kind: p.kind,
  description: p.description,
  team: p.team,
  role: p.role,
  modules: p.modules,
  mine: p.mine,
  stack: p.stack,
  links: p.links,
});

function projectSection(id, title, data) {
  if (!data.items.length) return '';
  const human = `
            <p class="section-intro">${esc(data.intro)}</p>
            <div class="archive-grid">${list(data.items, project)}
            </div>`;
  return endpoint({ id, title, human, json: { [id]: data.items.map(projectJson) } });
}

/* ---------- Education ---------- */

function education() {
  const card = (e, kind) => `
              <article class="card edu-card" data-card>
                <div class="edu-top">
                  <span class="service-icon" aria-hidden="true">${icon(kind === 'Degree' ? 'cap' : 'certificate')}</span>
                  <span class="pill">${kind}</span>
                </div>
                <h3 class="edu-title">${esc(e.title)}</h3>
                <p class="edu-place">${esc(e.place)}</p>
                <p class="edu-when">
                  <time datetime="${e.start}">${formatDate(e.start)}</time> – <time datetime="${e.end}">${formatDate(e.end)}</time>
                </p>
              </article>`;
  const human = `
            <div class="edu-grid">${list(c.education.education, (e) => card(e, 'Degree'))}${list(
              c.education.certifications,
              (e) => card(e, 'Certification'),
            )}
            </div>`;
  return endpoint({ id: 'education', title: 'Education', human, json: c.education });
}

/* ---------- Contact ---------- */

function contactMethod({ iconName, label, value, href, copy, external }) {
  const valueHtml = href
    ? `<a class="contact-value" href="${esc(href)}"${external ? ' target="_blank" rel="me noopener"' : ''}>${esc(value)}</a>`
    : `<span class="contact-value">${esc(value)}</span>`;
  const copyBtn = copy
    ? `
                  <button class="icon-btn copy-btn" type="button" data-copy="${esc(value)}" aria-label="Copy ${label.toLowerCase()}">
                    <span class="copy-icon">${icon('copy', 16)}</span>
                    <span class="copied-icon">${icon('check', 16)}</span>
                  </button>`
    : '';
  return `
                <li class="contact-method">
                  <span class="contact-icon" aria-hidden="true">${icon(iconName)}</span>
                  <span class="contact-text">
                    <span class="contact-label">${label}</span>
                    ${valueHtml}
                  </span>${copyBtn}
                </li>`;
}

function field({ id, label, type = 'text', autocomplete, maxlength, placeholder, rows }) {
  const attrs = `id="${id}" name="${id}"`;
  const common = `maxlength="${maxlength}" required placeholder="${placeholder}" aria-describedby="${id}-error"`;
  const control = rows
    ? `<textarea ${attrs} rows="${rows}" ${common}></textarea>`
    : `<input ${attrs} type="${type}" autocomplete="${autocomplete}" ${common} />`;
  return `
              <div class="field">
                <label for="${id}">${label}</label>
                ${control}
                <p class="field-error" id="${id}-error" data-error-for="${id}"></p>
              </div>`;
}

function contact() {
  const k = c.contact;
  const methods = [
    { iconName: 'mail', label: 'Email', value: k.email, href: `mailto:${k.email}`, copy: true },
    { iconName: 'phone', label: 'Phone', value: k.phone.display, href: `tel:${k.phone.tel}`, copy: true },
    { iconName: 'linkedin', label: 'LinkedIn', value: k.linkedin.label, href: k.linkedin.url, external: true },
    { iconName: 'github', label: 'GitHub', value: k.github.label, href: k.github.url, external: true },
    { iconName: 'pin', label: 'Location', value: `${c.profile.city}, ${c.profile.country}` },
  ];
  const human = `
            <div class="contact-grid">
              <div class="contact-info">
                <p class="contact-lede">${esc(k.lede)}</p>
                <ul class="contact-methods">${list(methods, contactMethod)}
                </ul>
              </div>
              <div class="card request-card" data-card data-card-flat>
                <div class="request-bar">
                  <span class="method method-post">POST</span>
                  <span class="request-path">${API}/messages</span>
                </div>
                <form class="contact-form" name="contact" method="POST" action="/thanks/" data-netlify="true" netlify-honeypot="company" data-contact-form novalidate>
                  <input type="hidden" name="form-name" value="contact" />
                  <p class="honeypot" aria-hidden="true">
                    <label>Leave this empty <input name="company" tabindex="-1" autocomplete="off" /></label>
                  </p>
                  <div class="field-row">${field({ id: 'name', label: 'Name', autocomplete: 'name', maxlength: 100, placeholder: 'Your name' })}${field({ id: 'email', label: 'Email', type: 'email', autocomplete: 'email', maxlength: 200, placeholder: 'you@company.com' })}
                  </div>${field({ id: 'subject', label: 'Subject', autocomplete: 'off', maxlength: 150, placeholder: 'What is it about?' })}${field({ id: 'message', label: 'Message', maxlength: 5000, placeholder: 'Write your message', rows: 6 })}
                  <div class="form-actions">
                    <button class="btn btn-primary" type="submit" data-submit>
                      <span data-submit-label>Send message</span> ${icon('send', 16)}
                    </button>
                    <p class="form-note">${esc(k.formNote)}</p>
                  </div>
                </form>
                <div class="form-result" data-form-result hidden tabindex="-1">
                  <div class="response-bar">
                    <span class="status"><span class="status-dot" aria-hidden="true"></span><span class="status-code" data-result-code>201 Created</span></span>
                    <span class="response-type">application/json</span>
                  </div>
                  <pre class="response-body"><code class="json" data-result-body></code></pre>
                  <button class="btn btn-secondary" type="button" data-form-reset>Send another message</button>
                </div>
              </div>
            </div>`;
  return endpoint({ id: 'contact', title: 'Contact', human });
}

/* ---------- Page ---------- */

export function page(today = new Date()) {
  const s = c.site;
  const image = new URL(s.image, s.url).href;
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: fullName,
    jobTitle: c.profile.title,
    worksFor: { '@type': 'Organization', name: c.profile.company },
    address: { '@type': 'PostalAddress', addressLocality: c.profile.city, addressCountry: c.profile.countryCode },
    url: s.url,
    image,
    sameAs: [c.contact.github.url, c.contact.linkedin.url],
  };
  return `<!doctype html>
<!-- Generated by build.js from src/content.js. Edit those files, not this one. -->
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(s.title)}</title>
  <meta name="description" content="${esc(s.description)}">
  <link rel="canonical" href="${s.url}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${s.url}">
  <meta property="og:title" content="${esc(s.title)}">
  <meta property="og:description" content="${esc(s.shareDescription)}">
  <meta property="og:image" content="${image}">
  <meta name="twitter:card" content="summary">
  <meta name="theme-color" content="#f4f5f7" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0c0e13" media="(prefers-color-scheme: dark)">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <script>
    // Apply a saved theme before first paint so there's no flash.
    try { var t = localStorage.getItem('theme'); if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t); } catch (e) {}
  </script>
  <link rel="preload" href="/assets/fonts/Geist-Variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/styles.css">
  <script src="/assets/app.js" defer></script>
  <script type="application/ld+json">${JSON.stringify(person)}</script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <canvas class="bg-canvas" data-bg-canvas aria-hidden="true"></canvas>
${header()}

  <main id="main">
${hero()}
${experience(today)}
${skills()}
${projectSection('projects', 'Projects', c.projects)}
${projectSection('archive', 'Archive', c.archive)}
${education()}
${contact()}
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <p>© ${today.getFullYear()} ${fullName}</p>
      <p><code>200 OK</code> · Built by hand, no framework</p>
    </div>
  </footer>
</body>
</html>
`;
}
