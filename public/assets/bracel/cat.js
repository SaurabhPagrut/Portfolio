/* Bracel on the portfolio: the cat from github.com/SaurabhPagrut/BracelTheCat (bracel.saurabhpagrut.in),
   started the way that project's site/cat.js starts it, without the extension.
   shared.js, engine.js and spots.js are copied unchanged from BracelTheCat's src/; load them first, then this.
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
  const engine = globalThis.BracelEngine({
    store: { get: (k, d) => (k in S ? S[k] : d), set: (k, v) => { S[k] = v; } },
    surfaces: (m) => spots.surfaces(m),
    overlay: () => spots.overlay(),
    theme: () => spots.theme(),
    mount: (cv) => root.append(cv),
    onPageChange: (f) => spots.onChange(f),
    onThemeChange: (f) => spots.onTheme(f),
  });
  spots.start();
  engine.set(true);
})();
