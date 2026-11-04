/* Bracel's spots on any website: where it can stand (the top edge of a box or image, the floor inside a box, the bottom of
   the window) and hang (under a header or a box), plus the dialogs and menus to keep away from and whether the page is
   light or dark. Cheap, cautious and boring (guidelines §4):
   - a scan walks the page in slices of at most ~4 ms (requestIdleCallback where it exists), at most every 2.5 s and
     after scrolling or resizing settles; it keeps the elements and what kind of edge each one has, not their positions;
   - surfaces() re-reads only those elements' rectangles, so the spots follow the page between scans;
   - the bottom of the window is always a floor, so Bracel has a home on any page.
   Nothing here changes the page: it only reads layout and listens (passive, capture). */
globalThis.BracelSpots = globalThis.BracelSpots || function createSpots(opts = {}) {
  const own = opts.own || (() => false);   // the host's own element, never a spot
  const doc = document, de = () => doc.documentElement;
  const vw = () => de().clientWidth || innerWidth, vh = () => de().clientHeight || innerHeight;
  const now = () => performance.now();
  const SLICE = 4, MAX_VISIT = 15000, MAX_SPOTS = 48, MAX_FOUND = 160, MIN_GAP = 400, EVERY = 2500;

  // the bottom of the window, as an element-like object the engine can stand on
  const VIEW = { isConnected: true, tagName: "VIEWPORT", getBoundingClientRect() { const w = vw(), h = vh(); return { left: 0, top: 0, right: w, bottom: h, width: w, height: h, x: 0, y: 0 }; } };

  /* ---------- colours: is a background really there, and is the page dark ---------- */
  const rgba = s => { const m = /rgba?\(([^)]+)\)/.exec(s || ""); if (!m) return null; const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const solid = c => !!c && c.a > 0.12;
  const sameColour = (a, b) => !!a && !!b && Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) < 18;
  const lum = c => (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
  // the colour a box sits on: its nearest ancestor with a solid background, or the page's
  function behind(el) {
    for (let p = el.parentElement, i = 0; p && i < 8; p = p.parentElement, i++) { const c = rgba(getComputedStyle(p).backgroundColor); if (solid(c)) return c; }
    return pageBg();
  }
  function pageBg() {
    for (const el of [doc.body, de()]) { if (!el) continue; const c = rgba(getComputedStyle(el).backgroundColor); if (solid(c)) return c; }
    const cs = de() && getComputedStyle(de()).colorScheme || "";
    return /dark/.test(cs) && !/light/.test(cs) ? { r: 18, g: 18, b: 18, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
  }
  let themeNow = "light";
  const readTheme = () => (themeNow = lum(pageBg()) < 0.42 ? "dark" : "light");

  /* ---------- what to keep away from ---------- */
  const EDIT = "input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]):not([type=color]),textarea,select,[contenteditable=''],[contenteditable=true],[role=textbox]";
  const POPS = "dialog[open],[aria-modal=true],[role=dialog],[role=alertdialog],[role=menu],[role=listbox],[role=tooltip],:popover-open";
  const rectVisible = r => r.width > 1 && r.height > 1 && r.bottom > 0 && r.right > 0 && r.top < vh() && r.left < vw();
  function shown(el) { const cs = getComputedStyle(el); return cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > 0.05; }
  let modal = false, pops = [];
  // dialogs, menus and popovers that are open now; a modal one (or a fixed layer over most of the window) sends Bracel away
  function readOverlays() {
    let m = false; const out = [];
    let list = []; try { list = doc.querySelectorAll(POPS); } catch (_) { list = doc.querySelectorAll(POPS.replace(",:popover-open", "")); }
    for (const el of list) {
      if (own(el)) continue; const r = el.getBoundingClientRect(); if (!rectVisible(r) || !shown(el)) continue;
      let isModal = el.getAttribute("aria-modal") === "true"; try { isModal = isModal || el.matches("dialog:modal"); } catch (_) {}
      if (isModal || r.width * r.height > vw() * vh() * 0.5) m = true; else out.push(r);
    }
    for (const el of layers) { if (!el.isConnected) continue; const r = el.getBoundingClientRect(); if (r.width * r.height > vw() * vh() * 0.55 && shown(el)) m = true; }
    modal = m; pops = out;
  }
  // the element being typed in, through open shadow roots
  function editing() {
    let a = doc.activeElement; while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
    if (!a || a === doc.body || a === de()) return null;
    try { return a.matches(EDIT) || a.isContentEditable ? a.getBoundingClientRect() : null; } catch (_) { return null; }
  }

  /* ---------- the scan ---------- */
  // found: el -> { ledge, floor, bar, head, sticky, img } flags; avoid: video players, maps, frames, editors; sidebars give walls
  let found = new Map(), avoidEls = [], fields = [], sidebars = [], layers = [], fixedEls = [], nx = null;   // nx: the same lists, being built by a scan
  let next = null, cursor = 0, all = null, lastScan = -1e9, scanning = false, timer = 0, idleId = 0;
  const grpOf = new WeakMap(); let grpN = 0;
  const grp = el => { let g = grpOf.get(el); if (g == null) { g = ++grpN; grpOf.set(el, g); } return g; };
  const SKIP = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE", "BR", "OPTION", "HEAD", "TITLE", "PATH", "G", "DEFS", "BRACEL-CAT", "SOURCE", "TRACK", "WBR", "AREA", "MAP", "PARAM"]);
  const AVOID = new Set(["VIDEO", "IFRAME", "CANVAS", "EMBED", "OBJECT"]);
  const IMG = new Set(["IMG", "PICTURE", "FIGURE"]);
  const BOXY = new Set(["TABLE", "PRE", "BLOCKQUOTE", "FIELDSET"]);
  // controls are for clicking: Bracel doesn't stand on them
  const CONTROL = new Set(["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA", "LABEL", "SUMMARY"]), FIELD = new Set(["INPUT", "TEXTAREA", "SELECT"]);
  const rotated = t => { if (!t || t === "none") return false; const m = /matrix\(([^)]+)\)/.exec(t); if (!m) return true; const p = m[1].split(",").map(Number); return Math.abs(p[1]) > 0.01 || Math.abs(p[2]) > 0.01; };
  function look(el, minW) {
    const tag = el.tagName; if (SKIP.has(tag) || el.ownerSVGElement || own(el)) return;
    const r = el.getBoundingClientRect(); if (!rectVisible(r)) return;
    if (AVOID.has(tag)) { if (r.width >= 160 && r.height >= 100) nx.avoid.push(el); return; }
    // fields to type in stay uncovered even before they are focused
    if (FIELD.has(tag)) { if (r.width >= 40 && r.height >= 14 && el.type !== "hidden") nx.fields.push(el); return; }
    if (r.width < minW || r.height < 14) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || +cs.opacity < 0.5 || rotated(cs.transform)) return;
    const W = vw(), Hh = vh(), pos = cs.position, fixed = pos === "fixed" || pos === "sticky";
    const role = el.getAttribute("role"), head = tag === "HEADER" || tag === "NAV" || role === "banner" || role === "navigation";
    // fixed layers: a bar along the top is somewhere to hang; anything big and fixed may be a cookie wall or a lightbox
    if (fixed) nx.fixed.push(el);
    if (pos === "fixed" && r.width * r.height > W * Hh * 0.4 && (+cs.zIndex || 0) >= 1) nx.layers.push(el);
    if ((tag === "ASIDE" || tag === "NAV" || role === "navigation" || role === "complementary") && r.height > Hh * 0.5 && r.width < W * 0.35) nx.sides.push(el);
    const bg = rgba(cs.backgroundColor), border = parseFloat(cs.borderTopWidth) > 0 && solid(rgba(cs.borderTopColor)) && cs.borderTopStyle !== "none";
    const bgEdge = solid(bg) && !sameColour(bg, behind(el)), shadow = cs.boxShadow && cs.boxShadow !== "none", bgImg = cs.backgroundImage && cs.backgroundImage !== "none";
    const img = IMG.has(tag) || (bgImg && r.height > 60), edgy = border || bgEdge || shadow || img || BOXY.has(tag);
    const f = {};
    if (fixed && r.top <= 4 && r.height < Hh * 0.3 && r.width > W * 0.5) { f.bar = 0.9; f.sticky = true; }
    else if (head && r.top < Hh * 0.6 && r.width > W * 0.4 && (edgy || r.top <= 4)) f.bar = 0.7;
    if (edgy && !f.sticky && pos !== "fixed" && !CONTROL.has(tag)) {
      f.ledge = img ? 1.1 : 1;
      // inside a box (not a header: standing in the site's menu bar would cover it)
      if (!img && !head && (bgEdge || border || shadow) && r.height > 60) { f.floor = 0.8; f.bar = f.bar || 0.15; }
    }
    if (f.ledge || f.floor || f.bar) { f.a = r.width * Math.min(r.height, 400); next.set(el, f); }
  }
  function step(deadline) {
    const t0 = now(), minW = metrics.minW;
    while (cursor < all.length && cursor < MAX_VISIT) {
      look(all[cursor++], minW);
      if ((cursor & 31) === 0 && now() - t0 > (deadline ? Math.min(SLICE, deadline.timeRemaining()) : SLICE)) return false;
    }
    return true;
  }
  // a page full of boxes (tables, grids) keeps only the biggest ones
  function finish() { if (next.size > MAX_FOUND) next = new Map([...next].sort((p, q) => q[1].a - p[1].a).slice(0, MAX_FOUND)); found = next; next = null; all = null; scanning = false;
    avoidEls = nx.avoid; fields = nx.fields; sidebars = nx.sides; layers = nx.layers; fixedEls = nx.fixed; nx = null; readOverlays(); readTheme(); fire(); }
  function begin() { next = new Map(); nx = { avoid: [], sides: [], layers: [], fixed: [], fields: [] }; cursor = 0; all = de() ? de().getElementsByTagName("*") : []; scanning = true; lastScan = now(); }
  function slice(deadline) { idleId = 0; if (!scanning) return; if (step(deadline)) finish(); else later(); }
  const later = () => { idleId = typeof requestIdleCallback === "function" ? requestIdleCallback(slice, { timeout: 600 }) : setTimeout(() => slice(null), 30); };
  // ask for a scan: soon after the last one, never two at once, never while the tab is hidden
  function scan() {
    if (stopped || doc.hidden) return; clearTimeout(timer);
    const wait = Math.max(0, lastScan + MIN_GAP - now());
    timer = setTimeout(() => { if (scanning || stopped) return; begin(); later(); }, wait);
  }
  function scanNow() { begin(); while (!step(null)); finish(); }

  /* ---------- the spots now, from the scan and the live rectangles ---------- */
  let metrics = { h: 55, minW: 60, half: 24 };
  const hits = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
  const box = (r, m = 0) => ({ l: r.left - m, r: r.right + m, t: r.top - m, b: r.bottom + m });
  // the part of [x0, x1] (page px) left after cutting out the rectangles in the cat's way; keeps the longest piece
  function trim(x0, x1, t, b, rects) {
    let segs = [[x0, x1]];
    for (const o of rects) { if (o.t >= b || o.b <= t) continue; const out = []; for (const [a, c] of segs) { if (o.r <= a || o.l >= c) { out.push([a, c]); continue; } if (o.l > a) out.push([a, o.l]); if (o.r < c) out.push([o.r, c]); } segs = out; }
    return segs.reduce((best, s) => (s[1] - s[0] > best[1] - best[0] ? s : best), [0, -1]);
  }
  // nothing else (a sticky header, a dialog, a cookie banner) is drawn over this edge right now
  function onTop(el, x, y) {
    if (y < 0 || y >= vh() || x < 0 || x >= vw()) return false;
    const hit = doc.elementFromPoint(x, y); if (!hit || own(hit)) return true;
    return hit === el || el.contains(hit) || hit.contains(el);
  }
  function surfaces(m) {
    if (m) metrics = { ...m }; m = metrics;
    if (stopped || modal) return [];
    const W = vw(), Hh = vh(), h = m.h, out = [], typing = editing(), ed = typing ? [box(typing, 40)] : [];
    // the cat must not stand in a fixed bar's shadow: the lowest fixed bar along the top is the ceiling
    let ceil = 0; for (const el of fixedEls) { if (!el.isConnected) continue; const r = el.getBoundingClientRect(); if (r.top <= 4 && r.height < Hh * 0.3 && r.width > W * 0.5) ceil = Math.max(ceil, r.bottom); }
    const live = list => list.filter(e => e.isConnected).map(e => e.getBoundingClientRect()).filter(rectVisible);
    const avoid = live(avoidEls).map(r => box(r, 8)).concat(live(fields).map(r => box(r)), pops.map(r => box(r, 12)), ed);
    // standing, it keeps out of the site's header and menu bars (it may hang under them)
    const heads = []; for (const [el, f] of found) if (f.bar >= 0.7 && el.isConnected) heads.push(box(el.getBoundingClientRect()));
    const stand = avoid.concat(heads);
    const sides = sidebars.filter(e => e.isConnected).map(e => e.getBoundingClientRect());
    const add = (el, kind, r, x0, x1, walls, w, line, keepOut = kind === "bar" ? avoid : stand) => {
      const t = kind === "bar" ? line : line - h, b = kind === "bar" ? line + h : line;
      const [a, c] = trim(Math.max(x0, 2), Math.min(x1, W - 2), t + 2, b - 2, keepOut); if (c - a < m.minW) return;
      const sp = { el, kind, x0: a - r.left, x1: c - r.left, walls: walls.map(v => v - r.left), w, grp: grp(el) }; out.push(sp); return sp;
    };
    for (const [el, f] of found) {
      if (!el.isConnected) continue; const r = el.getBoundingClientRect(); if (!rectVisible(r) || r.width < m.minW) continue;
      if (f.ledge && r.top - h >= ceil - 6 && r.top <= Hh - 2 && onTop(el, r.left + r.width / 2, r.top + 2)) {
        const walls = [];
        for (const s of sides) { if (r.left - s.right >= 0 && r.left - s.right < 30) walls.push(s.right); if (s.left - r.right >= 0 && s.left - r.right < 30) walls.push(s.left); }
        add(el, "ledge", r, r.left + 2, r.right - 2, walls, f.ledge, r.top);
      }
      if (f.floor && r.height >= h + 16 && r.bottom - 3 <= Hh - 2 && r.bottom - 3 - h >= Math.max(ceil, r.top) - 6 && onTop(el, r.left + r.width / 2, r.bottom - 6))
        add(el, "floor", r, r.left + 4, r.right - 4, [r.left + 2, r.right - 2], f.floor, r.bottom - 3);
      if (f.bar && r.bottom >= 0 && r.bottom + h <= Hh && (f.sticky || r.bottom >= ceil) && onTop(el, r.left + r.width / 2, r.bottom - 3))
        add(el, "bar", r, r.left + 8, r.right - 8, [], f.bar, r.bottom);
    }
    // keep the strongest of the spots that share an edge (nested boxes often line up), then the most useful few
    out.sort((p, q) => (q.x1 - q.x0) * q.w - (p.x1 - p.x0) * p.w);
    const kept = [];
    for (const s of out) {
      const r = s.el.getBoundingClientRect(), y = s.kind === "bar" ? r.bottom : s.kind === "floor" ? r.bottom - 3 : r.top, l = r.left + s.x0, rr = r.left + s.x1;
      if (kept.some(k => k.kind === s.kind && Math.abs(k.y - y) < 4 && Math.min(rr, k.rr) - Math.max(l, k.l) > 0.5 * (rr - l))) continue;
      kept.push({ s, y, l, rr }); if (kept.length >= MAX_SPOTS) break;
    }
    const res = kept.map(k => k.s);
    // the bottom of the window: always there, unless something is being typed in or a popup is open right above it
    const home = add(VIEW, "floor", VIEW.getBoundingClientRect(), 4, W - 4, [1, W - 1], 0.6, Hh - 3, pops.map(r => box(r, 12)).concat(ed)); if (home) res.push(home);
    return res;
  }
  // the engine asks several times in a row; the answer holds for a moment, or until the page changes
  let memo = null, memoT = 0;
  function cached(m) {
    if (memo && (!m || m.h === metrics.h && m.minW === metrics.minW) && now() - memoT < 120) return memo;
    memo = surfaces(m); memoT = now(); return memo;
  }

  /* ---------- watching the page ---------- */
  const subs = [], themeSubs = []; let stopped = true, mo = null, every = 0, scrollT = 0, moT = 0, lastMo = 0;
  function fire() { memo = null; for (const f of subs) try { f(); } catch (_) {} }
  function changed() { readOverlays(); const t = themeNow; readTheme(); if (t !== themeNow) themeSubs.forEach(f => f()); fire(); scan(); }
  // mutations come in bursts on busy pages: at most one look every 600 ms
  function onMutate() { const t = now(); if (moT) return; moT = setTimeout(() => { moT = 0; lastMo = now(); changed(); }, Math.max(0, lastMo + 600 - t)); }
  const onScroll = () => { clearTimeout(scrollT); scrollT = setTimeout(() => { readOverlays(); scan(); fire(); }, 160); };
  const onFocus = () => setTimeout(fire, 0);
  const onVis = () => { if (!doc.hidden) changed(); };
  const scheme = (() => { try { return matchMedia("(prefers-color-scheme: dark)"); } catch (_) { return null; } })();
  const L = { passive: true, capture: true };
  function start() {
    if (!stopped) return; stopped = false; readTheme(); scanNow();
    if (typeof MutationObserver === "function") { mo = new MutationObserver(onMutate); mo.observe(de(), { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden", "open", "aria-modal", "aria-expanded", "data-theme"] }); }
    addEventListener("scroll", onScroll, L); addEventListener("resize", onScroll, L);
    addEventListener("focusin", onFocus, L); addEventListener("focusout", onFocus, L);
    doc.addEventListener("visibilitychange", onVis); scheme && scheme.addEventListener && scheme.addEventListener("change", changed);
    every = setInterval(() => { if (!doc.hidden) { readOverlays(); scan(); } }, EVERY);
  }
  function stop() {
    if (stopped) return; stopped = true; mo && mo.disconnect(); mo = null; clearInterval(every); clearTimeout(timer); clearTimeout(scrollT); clearTimeout(moT); moT = 0;
    if (idleId) { typeof cancelIdleCallback === "function" ? cancelIdleCallback(idleId) : clearTimeout(idleId); idleId = 0; }
    scanning = false; next = null; nx = null; all = null;
    removeEventListener("scroll", onScroll, L); removeEventListener("resize", onScroll, L);
    removeEventListener("focusin", onFocus, L); removeEventListener("focusout", onFocus, L);
    doc.removeEventListener("visibilitychange", onVis); scheme && scheme.removeEventListener && scheme.removeEventListener("change", changed);
  }
  return {
    start, stop, surfaces: cached, scanNow, VIEW,
    overlay: () => modal, theme: () => themeNow,
    onChange: f => subs.push(f), onTheme: f => themeSubs.push(f),
    debug: () => ({ found: found.size, avoid: avoidEls.length, sidebars: sidebars.length, modal, pops: pops.length, theme: themeNow, scanning })
  };
};
