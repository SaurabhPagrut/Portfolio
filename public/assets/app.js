// Client-side behaviour. Small, no dependencies, safe to run without any of it (the page works as plain HTML).

(() => {
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  /* ---- Theme toggle: no saved choice = follow the system ---- */
  const themeBtn = document.querySelector('[data-theme-toggle]');
  const effectiveTheme = () => root.getAttribute('data-theme') || (media.matches ? 'dark' : 'light');
  const syncThemeLabel = () => {
    if (!themeBtn) return;
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    themeBtn.setAttribute('aria-label', `Switch to ${next} theme`);
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const applyTheme = (next) => {
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (e) {
      /* storage unavailable: the choice lasts for this visit only */
    }
    syncThemeLabel();
    window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
  };

  // New theme spreads out as a circle from the click point (View Transitions API).
  // Browsers without it, and reduced-motion users, get an instant switch.
  themeBtn?.addEventListener('click', (event) => {
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';

    themeBtn.classList.remove('is-spinning');
    void themeBtn.offsetWidth; // restart the icon animation
    themeBtn.classList.add('is-spinning');

    if (!document.startViewTransition || reduceMotion.matches) {
      applyTheme(next);
      return;
    }

    // Keyboard clicks report 0,0: fall back to the button's centre.
    const rect = themeBtn.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    root.classList.add('theme-transition');
    const transition = document.startViewTransition(() => applyTheme(next));
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 650, easing: 'cubic-bezier(0.65, 0, 0.25, 1)', pseudoElement: '::view-transition-new(root)' },
        );
      })
      .catch(() => {});
    transition.finished.finally(() => root.classList.remove('theme-transition'));
  });
  media.addEventListener?.('change', syncThemeLabel);
  syncThemeLabel();

  /* ---- Mobile menu ---- */
  const menuBtn = document.querySelector('[data-menu-toggle]');
  const navList = document.querySelector('[data-nav-list]');
  const setMenu = (open) => {
    if (!menuBtn || !navList) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    navList.classList.toggle('is-open', open);
  };
  menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  navList?.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuBtn?.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuBtn.focus();
    }
  });

  /* ---- Header border once the page scrolls ---- */
  const header = document.querySelector('[data-header]');
  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Highlight the nav link for the section in view ---- */
  const links = [...document.querySelectorAll('.nav-link')];
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window && links.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) => a.removeAttribute('aria-current'));
          byId.get(entry.target.id)?.setAttribute('aria-current', 'true');
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    byId.forEach((_, id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* ---- Human / JSON toggle on sections ---- */
  document.querySelectorAll('[data-views]').forEach((section) => {
    const buttons = section.querySelectorAll('[data-view]');
    const panels = section.querySelectorAll('[data-panel]');
    buttons.forEach((btn) =>
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        panels.forEach((panel) => {
          const show = panel.dataset.panel === view;
          panel.hidden = !show;
          if (show && !reduceMotion.matches) {
            panel.classList.remove('is-entering');
            void panel.offsetWidth;
            panel.classList.add('is-entering');
          }
        });
      }),
    );
  });

  /* ---- Keep "x yrs y mos" durations current for ongoing roles ---- */
  document.querySelectorAll('[data-since]').forEach((el) => {
    const [sy, sm] = el.dataset.since.split('-').map(Number);
    const now = new Date();
    const months = (now.getFullYear() - sy) * 12 + (now.getMonth() + 1 - sm) + 1;
    const y = Math.floor(months / 12);
    const m = months % 12;
    const parts = [];
    if (y) parts.push(`${y} yr${y > 1 ? 's' : ''}`);
    if (m) parts.push(`${m} mo${m > 1 ? 's' : ''}`);
    if (parts.length) el.textContent = parts.join(' ');
  });

  /* ---- Skills: logo fallback + filters ---- */
  // If a logo can't load (offline, blocked CDN), show the monogram instead.
  document.querySelectorAll('[data-logo]').forEach((img) => {
    const fail = () => img.closest('[data-logo-wrap]')?.classList.add('is-fallback');
    if (img.complete && img.naturalWidth === 0) fail();
    else img.addEventListener('error', fail, { once: true });
  });

  const filterBar = document.querySelector('[data-skill-filters]');
  const tiles = [...document.querySelectorAll('[data-skill-grid] > li')];
  const status = document.querySelector('[data-skill-status]');
  filterBar?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn || btn.getAttribute('aria-pressed') === 'true') return;
    const filter = btn.dataset.filter;
    filterBar.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    btn.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth' });

    let shown = 0;
    tiles.forEach((tile) => {
      const match = filter === 'all' || tile.dataset.group === filter;
      tile.hidden = !match;
      tile.classList.remove('is-entering');
      if (match) {
        tile.style.setProperty('--n', shown++);
        if (!reduceMotion.matches) {
          void tile.offsetWidth;
          tile.classList.add('is-entering');
        }
      }
    });
    if (status) {
      const label = btn.firstChild.textContent.trim();
      status.textContent = filter === 'all' ? `Showing all ${shown} skills` : `Showing ${shown} ${label} skills`;
    }
  });

  /* ---- Hero status line: the real time it took to fetch this page ---- */
  const timeEl = document.querySelector('[data-status-time]');
  if (timeEl) {
    const nav = performance.getEntriesByType?.('navigation')?.[0];
    const ms = nav && nav.responseEnd > 0 ? Math.round(nav.responseEnd - nav.requestStart) : null;
    if (ms !== null && ms >= 0) {
      const reduce = reduceMotion.matches;
      setTimeout(() => {
        timeEl.textContent = `· ${ms} ms`;
        timeEl.title = 'Real time your browser took to fetch this page';
        timeEl.classList.add('is-set');
      }, reduce ? 0 : 700);
    }
  }
})();

// Interactive background: a lattice of tiny dots (the "graph paper" under a spec).
// - Dots shimmer slowly in a diagonal wave.
// - Near the cursor they spring away, grow and take the accent colour, and thin
//   "request" lines connect the cursor to the closest nodes.
// - Now and then a data packet travels along a grid line.
// Faint by design so text contrast is unaffected. Pauses when the tab is hidden;
// with prefers-reduced-motion it draws a still lattice and does not animate.

(() => {
  const canvas = document.querySelector('[data-bg-canvas]');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const RADIUS = 150; // cursor influence, px
  const PUSH = 16; // max displacement, px
  const LINKS = 6; // request lines drawn from the cursor
  const MAX_PACKETS = 3;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let spacing = 28;
  let points = []; // {bx, by, ox, oy, vx, vy, phase}
  let colors = { dot: '#636a78', hot: '#2440f5', alpha: 0.3 };
  let packets = [];
  let raf = 0;
  let last = 0;

  // Pointer: raw target, eased position, and an intensity that fades when the pointer leaves.
  const pointer = { tx: -9999, ty: -9999, x: -9999, y: -9999, active: 0, target: 0 };

  function readColors() {
    const style = getComputedStyle(root);
    colors = {
      dot: style.getPropertyValue('--particle').trim() || colors.dot,
      hot: style.getPropertyValue('--accent').trim() || colors.hot,
      alpha: parseFloat(style.getPropertyValue('--particle-alpha')) || colors.alpha,
    };
  }

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    spacing = width < 640 ? 24 : 28;
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;
    const offX = (width - (cols - 1) * spacing) / 2;
    const offY = (height - (rows - 1) * spacing) / 2;

    points = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bx = offX + c * spacing;
        const by = offY + r * spacing;
        points.push({ bx, by, ox: 0, oy: 0, vx: 0, vy: 0, phase: bx * 0.011 - by * 0.007 });
      }
    }
    packets = [];
  }

  function spawnPacket() {
    const horizontal = Math.random() < 0.6;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const lane = horizontal
      ? points[Math.floor(Math.random() * points.length)].by
      : points[Math.floor(Math.random() * points.length)].bx;
    const span = horizontal ? width : height;
    packets.push({
      horizontal,
      dir,
      lane,
      pos: dir > 0 ? -80 : span + 80,
      speed: 0.09 + Math.random() * 0.08, // px per ms
      span,
    });
  }

  function draw(time, dt) {
    ctx.clearRect(0, 0, width, height);

    // Ease pointer and its intensity for smooth, lag-free-looking motion.
    pointer.x += (pointer.tx - pointer.x) * 0.2;
    pointer.y += (pointer.ty - pointer.y) * 0.2;
    pointer.active += (pointer.target - pointer.active) * 0.08;

    const px = pointer.x;
    const py = pointer.y;
    const influence = pointer.active;
    const near = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      let tx = 0;
      let ty = 0;
      let heat = 0;

      if (influence > 0.01) {
        const dx = p.bx - px;
        const dy = p.by - py;
        const dist = Math.hypot(dx, dy);
        if (dist < RADIUS && dist > 0.001) {
          const f = 1 - dist / RADIUS;
          heat = f * f * influence;
          tx = (dx / dist) * PUSH * heat;
          ty = (dy / dist) * PUSH * heat;
          near.push({ p, dist });
        }
      }

      // Spring toward the target offset
      p.vx = (p.vx + (tx - p.ox) * 0.09) * 0.8;
      p.vy = (p.vy + (ty - p.oy) * 0.09) * 0.8;
      p.ox += p.vx;
      p.oy += p.vy;

      const x = p.bx + p.ox;
      const y = p.by + p.oy;
      const shimmer = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * 0.0007 + p.phase));

      ctx.globalAlpha = colors.alpha * shimmer * (1 - heat * 0.6);
      ctx.fillStyle = colors.dot;
      ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);

      if (heat > 0.02) {
        const size = 1.2 + heat * 1.8;
        ctx.globalAlpha = Math.min(1, heat * 1.4);
        ctx.fillStyle = colors.hot;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }

    // Request lines from the cursor to the closest nodes
    if (near.length) {
      near.sort((a, b) => a.dist - b.dist);
      ctx.strokeStyle = colors.hot;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < Math.min(LINKS, near.length); i++) {
        const { p, dist } = near[i];
        ctx.globalAlpha = 0.28 * (1 - dist / RADIUS) * influence;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.bx + p.ox, p.by + p.oy);
        ctx.stroke();
      }
    }

    // Packets travelling along grid lines, with a fading trail
    if (packets.length < MAX_PACKETS && Math.random() < dt * 0.0006) spawnPacket();
    for (let i = packets.length - 1; i >= 0; i--) {
      const k = packets[i];
      k.pos += k.speed * dt * k.dir;
      if (k.pos < -120 || k.pos > k.span + 120) {
        packets.splice(i, 1);
        continue;
      }
      const trail = 70 * k.dir;
      const x1 = k.horizontal ? k.pos : k.lane;
      const y1 = k.horizontal ? k.lane : k.pos;
      const x0 = k.horizontal ? k.pos - trail : k.lane;
      const y0 = k.horizontal ? k.lane : k.pos - trail;
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, colors.hot);
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = colors.hot;
      ctx.fillRect(x1 - 1.25, y1 - 1.25, 2.5, 2.5);
    }

    ctx.globalAlpha = 1;
  }

  function frame(time) {
    const dt = last ? Math.min(time - last, 50) : 16;
    last = time;
    draw(time, dt);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    cancelAnimationFrame(raf);
    last = 0;
    if (reduceMotion.matches) {
      pointer.target = 0;
      pointer.active = 0;
      draw(0, 0); // still lattice
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  // Pointer tracking (mouse, pen and touch). Never blocks scrolling or clicks.
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.tx = e.clientX;
      pointer.ty = e.clientY;
      if (pointer.target === 0) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
      }
      pointer.target = 1;
    },
    { passive: true },
  );
  window.addEventListener('pointerdown', (e) => {
    pointer.tx = pointer.x = e.clientX;
    pointer.ty = pointer.y = e.clientY;
    pointer.target = 1;
  }, { passive: true });
  const release = (e) => {
    if (!e || e.pointerType !== 'mouse') pointer.target = 0;
  };
  window.addEventListener('pointerup', release, { passive: true });
  window.addEventListener('pointercancel', () => (pointer.target = 0), { passive: true });
  document.addEventListener('mouseleave', () => (pointer.target = 0));
  window.addEventListener('blur', () => (pointer.target = 0));

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      build();
      if (reduceMotion.matches) draw(0, 0);
    }, 150);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else start();
  });

  const refreshColors = () => {
    readColors();
    if (reduceMotion.matches) draw(0, 0);
  };
  window.addEventListener('themechange', refreshColors);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', refreshColors);
  reduceMotion.addEventListener?.('change', start);

  readColors();
  build();
  start();
})();

// Interactive cards: any element with [data-card] reacts to the pointer.
// - A soft spotlight and a glowing border follow the cursor, starting from
//   whichever edge it entered through.
// - The card tilts a few degrees toward the cursor and eases back on leave.
// Mouse and pen only (touch taps are left alone). No tilt with reduced motion.

(() => {
  const cards = document.querySelectorAll('[data-card]');
  if (!cards.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const MAX_TILT = 5; // degrees

  // Which edge is the point closest to? Used to start the glow on the entry side.
  const entryEdge = (x, y, w, h) => {
    const d = { top: y, right: w - x, bottom: h - y, left: x };
    return Object.keys(d).reduce((a, b) => (d[a] < d[b] ? a : b));
  };

  cards.forEach((card) => {
    const flat = card.hasAttribute('data-card-flat');
    let rect = null;
    let frame = 0;
    let px = 0;
    let py = 0;

    const update = () => {
      frame = 0;
      if (!rect) return;
      const x = px - rect.left;
      const y = py - rect.top;
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
      // Flat cards (e.g. the contact form) get the glow but never tilt: moving text while typing is distracting.
      if (!reduceMotion.matches && !flat) {
        const nx = x / rect.width - 0.5; // -0.5 .. 0.5
        const ny = y / rect.height - 0.5;
        card.style.setProperty('--ry', `${(nx * MAX_TILT).toFixed(2)}deg`);
        card.style.setProperty('--rx', `${(-ny * MAX_TILT).toFixed(2)}deg`);
      }
    };

    card.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      rect = card.getBoundingClientRect();
      px = e.clientX;
      py = e.clientY;
      card.dataset.enter = entryEdge(px - rect.left, py - rect.top, rect.width, rect.height);
      card.classList.add('is-hover');
      update();
    });

    card.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || !rect) return;
      px = e.clientX;
      py = e.clientY;
      if (!frame) frame = requestAnimationFrame(update);
    });

    card.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'touch') return;
      // Keep the glow where the pointer left so it fades out on that side.
      cancelAnimationFrame(frame);
      frame = 0;
      rect = null;
      card.classList.remove('is-hover');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });

    // Layout can shift on scroll/resize while hovering
    window.addEventListener('scroll', () => rect && (rect = card.getBoundingClientRect()), { passive: true });
  });
})();

// Contact section: copy buttons and the message form (handled by Netlify Forms).

(() => {
  /* ---- Copy buttons ---- */
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      const done = () => {
        btn.classList.add('is-copied');
        const label = btn.getAttribute('aria-label');
        btn.setAttribute('aria-label', 'Copied');
        setTimeout(() => {
          btn.classList.remove('is-copied');
          btn.setAttribute('aria-label', label);
        }, 1600);
      };
      try {
        await navigator.clipboard.writeText(text);
        done();
      } catch (e) {
        // Clipboard blocked: select the visible value so the user can copy it themselves.
        const value = btn.parentElement.querySelector('.contact-value');
        if (value) {
          const range = document.createRange();
          range.selectNodeContents(value);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    });
  });

  /* ---- Message form ---- */
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const result = document.querySelector('[data-form-result]');
  const resultCode = document.querySelector('[data-result-code]');
  const resultBody = document.querySelector('[data-result-body]');
  const submit = form.querySelector('[data-submit]');
  const submitLabel = form.querySelector('[data-submit-label]');
  const directEmail = document.querySelector('.contact-method a[href^="mailto:"]')?.textContent.trim() || '';

  const rules = {
    name: (v) => (v.trim().length < 2 ? 'Please enter your name.' : ''),
    email: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'Please enter a valid email address, like you@company.com.' : ''),
    subject: (v) => (v.trim().length < 3 ? 'Please add a short subject.' : ''),
    message: (v) => (v.trim().length < 10 ? 'Please write a message of at least 10 characters.' : ''),
  };

  const setError = (field, message) => {
    const el = form.elements[field];
    const out = form.querySelector(`[data-error-for="${field}"]`);
    el.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (out) out.textContent = message;
  };

  const validate = () => {
    let first = null;
    Object.entries(rules).forEach(([field, rule]) => {
      const message = rule(form.elements[field].value);
      setError(field, message);
      if (message && !first) first = form.elements[field];
    });
    return first;
  };

  // Clear a field's error as soon as it becomes valid
  Object.keys(rules).forEach((field) => {
    form.elements[field].addEventListener('input', () => {
      if (form.elements[field].getAttribute('aria-invalid') === 'true') setError(field, rules[field](form.elements[field].value));
    });
  });

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const renderJson = (obj) => {
    const entries = Object.entries(obj);
    const lines = entries.map(
      ([k, v], i) =>
        `<span class="line">  <span class="j-key">"${esc(k)}"</span><span class="j-p">: </span><span class="j-str">"${esc(v)}"</span>${i < entries.length - 1 ? '<span class="j-p">,</span>' : ''}</span>`,
    );
    return `<span class="line"><span class="j-p">{</span></span>${lines.join('')}<span class="line"><span class="j-p">}</span></span>`;
  };

  const showResult = (ok, code, body) => {
    resultCode.textContent = code;
    resultBody.innerHTML = renderJson(body);
    result.classList.toggle('is-error', !ok);
    form.hidden = true;
    result.hidden = false;
    result.focus();
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const invalid = validate();
    if (invalid) {
      invalid.focus();
      return;
    }

    const data = new FormData(form);
    const name = data.get('name').toString().trim().split(/\s+/)[0];

    submit.disabled = true;
    submitLabel.textContent = 'Sending…';
    try {
      // Netlify Forms: post the form url-encoded to the site; Netlify stores it and emails it on.
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      });
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      showResult(true, '201 Created', {
        status: 'delivered',
        reply_to: data.get('email').toString().trim(),
        message: `Thanks, ${name}. I'll get back to you soon.`,
      });
      form.reset();
    } catch (err) {
      const code = err.status === 429 ? '429 Too many requests' : `${err.status || 502} Not sent`;
      showResult(false, code, {
        error: err.status === 429 ? 'too_many_requests' : 'send_failed',
        message: `${err.serverMessage || "Your message didn't go through. Please try again."} You can also email me at ${directEmail}.`,
      });
    } finally {
      submit.disabled = false;
      submitLabel.textContent = 'Send message';
    }
  });

  document.querySelector('[data-form-reset]')?.addEventListener('click', () => {
    result.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });
})();
