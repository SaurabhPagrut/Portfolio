/* Bracel on the portfolio: the cat from github.com/SaurabhPagrut/BracelTheCat (bracel.saurabhpagrut.in),
   started the way that project's site/cat.js starts it, without the extension.
   shared.js, engine.js and spots.js are copied unchanged from BracelTheCat's src/, and new-actions.js from its demo/
   (the roadmap actions: chase its tail, loaf, box, laser dot, knock it off, zoomies, bird watching, roll over).
   Load them first, then this.
   Settings live in memory for the visit; nothing is saved and nothing is sent. Sound starts off here. */
(() => {
  const B = globalThis.BRACEL;
  if (!B || !globalThis.BracelEngine || !globalThis.BracelSpots) return;
  const S = { ...B.DEF, size: 0.2, sound: false };
  const hostEl = document.createElement('bracel-cat');
  hostEl.setAttribute('aria-hidden', 'true');
  const root = hostEl.attachShadow({ mode: 'closed' });
  const st = document.createElement('style');
  st.textContent =
    ':host{all:initial!important;display:block!important;position:fixed!important;left:0!important;top:0!important;width:0!important;height:0!important;pointer-events:none!important;z-index:2147483646!important}' +
    'canvas{position:fixed;left:0;top:0;pointer-events:none;contain:strict;z-index:2147483646;visibility:hidden}';
  root.append(st);
  document.documentElement.append(hostEl);
  const spots = globalThis.BracelSpots({ own: (el) => el === hostEl });
  // The extra actions hook into the engine's internals (test: true); without that file it runs as the extension does.
  const extra = globalThis.BracelNewActions ? globalThis.BracelNewActions() : null;
  const engine = globalThis.BracelEngine({
    store: { get: (k, d) => (k in S ? S[k] : d), set: (k, v) => { S[k] = v; } },
    test: !!extra,
    pose: extra && extra.pose,
    paint: extra && extra.paint,
    surfaces: (m) => spots.surfaces(m),
    overlay: () => spots.overlay(),
    theme: () => spots.theme(),
    mount: (cv) => root.append(cv),
    onPageChange: (f) => spots.onChange(f),
    onThemeChange: (f) => spots.onTheme(f),
  });
  if (extra) {
    try {
      extra.install(engine);
      extra.mix(true); // Bracel picks the new actions on its own, alongside its usual ones
    } catch (e) {}
  }
  spots.start();
  engine.set(true);
})();
