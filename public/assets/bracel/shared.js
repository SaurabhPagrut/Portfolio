/* What the content script, the service worker and the popup agree on: the settings and their defaults, how a site is
   named, and the activity and coat lists the popup shows (the engine has its own copy; a test keeps them equal). */
// Firefox and Safari: their promise-based `browser` is the same API, so the rest of the code can say `chrome` everywhere
if (globalThis.browser && globalThis.browser.runtime && globalThis.chrome !== globalThis.browser) try { globalThis.chrome = globalThis.browser; } catch (_) {}
globalThis.BRACEL = globalThis.BRACEL || {
  // chrome.storage.sync: settings that follow the user
  DEF: { coat: "cloud", size: 0.2, sound: true, acts: [] },
  // the files the extension injects, in order (the registered content script uses the same list)
  FILES: ["src/shared.js", "src/engine.js", "src/spots.js", "src/content.js"],
  SHORTCUT: "Alt+Shift+B",
  // a site is its scheme and host name (no port: match patterns have none); its match pattern covers every page on it
  siteOf(url) { try { const u = new URL(url); return /^(https?|file):$/.test(u.protocol) ? u.protocol + "//" + u.hostname : null; } catch (_) { return null; } },
  patternOf(site) { return site + "/*"; },
  ACTS: [["idle", "Stand"], ["sit", "Sit"], ["look", "Look around"], ["sniff", "Sniff"], ["groom", "Groom"], ["scratch_ear", "Scratch ear"],
    ["scratch_pane", "Paw at screen"], ["scratch_wall", "Scratch wall"], ["knead", "Knead & purr"], ["play_moth", "Play (moth)"], ["play_yarn", "Play (yarn)"],
    ["yawn", "Yawn"], ["stretch", "Stretch"], ["nap", "Nap"], ["walk", "Walk"], ["hop", "Jump to another spot"], ["hang", "Hang under a header or box"],
    ["peek", "Hide behind an edge"], ["away", "Leave & return"], ["petted", "Petted"], ["annoyed", "Annoyed"], ["hunt", "Hunt & pounce"]],
  // name and swatch (head colour on a light page) of each coat
  COATS: [["cloud", "Cloud", "#e2e8f0"], ["slate", "Slate", "#334155"], ["tuxedo", "Slate tuxedo", "#334155"], ["blue", "Accent blue", "#3a5a92"], ["amber", "Amber", "#d97706"]],
  CREDIT: "Bracel's look is adapted from Bento Cat by mikewirsch (rive.app/marketplace/21131-39716-bento-cat), licensed CC BY 4.0 (creativecommons.org/licenses/by/4.0). Redrawn and animated in code; walking, hanging, jumping, hiding, spots, behaviour and coats are our own."
};
