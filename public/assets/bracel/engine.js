/* Bracel, a round cartoon cat that lives on the edges of the websites you visit. Drawn on a small canvas that follows it
   along the spots the host finds (box tops, the floors of boxes, the bottom of the window, under headers). Its body is a
   handful of parts (a bean-shaped torso, a head, four two-bone legs and a tail chain) whose numbers ease towards each
   activity's pose every frame, so it moves smoothly instead of swapping pictures.
   It stands, sits, looks around, sniffs, grooms, scratches its ear, paws at the screen, scratches a wall, kneads and
   purrs, plays with a moth or a ball of yarn, yawns, stretches, naps, walks, hops between spots, hangs, hides behind an
   edge, leaves and comes back, purrs when stroked, gets annoyed when clicked three times and pounces when you wiggle the
   pointer above its spot. It never takes clicks, focus or typing (pointer-events: none), and with reduced motion it
   sits still.
   This file is the engine only: it knows nothing about the page. The host (src/content.js, or a demo page) gives it
   storage, the spots, overlay detection, the page theme and where to put the canvas; see createBracel(host) below.
   Started from Bracely's cat.js (Bracely #103, 30 Oct 2026).
   Credit: Bracel's look is adapted from Bento Cat by mikewirsch (rive.app/marketplace/21131-39716-bento-cat), licensed
   CC BY 4.0 (creativecommons.org/licenses/by/4.0). Redrawn and animated in code; walking, hanging, jumping, hiding,
   spots, behaviour and coats are our own. */
/* host: { store: { get(k, d), set(k, v) }, surfaces({ h, minW, half }) -> [{ el, kind, x0, x1, walls, w, grp }],
   overlay() -> bool, theme() -> "light" | "dark", mount(canvas), onPageChange(fn), onThemeChange(fn),
   onShown(shown) (optional), test (optional: exposes internals as api._t) } */
globalThis.BracelEngine = globalThis.BracelEngine || function createBracel(host) {
  // Coats (slate, the blue accent, amber, cloud); each has a light-page and a dark-page version
  const COATS = {
    slate: {
      name: 'Slate',
      headTop: '#334155', headBot: '#1e293b', earOuter: '#2b3648', earInner: '#0f172a',
      body: '#1e293b', bodySheen: 'rgba(226, 232, 240, 0.18)', nearLeg: '#1e293b', farLeg: '#111827', tail: '#1e293b',
      eyeBg: '#dbeafe', pupil: '#0f172a', features: '#dbeafe', pawPad: '#93c5fd', bib: null,
      dark: { headTop: '#526075', headBot: '#3b4759', earOuter: '#475569', earInner: '#1e293b', body: '#3b4759', nearLeg: '#3b4759', farLeg: '#2b3545', tail: '#3b4759', bodySheen: 'rgba(226, 232, 240, 0.2)' }
    },
    tuxedo: {
      name: 'Slate tuxedo',
      headTop: '#334155', headBot: '#1e293b', earOuter: '#2b3648', earInner: '#0f172a',
      body: '#1e293b', bodySheen: 'rgba(226, 232, 240, 0.16)', nearLeg: '#1e293b', farLeg: '#111827', tail: '#1e293b',
      eyeBg: '#dbeafe', pupil: '#0f172a', features: '#f1f5f9', pawPad: '#f1f5f9', bib: '#f1f5f9',
      dark: { headTop: '#526075', headBot: '#3b4759', earOuter: '#475569', earInner: '#1e293b', body: '#3b4759', nearLeg: '#3b4759', farLeg: '#2b3545', tail: '#3b4759' }
    },
    blue: {
      name: 'Accent blue',
      headTop: '#3a5a92', headBot: '#27406e', earOuter: '#30507f', earInner: '#1a2d52',
      body: '#27406e', bodySheen: 'rgba(219, 234, 254, 0.22)', nearLeg: '#27406e', farLeg: '#1b2f55', tail: '#27406e',
      eyeBg: '#dbeafe', pupil: '#0f172a', features: '#dbeafe', pawPad: '#93c5fd', bib: null,
      dark: { headTop: '#4f74b3', headBot: '#3a5a92', earOuter: '#44659e', earInner: '#27406e', body: '#3a5a92', nearLeg: '#3a5a92', farLeg: '#2b4677', tail: '#3a5a92' }
    },
    amber: {
      name: 'Amber',
      headTop: '#d97706', headBot: '#b45309', earOuter: '#c2650a', earInner: '#fcd9b6',
      body: '#b45309', bodySheen: 'rgba(254, 243, 199, 0.3)', nearLeg: '#b45309', farLeg: '#8a3f07', tail: '#b45309',
      eyeBg: '#fef3c7', pupil: '#0f172a', features: '#fff7ed', pawPad: '#fde68a', bib: null,
      dark: { headTop: '#f59e0b', headBot: '#d97706', body: '#d97706', nearLeg: '#d97706', farLeg: '#a85d06', tail: '#d97706' }
    },
    cloud: {
      name: 'Cloud (light)',
      headTop: '#e2e8f0', headBot: '#cbd5e1', earOuter: '#cbd5e1', earInner: '#94a3b8',
      body: '#cbd5e1', bodySheen: 'rgba(255, 255, 255, 0.55)', nearLeg: '#cbd5e1', farLeg: '#94a3b8', tail: '#cbd5e1',
      eyeBg: '#ffffff', pupil: '#0f172a', features: '#334155', pawPad: '#93c5fd', bib: null,
      dark: { headTop: '#f1f5f9', headBot: '#e2e8f0', body: '#e2e8f0', nearLeg: '#e2e8f0', farLeg: '#b8c3d1', tail: '#e2e8f0', earOuter: '#e2e8f0' }
    }
  };
  const palCache = {};
  function paletteFor() {
    const k = (sim.coat in COATS ? sim.coat : 'slate') + (sim.bgTheme === 'dark' ? ':d' : ':l');
    if (!palCache[k]) { const c = COATS[k.split(':')[0]]; palCache[k] = k.endsWith(':d') ? { ...c, ...c.dark } : c; }
    return palCache[k];
  }

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  function playPurrGrain(intensity = 0.5) {
    if (!audioEnabled || !audioCtx) return;
    const now = audioCtx.currentTime;
    if (now - lastPurrPulse < 0.045) return;
    lastPurrPulse = now;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(27 + Math.random() * 4, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.035 * intensity, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.044);
  }

  function playSoftChirp() {
    if (!audioEnabled || !audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(820, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.22);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }
  const POSE0 = {
      // Deformable Bean Torso (Rump sphere & Chest sphere + dorsal arch)
      hx: -86, hy: -112, hr: 45,
      cx: -16, cy: -114, cr: 44,
      arch: 8,
      // Plump Bracel Head
      headX: 4, headY: -178,
      headRoll: 0,
      earL: 0, earR: 0,
      // Pupils & Eyelids (matching Bracel's PupilsX, PupilsY, Blink)
      pupilX: 2.0, pupilY: 1.0, pupilScale: 1.0,
      blink: 0.0, // 0 = open, 1 = closed
      happySquint: 0.0, // lower eyelid rise
      browLift: 0.0,
      mouthOpen: 0.0,
      tongueOut: 0.0,
      purrVib: 0.0,
      // 4 Tapered 2-Bone Legs: Root(rx,ry), Knee/Elbow(kx,ky), Paw(px,py)
      brRx: -94, brRy: -106, brKx: -98, brKy: -56, brPx: -96, brPy: -9,
      frRx: -4,  frRy: -108, frKx: -2,  frKy: -56, frPx: 0,   frPy: -9,
      blRx: -80, blRy: -102, blKx: -82, blKy: -54, blPx: -80, blPy: -8,
      flRx: -20, flRy: -104, flKx: -18, flKy: -54, flPx: -16, flPy: -8,
      flInFrontOfHead: 0,
      blInFrontOfHead: 0,
      // 4-Bone Tail
      tailRootX: -124, tailRootY: -120,
      tailAngle: 2.05,
      tailSwayAmp: 0.25,
      tailSwayFreq: 2.2,
      tailCurl: 0.2
    };
  function computeTargetPose(dt) {
    const t = sim.stateTime;
    const breath = Math.sin(t * 2.5);

    // Baseline: Iconic Bracel Standing / Idle Pose (All 4 long tapered legs clearly visible!)
    const target = {
      hx: -86, hy: -112 + breath * 1.5, hr: 45,
      cx: -16, cy: -114 + breath * 1.8, cr: 44,
      arch: 8,
      headX: 4, headY: -178 + breath * 2.2,
      headRoll: 0, headYaw: 0, hang: 0,
      earL: Math.sin(t * 1.7) * 0.04,
      earR: Math.cos(t * 1.5) * 0.04,
      pupilX: 2.0, pupilY: 1.0, pupilScale: 1.0,
      blink: 0.0,
      happySquint: 0.0,
      browLift: 0.0,
      mouthOpen: 0.0,
      tongueOut: 0.0,
      purrVib: 0.0,
      // 4 Long Tapered Legs (Root inside torso -> Knee/Elbow -> Rounded Paw on floor y = -9)
      brRx: -94, brRy: -106, brKx: -98, brKy: -56, brPx: -96, brPy: -9,
      frRx: -4,  frRy: -108, frKx: -2,  frKy: -56, frPx: 0,   frPy: -9,
      blRx: -80, blRy: -102, blKx: -82, blKy: -54, blPx: -80, blPy: -8,
      flRx: -20, flRy: -104, flKx: -18, flKy: -54, flPx: -16, flPy: -8,
      flInFrontOfHead: 0,
      blInFrontOfHead: 0,
      tailRootX: -124, tailRootY: -120,
      tailAngle: 2.05,
      tailSwayAmp: 0.22,
      tailSwayFreq: 2.0,
      tailCurl: 0.2
    };

    // Natural Blink every ~4.6 seconds
    const blinkPhase = (sim.globalTime * 0.95) % 4.6;
    if (blinkPhase > 4.42) {
      target.blink = 1.0;
    }

    // Cursor Tracking for Pupils & Subtle Head Tilt
    if (sim.mouseActive) {
      const catHeadWorldX = sim.x + sim.dir * target.headX * sim.scale;
      const catHeadWorldY = sim.groundY + target.headY * sim.scale;
      const dx = (sim.mouseX - catHeadWorldX) * sim.dir;
      const dy = sim.mouseY - catHeadWorldY;
      target.pupilX = Math.max(-8.5, Math.min(8.5, dx * 0.045));
      target.pupilY = Math.max(-6.5, Math.min(6.5, dy * 0.045));
      target.headRoll = Math.max(-0.12, Math.min(0.12, dx * 0.0005));
      if (Math.hypot(dx, dy) < 260) target.headYaw = Math.max(-0.6, Math.min(0.6, dx * 0.006));
    }

    // 1. IDLE / STAND (Original Bracel breathe & tail sway)
    if (sim.state === 'idle') {
      target.tailSwayAmp = 0.26;
    }

    // 2. SIT (Rump rests squarely on the floor, chest upright, tall front legs, folded hind legs)
    else if (sim.state === 'sit') {
      target.hx = -68; target.hy = -44; target.hr = 44;
      target.cx = -20; target.cy = -112 + breath * 1.5; target.cr = 41;
      target.arch = 4;
      target.headX = -2; target.headY = -180 + breath * 2.0;
      // Folded hind legs resting on the floor
      target.brRx = -60; target.brRy = -39; target.brKx = -42; target.brKy = -17; target.brPx = -22; target.brPy = -9;
      target.blRx = -54; target.blRy = -35; target.blKx = -34; target.blKy = -15; target.blPx = -14; target.blPy = -8;
      // Tall vertical front legs
      target.frRx = -4;  target.frRy = -106; target.frKx = 2;   target.frKy = -54; target.frPx = 6;   target.frPy = -9;
      target.flRx = -18; target.flRy = -104; target.flKx = -12; target.flKy = -52; target.flPx = -8,  target.flPy = -8;
      target.tailRootX = -106; target.tailRootY = -32;
      target.tailAngle = 2.15;
      target.tailSwayAmp = 0.32;
    }

    // 3. LOOK AROUND (Curious head turns, ear radar, wide pupils scanning left/right/up)
    else if (sim.state === 'look') {
      const scan = Math.sin(t * 2.0);
      const lookV = Math.cos(t * 1.5);
      target.headX = 4 + scan * 12;
      target.headY = -180 + lookV * 6;
      target.headRoll = scan * 0.16;
      target.pupilX = scan * 8.5;
      target.pupilY = lookV * 5.0;
      target.pupilScale = 1.15;
      target.browLift = 3.5;
      target.earL = scan * 0.22;
      target.earR = -scan * 0.22;
      target.tailSwayAmp = 0.38;
    }

    // 4. GROOM (Seated, raises front paw to cheek & licks it with pink tongue)
    else if (sim.state === 'groom') {
      const cycle = (t * 4.2) % (Math.PI * 2);
      const rub = Math.sin(cycle);
      target.hx = -68; target.hy = -44; target.hr = 44;
      target.cx = -18; target.cy = -108; target.cr = 41;
      target.headX = 2; target.headY = -170 + rub * 6;
      target.headRoll = -0.18 + Math.cos(cycle) * 0.12;
      target.happySquint = 0.65;
      // Folded hind legs & planted far foreleg
      target.brRx = -60; target.brRy = -39; target.brKx = -42; target.brKy = -17; target.brPx = -22; target.brPy = -9;
      target.blRx = -54; target.blRy = -35; target.blKx = -34; target.blKy = -15; target.blPx = -14; target.blPy = -8;
      target.frRx = -4;  target.frRy = -104; target.frKx = 2;   target.frKy = -52; target.frPx = 6;   target.frPy = -9;
      // Near front leg raised to cheek/mouth!
      target.flRx = -16; target.flRy = -98;
      target.flKx = -38; target.flKy = -118;
      target.flPx = -22 + Math.cos(cycle) * 6;
      target.flPy = -148 + rub * 14;
      target.flInFrontOfHead = 1;
      if (rub > 0) {
        target.mouthOpen = 0.45;
        target.tongueOut = Math.abs(Math.sin(cycle * 2)) * 0.9;
      }
      target.tailRootX = -106; target.tailRootY = -32;
    }

    // 5. SCRATCH EAR (Seated, tilts head low while hind foot rapidly kicks behind ear)
    else if (sim.state === 'scratch_ear') {
      const kick = Math.sin(t * 25);
      target.hx = -66; target.hy = -44; target.hr = 44;
      target.cx = -16; target.cy = -104; target.cr = 41;
      target.headX = 6; target.headY = -162 + kick * 2.2;
      target.headRoll = -0.35; // Tilts left ear toward kicking hind foot
      target.happySquint = 0.75;
      target.earL = -0.35 + kick * 0.2;
      // Both front legs planted
      target.frRx = -2;  target.frRy = -100; target.frKx = 4;   target.frKy = -50; target.frPx = 8;   target.frPy = -9;
      target.flRx = -16; target.flRy = -98;  target.flKx = -10; target.flKy = -50; target.flPx = -6;  target.flPy = -8;
      // Near hind leg lifted high to scratch left ear!
      target.blRx = -56; target.blRy = -45;
      target.blKx = -68; target.blKy = -115;
      target.blPx = -46 + kick * 5;
      target.blPy = -195 + Math.cos(t * 25) * 8;
      target.blInFrontOfHead = 1;
      target.tailRootX = -104; target.tailRootY = -32;
      if (Math.random() < dt * 4) {
        addParticle('spark', sim.x - sim.dir * 48 * sim.scale, sim.groundY - 198 * sim.scale, -sim.dir * (1 + Math.random()), -1.5);
      }
    }

    // 6. SCRATCH PANE (Stands tall, front paws sliding up and down the glass screen)
    else if (sim.state === 'scratch_pane') {
      const slide = Math.sin(t * 9.5);
      target.hx = -58; target.hy = -52; target.hr = 44;
      target.cx = -24; target.cy = -126; target.cr = 41;
      target.headX = -10; target.headY = -196;
      target.pupilX = 0; target.pupilY = 0; target.pupilScale = 1.18;
      target.browLift = 3.0;
      // Hind legs supporting weight
      target.brRx = -64; target.brRy = -46; target.brKx = -62; target.brKy = -24; target.brPx = -58; target.brPy = -9;
      target.blRx = -52; target.blRy = -44; target.blKx = -48; target.blKy = -22; target.blPx = -42; target.blPy = -8;
      // Front paws alternating up/down against the glass window pane
      target.frRx = -6;  target.frRy = -122; target.frKx = 24;  target.frKy = -142 - slide * 12; target.frPx = 36;  target.frPy = -168 - slide * 22;
      target.flRx = -24; target.flRy = -122; target.flKx = -52; target.flKy = -142 + slide * 12; target.flPx = -62; target.flPy = -168 + slide * 22;
      target.flInFrontOfHead = 1;
      target.tailRootX = -96; target.tailRootY = -42;
    }

    // 7. SCRATCH WALL (Trots to right wall, stretches up and claws the wall edge)
    else if (sim.state === 'scratch_wall') {
      const wallX = sim.x;
      if (false) {
        sim.dir = sim.x < wallX ? 1 : -1;
        sim.x += sim.dir * 3.4 * sim.speed;
        const w = t * 10;
        const s1 = Math.sin(w) * 22;
        const s2 = Math.sin(w + Math.PI) * 22;
        target.brPx = -96 - s1; target.brPy = -9 + Math.min(0, Math.cos(w) * 14);
        target.frPx = 0 + s1;   target.frPy = -9 + Math.min(0, -Math.cos(w) * 14);
        target.blPx = -80 - s2; target.blPy = -8 + Math.min(0, -Math.cos(w) * 14);
        target.flPx = -16 + s2; target.flPy = -8 + Math.min(0, Math.cos(w) * 14);
      } else {
        const claw = Math.sin(t * 9.0);
        target.hx = -64; target.hy = -58; target.hr = 44;
        target.cx = -10; target.cy = -128 + claw * 3; target.cr = 41;
        target.headX = 14; target.headY = -194 + claw * 3; target.headYaw = 0.55;
        target.brRx = -70; target.brRy = -52; target.brKx = -72; target.brKy = -26; target.brPx = -70; target.brPy = -9;
        target.blRx = -58; target.blRy = -50; target.blKx = -58; target.blKy = -24; target.blPx = -56; target.blPy = -8;
        target.frRx = 2;   target.frRy = -124; target.frKx = 38; target.frKy = -152 - claw * 10; target.frPx = 68; target.frPy = -175 - claw * 18;
        target.flRx = -8;  target.flRy = -122; target.flKx = 32; target.flKy = -148 + claw * 10; target.flPx = 64; target.flPy = -168 + claw * 18;
        target.tailRootX = -102; target.tailRootY = -48;
        if (Math.random() < dt * 4) {
          addParticle('spark', sim.x + 68 * sim.scale, sim.groundY - (170 - claw * 16) * sim.scale, -1.4, 1.6);
        }
      }
    }

    // 8. KNEAD & PURR (Making biscuits with alternating front paws + happy squint + purr)
    else if (sim.state === 'knead') {
      const biscuit = Math.sin(t * 5.0);
      target.hx = -84; target.hy = -102; target.hr = 45;
      target.cx = -16; target.cy = -104 + Math.abs(biscuit) * 3; target.cr = 44;
      target.headX = 4; target.headY = -166 + Math.sin(t * 2.5) * 2.5;
      target.happySquint = 0.78;
      target.purrVib = 1.0;
      // Front paws alternating up & pressing into plush cushion
      const liftL = Math.max(0, biscuit) * 18;
      const liftR = Math.max(0, -biscuit) * 18;
      target.flKy = -54 - liftL * 0.6; target.flPy = -8 - liftL;
      target.frKy = -56 - liftR * 0.6; target.frPy = -9 - liftR;
      playPurrGrain(0.85);
      if (Math.random() < 0.06) {
        addParticle('heart', sim.x + sim.dir * 12 * sim.scale, sim.groundY - 225 * sim.scale, (Math.random() - 0.5) * 0.6, -1.1, '♪');
      }
    }

    // 9. PLAY (MOTH) (Dilated huge pupils, low hunter crouch, butt wiggle & swatting leap)
    else if (sim.state === 'play_moth') {
      sim.moth.wingPhase += dt * 32;
      const lb = bounds(), near = sim.mouseActive && sim.mouseX > lb.l - 40 && sim.mouseX < lb.r + 40 && sim.mouseY < sim.groundY && sim.mouseY > sim.groundY - 160;
      const targetMothX = near ? sim.mouseX : (sim.x + Math.sin(t * 1.3) * 90);
      const targetMothY = near ? Math.min(sim.groundY - 12, sim.mouseY) : (sim.groundY - 45 + Math.cos(t * 2.1) * 22);
      const me = 1 - Math.exp(-dt * 3.6);
      sim.moth.x = lerp(sim.moth.x, targetMothX, me);
      sim.moth.y = lerp(sim.moth.y, targetMothY, me);
      sim.moth.x = clamp(sim.moth.x, sim.x - 120, sim.x + 120);
      sim.moth.y = clamp(sim.moth.y, sim.groundY - 100, sim.groundY - 8);

      const dx = sim.moth.x - sim.x;
      const dy = sim.moth.y - (sim.groundY - 150 * sim.scale);
      if (Math.abs(dx) > 16) sim.dir = dx >= 0 ? 1 : -1;

      if (Math.abs(dx) > 95 * sim.scale) stepToward(sim.moth.x - Math.sign(dx) * 70 * sim.scale, 60, dt);

      target.pupilScale = 1.32; // Huge dilated Bracel pupils
      target.pupilX = Math.max(-8, Math.min(8, (dx * sim.dir) * 0.06));
      target.pupilY = Math.max(-6, Math.min(6, dy * 0.05));
      target.browLift = 4.0;

      const isHigh = sim.moth.y < sim.groundY - 145 * sim.scale;
      if (isHigh && Math.abs(dx) < 110 * sim.scale) {
        const swat = Math.sin(t * 8.5);
        target.hx = -66; target.hy = -56;
        target.cx = -14; target.cy = -124;
        target.headX = 12; target.headY = -192;
        target.brRx = -72; target.brRy = -50; target.brKx = -72; target.brKy = -25; target.brPx = -70; target.brPy = -9;
        target.blRx = -58; target.blRy = -48; target.blKx = -58; target.blKy = -24; target.blPx = -56; target.blPy = -8;
        target.flRx = -8;  target.flRy = -118; target.flKx = 28; target.flKy = -152 + swat * 14; target.flPx = 56; target.flPy = -185 + swat * 26;
        target.frRx = 2;   target.frRy = -120; target.frKx = 34; target.frKy = -145 - swat * 14; target.frPx = 60; target.frPy = -172 - swat * 22;
        target.flInFrontOfHead = 1;
        target.tailRootX = -104; target.tailRootY = -46;
      } else {
        // Low hunter crouch with butt wiggle!
        const wiggle = Math.sin(t * 20) * 3.5;
        target.hx = -88; target.hy = -78 + wiggle;
        target.cx = -14; target.cy = -74;
        target.headX = 22; target.headY = -128; target.headYaw = 0.55;
        target.brRy = -72; target.brKy = -38;
        target.blRy = -70; target.blKy = -36;
        target.frRy = -70; target.frKy = -36;
        target.flRy = -68; target.flKy = -35;
        target.tailRootX = -126; target.tailRootY = -84 + wiggle;
        target.tailSwayAmp = 0.65;
        target.tailSwayFreq = 6.0;
      }
    }

    // 10. YAWN (Big sleepy open mouth, tongue curl, squinted eyes, ear twitch)
    else if (sim.state === 'yawn') {
      const cycle = (t % 4.0) / 4.0;
      const yawn = Math.sin(Math.min(1, cycle * 1.35) * Math.PI);
      target.hx = -68; target.hy = -44; target.hr = 44;
      target.cx = -20; target.cy = -112 - yawn * 6; target.cr = 41;
      target.headX = -2 - yawn * 4;
      target.headY = -180 - yawn * 8;
      target.happySquint = yawn * 0.92;
      target.mouthOpen = Math.max(0, yawn * 1.15);
      target.tongueOut = Math.max(0, (yawn - 0.25) * 1.1);
      target.earL = -yawn * 0.28;
      target.earR = -yawn * 0.28;
      // Grounded sit legs
      target.brRx = -60; target.brRy = -39; target.brKx = -42; target.brKy = -17; target.brPx = -22; target.brPy = -9;
      target.blRx = -54; target.blRy = -35; target.blKx = -34; target.blKy = -15; target.blPx = -14; target.blPy = -8;
      target.frRx = -4;  target.frRy = -106; target.frKx = 2;   target.frKy = -54; target.frPx = 6;   target.frPy = -9;
      target.flRx = -18; target.flRy = -104; target.flKx = -12; target.flKy = -52; target.flPx = -8;  target.flPy = -8;
      target.tailRootX = -106; target.tailRootY = -32;
    }

    // 11. STRETCH (Stage A: Deep front bow stretch -> Stage B: Tall arched spine stretch)
    else if (sim.state === 'stretch') {
      const cycle = t % 5.4;
      if (cycle < 2.9) {
        const s = Math.sin((cycle / 2.9) * Math.PI);
        target.hx = -92; target.hy = -118 - s * 8; target.hr = 45;
        target.cx = -12; target.cy = -112 + s * 34; target.cr = 42;
        target.arch = 8 - s * 22;
        target.headX = 4 + s * 18; target.headY = -176 + s * 44;
        target.happySquint = s * 0.8;
        // Front legs stretched far forward!
        target.frRx = -4;  target.frRy = -106 + s * 32; target.frKx = 2 + s * 24;  target.frKy = -52 + s * 16; target.frPx = s * 56;       target.frPy = -9;
        target.flRx = -16; target.flRy = -104 + s * 32; target.flKx = -12 + s * 26; target.flKy = -50 + s * 16; target.flPx = -14 + s * 56; target.flPy = -8;
        target.tailRootX = -130; target.tailRootY = -128 - s * 8;
      } else {
        const s = Math.sin(((cycle - 2.9) / 2.5) * Math.PI);
        target.hx = -80; target.hy = -114 - s * 14; target.hr = 45;
        target.cx = -20; target.cy = -114 - s * 14; target.cr = 44;
        target.arch = 8 + s * 26;
        target.headX = 0; target.headY = -176 - s * 8;
        target.tailRootX = -118; target.tailRootY = -124 - s * 14;
        target.tailAngle = 1.65;
      }
    }

    // 12. NAP (Cozy curled cat loaf resting on floor, closed eyes, slow breathing, zZz)
    else if (sim.state === 'nap') {
      const napBreath = Math.sin(t * 1.5);
      target.hx = -74; target.hy = -46 + napBreath * 1.2; target.hr = 46;
      target.cx = -14; target.cy = -44 + napBreath * 1.2; target.cr = 44;
      target.arch = 12;
      target.headX = 8; target.headY = -74 + napBreath * 1.5;
      target.headRoll = 0.12;
      target.blink = 1.0;
      // Legs tucked neatly underneath the loaf
      target.brRx = -78; target.brRy = -32; target.brKx = -72; target.brKy = -16; target.brPx = -64; target.brPy = -9;
      target.blRx = -68; target.blRy = -30; target.blKx = -58; target.blKy = -14; target.blPx = -46; target.blPy = -8;
      target.frRx = -6;  target.frRy = -32; target.frKx = 8;   target.frKy = -16; target.frPx = 18;  target.frPy = -9;
      target.flRx = -16; target.flRy = -30; target.flKx = 0;   target.flKy = -14; target.flPx = 12;  target.flPy = -8;
      target.tailRootX = -114; target.tailRootY = -34;
      target.tailAngle = 2.85;
      target.tailSwayAmp = 0.03;
      target.tailCurl = 0.75;
      if (Math.random() < 0.04) {
        addParticle('zzz', sim.x + sim.dir * 26 * sim.scale, sim.groundY - 125 * sim.scale, 0.35, -0.9, 'zZz');
      }
    }

    // 13. WALK (Jaunty 4-legged Bracel walk cycle across the stage)
    else if (sim.state === 'walk') {
      target.headX = 24; target.headY = -168;
      target.headYaw = Math.max(target.headYaw, 0.6);
      target.tailSwayAmp = 0.35;
    }

    // 14. HOP
    else if (sim.state === 'hop') {
      const cycle = Math.max(0, sim.hopP) * 1.55;
      target.headYaw = 0.5;
      if (cycle < 0.6) {
        // Coiling crouch
        const coil = cycle / 0.6;
        target.hx = -88; target.hy = -112 + coil * 32;
        target.cx = -16; target.cy = -114 + coil * 34;
        target.headX = 8; target.headY = -176 + coil * 34;
        target.brRy = -106 + coil * 32; target.brKy = -56 + coil * 18;
        target.blRy = -102 + coil * 32; target.blKy = -54 + coil * 18;
        target.frRy = -108 + coil * 34; target.frKy = -56 + coil * 18;
        target.flRy = -104 + coil * 34; target.flKy = -54 + coil * 18;
        target.tailRootY = -120 + coil * 32;
        target.pupilScale = 1.25;
      } else if (cycle < 1.55) {
        // Airborne bound!
        const airP = (cycle - 0.6) / 0.95;

        const pitch = (airP - 0.5) * 32;
        target.hx = -88; target.hy = -112 - pitch;
        target.cx = -14; target.cy = -114 + pitch;
        target.headX = 12; target.headY = -178 + pitch * 1.2;
        // Outstretched legs in mid-air
        target.brRx = -94; target.brRy = -106 - pitch; target.brKx = -118; target.brKy = -68 - pitch; target.brPx = -138; target.brPy = -32 - pitch;
        target.blRx = -80; target.blRy = -102 - pitch; target.blKx = -104; target.blKy = -64 - pitch; target.blPx = -124; target.blPy = -28 - pitch;
        target.frRx = -4;  target.frRy = -108 + pitch; target.frKx = 24;   target.frKy = -68 + pitch; target.frPx = 48;   target.frPy = -32 + pitch;
        target.flRx = -18; target.flRy = -104 + pitch; target.flKx = 10;   target.flKy = -64 + pitch; target.flPx = 34;   target.flPy = -28 + pitch;
        target.tailRootY = -120 - pitch;
        target.pupilScale = 1.3;
      }
    }

    // 15. PLAY (YARN) (Chasing and batting rolling red yarn ball)
    else if (sim.state === 'play_yarn') {
      const b0 = bounds(), yb = { l: Math.max(b0.l, sim.x - 110), r: Math.min(b0.r, sim.x + 110) }, f60 = dt * 60;
      sim.yarn.x += sim.yarn.vx * f60;
      sim.yarn.rot += sim.yarn.vx * 0.08 * f60 / (sim.scale * 2.2);
      sim.yarn.vx *= Math.pow(0.985, f60);
      sim.yarn.y = sim.groundY - sim.yarn.r;
      if (sim.yarn.x > yb.r + 20) {
        sim.yarn.x = yb.r + 20;
        sim.yarn.vx = -Math.abs(sim.yarn.vx) * 0.85;
      }
      if (sim.yarn.x < yb.l - 20) {
        sim.yarn.x = yb.l - 20;
        sim.yarn.vx = Math.abs(sim.yarn.vx) * 0.85;
      }

      const dx = sim.yarn.x - (sim.x + sim.dir * 25 * sim.scale);
      if (Math.abs(sim.yarn.x - sim.x) > 18) {
        sim.dir = sim.yarn.x >= sim.x ? 1 : -1;
      }

      target.pupilScale = 1.25;
      target.pupilX = 5.5;
      target.pupilY = 4.5;

      if (Math.abs(dx) > 36 * sim.scale) {
        stepToward(sim.yarn.x - sim.dir * 30 * sim.scale, 70, dt);
        target.headX = 22; target.headY = -168; target.headYaw = 0.6;
      } else {
        const swat = Math.sin(t * 10);
        target.cx = -14; target.cy = -104;
        target.headX = 10; target.headY = -164;
        target.flKx = 12 + Math.max(0, swat) * 18;
        target.flKy = -58 - Math.abs(swat) * 12;
        target.flPx = 24 + Math.max(0, swat) * 32;
        target.flPy = -12 - Math.abs(swat) * 22;
        if (swat > 0.85 && Math.abs(sim.yarn.vx) < 1.8) {
          sim.yarn.vx = sim.dir * (4.8 + Math.random() * 2.5) * sim.scale * 1.6;
          addParticle('spark', sim.yarn.x, sim.yarn.y - 6, sim.dir * 1.6, -1.6);
        }
      }
    }

    // Hover Petting Detection (Purrs & squints happily when user pets head/back!)
    newStates(target, t, dt);
    if (host.pose) host.pose(target, t, dt);   // a demo host may pose states of its own (demo/new-actions.js)
    gait(target);
    if (sim.petting && sim.state !== 'nap') {
      {
        target.purrVib = 1.0;
        target.happySquint = Math.max(target.happySquint, 0.55);
        playPurrGrain(0.65);
        if (Math.random() < 0.08) {
          addParticle('heart', sim.x + (Math.random() - 0.5) * 40, sim.groundY - 215 * sim.scale, 0, -1.1, '♥');
        }
      }
    }

    const blend = sim.snap ? 1 : Math.min(1, dt * (sim.state === 'scratch_ear' ? 18 : 10.5)); sim.snap = false;
    for (const key of Object.keys(target)) {
      sim.pose[key] = lerp(sim.pose[key], target[key], blend);
    }
  }
  function drawBracelTaperedLeg(rx, ry, kx, ky, px, py, rTop, rMid, rPaw, color, padColor, showHighlightOutline = false) {
    const dx1 = kx - rx, dy1 = ky - ry;
    const l1 = Math.hypot(dx1, dy1) || 1;
    const nx1 = -dy1 / l1, ny1 = dx1 / l1;

    const dx2 = px - kx, dy2 = py - ky;
    const l2 = Math.hypot(dx2, dy2) || 1;
    const nx2 = -dy2 / l2, ny2 = dx2 / l2;

    let nxm = (nx1 + nx2) * 0.5, nym = (ny1 + ny2) * 0.5;
    const lm = Math.hypot(nxm, nym) || 1;
    nxm /= lm; nym /= lm;

    const baseAng = Math.atan2(dy2, dx2);
    const rootAng = Math.atan2(dy1, dx1);

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    // Start at left side of root
    ctx.moveTo(rx + nx1 * rTop, ry + ny1 * rTop);
    // Smooth quadratic curve through knee to left side of paw
    ctx.quadraticCurveTo(kx + nxm * rMid, ky + nym * rMid, px + nx2 * rPaw, py + ny2 * rPaw);
    // Rounded paw tip semicircle
    ctx.arc(px, py, rPaw, baseAng + Math.PI * 0.5, baseAng - Math.PI * 0.5, true);
    // Smooth quadratic curve back up right side through knee to right side of root
    ctx.quadraticCurveTo(kx - nxm * rMid, ky - nym * rMid, rx - nx1 * rTop, ry - ny1 * rTop);
    // Rounded top dome inside torso
    ctx.arc(rx, ry, rTop, rootAng - Math.PI * 0.5, rootAng + Math.PI * 0.5, true);
    ctx.closePath();
    ctx.fill();

    const lifted = py < -18;
    if (!lifted) {
      ctx.beginPath();
      ctx.ellipse(px + rPaw * 0.45, py + 1.2, rPaw * 1.55, rPaw * 0.98, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(px + rPaw * 0.45, py + 1.2, rPaw * 1.3, rPaw * 0.7, 0, Math.PI * 1.12, Math.PI * 1.85);
      ctx.stroke();
    } else {
      showHighlightOutline = true;
    }

    // If paw is lifted in front of the dark head/chest (e.g. Grooming or Scratching Pane),
    // draw a subtle soft rim & cute cream paw pad so the paw reads clearly!
    if (showHighlightOutline) {
      ctx.strokeStyle = 'rgba(255, 243, 206, 0.22)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      if (padColor) {
        ctx.fillStyle = padColor;
        ctx.beginPath();
        ctx.arc(px, py + rPaw * 0.15, rPaw * 0.5, 0, Math.PI * 2);
        ctx.fill();
        for (const a of [-0.9, 0, 0.9]) {
          ctx.beginPath();
          ctx.arc(px + Math.sin(a) * rPaw * 0.78, py - Math.cos(a) * rPaw * 0.62, rPaw * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  // Builds the closed path for the Deformable Bean Torso connecting Rump(hx,hy,hr) and Chest(cx,cy,cr)
  function traceBeanTorsoPath(hx, hy, hr, cx, cy, cr, arch) {
    const midTopX = (hx + cx) * 0.5;
    const midTopY = (hy - hr + cy - cr) * 0.5 - arch;
    const midBotX = (hx + cx) * 0.5;
    const midBotY = (hy + hr + cy + cr) * 0.5 - arch * 0.25;

    ctx.beginPath();
    ctx.moveTo(hx, hy - hr);
    ctx.quadraticCurveTo(midTopX, midTopY, cx, cy - cr);
    ctx.arc(cx, cy, cr, -Math.PI * 0.5, Math.PI * 0.5, false);
    ctx.quadraticCurveTo(midBotX, midBotY, hx, hy + hr);
    ctx.arc(hx, hy, hr, Math.PI * 0.5, Math.PI * 1.5, false);
    ctx.closePath();
  }

  // Draws the Plump Bracel Head path
  function traceBracelHeadPath(w, hTop, hBot) {
    ctx.beginPath();
    ctx.moveTo(0, -hTop);
    ctx.bezierCurveTo(w * 0.55, -hTop, w, -hTop * 0.55, w, 0);
    ctx.bezierCurveTo(w, hBot * 0.78, w * 0.48, hBot, 0, hBot);
    ctx.bezierCurveTo(-w * 0.48, hBot, -w, hBot * 0.78, -w, 0);
    ctx.bezierCurveTo(-w, -hTop * 0.55, -w * 0.55, -hTop, 0, -hTop);
    ctx.closePath();
  }

  // Draws a Rounded Triangular Bracel Ear
  function drawBracelEar(ex, ey, rot, outerColor, innerColor, sx = 1) {
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(rot);
    ctx.scale(sx, 1);

    // Outer ear
    ctx.fillStyle = outerColor;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.bezierCurveTo(14, -34, 26, -4, 24, 26);
    ctx.bezierCurveTo(12, 30, -12, 30, -24, 26);
    ctx.bezierCurveTo(-26, -4, -14, -34, 0, -34);
    ctx.closePath();
    ctx.fill();

    // Inner ear shadow/concha
    ctx.fillStyle = innerColor;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.bezierCurveTo(9, -22, 16, -2, 15, 18);
    ctx.bezierCurveTo(6, 20, -6, 20, -15, 18);
    ctx.bezierCurveTo(-16, -2, -9, -22, 0, -22);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Draws Bracel's Signature Expressive Eye
  function drawBracelEye(ex, ey, p, palette, sx = 1) {
    ctx.save();
    ctx.translate(ex, ey);
    ctx.scale(sx, 1);

    const ew = 20.5;
    const ehTop = 19.5;
    const ehBot = 13.5;

    // 1. Cream-Yellow Eye Sclera Shape (matching vertices)
    ctx.beginPath();
    ctx.moveTo(0, -ehTop);
    ctx.bezierCurveTo(ew * 0.62, -ehTop, ew, -ehTop * 0.45, ew, 0);
    ctx.bezierCurveTo(ew, ehBot * 0.75, ew * 0.55, ehBot, 0, ehBot);
    ctx.bezierCurveTo(-ew * 0.55, ehBot, -ew, ehBot * 0.75, -ew, 0);
    ctx.bezierCurveTo(-ew, -ehTop * 0.45, -ew * 0.62, -ehTop, 0, -ehTop);
    ctx.closePath();

    ctx.fillStyle = palette.eyeBg;
    ctx.fill();

    // 2. Clipped Pupil, Dual White Catchlight Sparkles & Eyelids
    ctx.save();
    ctx.clip();

    // Large Round Pupil (#2b2b2b)
    const pr = 11.4 * p.pupilScale;
    ctx.fillStyle = palette.pupil;
    ctx.beginPath();
    ctx.arc(p.pupilX, p.pupilY, pr, 0, Math.PI * 2);
    ctx.fill();

    // Dual Crisp White Catchlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.pupilX + 5.8, p.pupilY - 5.2, 2.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.pupilX + 7.2, p.pupilY + 0.2, 1.45, 0, Math.PI * 2);
    ctx.fill();

    // Upper & Lower Eyelids
    if (p.blink > 0.02 || p.happySquint > 0.02) {
      ctx.fillStyle = palette.headTop;
      const topCover = -ehTop + (ehTop + ehBot + 4) * p.blink;
      ctx.fillRect(-ew - 4, -ehTop - 4, (ew + 4) * 2, topCover + ehTop + 4);

      const botCover = ehBot - (ehTop + ehBot) * 0.65 * p.happySquint;
      ctx.beginPath();
      ctx.moveTo(-ew - 4, ehBot + 6);
      ctx.lineTo(-ew - 4, botCover + 4);
      ctx.quadraticCurveTo(0, botCover - 8 * p.happySquint, ew + 4, botCover + 4);
      ctx.lineTo(ew + 4, ehBot + 6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore(); // End eye clip

    // 3. Cute Arched Cream Eyebrow Line above eye
    ctx.strokeStyle = palette.features;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-14, -ehTop - 3 - p.browLift);
    ctx.quadraticCurveTo(0, -ehTop - 11 - p.browLift, 14, -ehTop - 3 - p.browLift);
    ctx.stroke();

    ctx.restore();
  }
  function renderCat() {
    const p = sim.pose;
    const palette = paletteFor();
    const s = sim.scale;
    const vibX = p.purrVib * Math.sin(sim.globalTime * 55) * 0.7;
    const vibY = p.purrVib * Math.cos(sim.globalTime * 55) * 0.7;

    // 1. Ground Shadow & Optional Biscuit Cushion
    const hang = p.hang > 0.5;
    ctx.save();
    const shadowScale = Math.max(0.4, 1 + sim.y / (150 * s));
    ctx.globalAlpha = hang ? 0 : 1 - sim.sink;
    ctx.fillStyle = THEME.shadow;
    ctx.beginPath();
    ctx.ellipse(sim.x - sim.dir * 38 * s, sim.groundY + 2, 76 * s * shadowScale, 10 * s * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    if (sim.state === 'knead') {
      ctx.fillStyle = THEME.soft;
      ctx.strokeStyle = THEME.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sim.x - sim.dir * 10 * s, sim.groundY + 2, 46 * s, 10 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Transform into local Bracel space
    ctx.save();
    // leaving or arriving: standing, it sinks behind the edge it stands on; hanging, it rises behind the bar it holds
    if (sim.sink > 0) { ctx.beginPath(); if (hang) ctx.rect(-1e4, sim.groundY - 3, 2e4, 2e4); else ctx.rect(-1e4, -1e4, 2e4, 1e4 + sim.groundY + 1); ctx.clip(); }
    ctx.translate(sim.x + vibX, sim.groundY + sim.y + vibY + sim.sink * 300 * s * (hang ? -1 : 1));
    ctx.scale(sim.dir * s, s);
    // hanging: the standing body turned a quarter so the chest is up and the rump down, swinging a little from the paws
    if (hang) { ctx.rotate(Math.sin(sim.globalTime * 1.7) * 0.05); ctx.save(); ctx.translate(114, 94); ctx.rotate(-Math.PI / 2); }

    // 2. 4-BONE S-CURVE TAIL
    ctx.save();
    const tailNodes = 10;
    const segLen = 13.5;
    const tailPts = [{ x: p.tailRootX, y: p.tailRootY }];
    let curAng = p.tailAngle;
    for (let i = 1; i < tailNodes; i++) {
      const frac = i / (tailNodes - 1);
      const wave = Math.sin(sim.globalTime * p.tailSwayFreq - frac * 2.5) * p.tailSwayAmp * (0.4 + frac * 0.8);
      curAng += wave * 0.26 - p.tailCurl * 0.18;
      const prev = tailPts[i - 1];
      tailPts.push({
        x: prev.x + Math.cos(curAng) * segLen,
        y: prev.y - Math.sin(curAng) * segLen
      });
    }
    ctx.strokeStyle = palette.tail;
    ctx.lineWidth = 18.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(tailPts[0].x, tailPts[0].y);
    for (let i = 1; i < tailPts.length; i++) {
      ctx.lineTo(tailPts[i].x, tailPts[i].y);
    }
    ctx.stroke();
    ctx.restore();

    // 3. FAR-SIDE LEGS (Back-Right & Front-Right, colored #141414)
    drawBracelTaperedLeg(p.brRx, p.brRy, p.brKx, p.brKy, p.brPx, p.brPy, 21, 13, 9.5, palette.farLeg, palette.pawPad, false);
    drawBracelTaperedLeg(p.frRx, p.frRy, p.frKx, p.frKy, p.frPx, p.frPy, 20, 12.5, 9.5, palette.farLeg, palette.pawPad, false);

    // 4. DEFORMABLE BEAN TORSO (Object with clipped top sheen & clipped head drop-shadow)
    ctx.save();
    traceBeanTorsoPath(p.hx, p.hy, p.hr, p.cx, p.cy, p.cr, p.arch);
    ctx.fillStyle = palette.body;
    ctx.fill();

    // Clip inside torso for dorsal sheen, coat markings, and head drop-shadow!
    ctx.clip();

    // Optional chest bib for Tuxedo / Ginger / Calico
    if (palette.bib) {
      ctx.fillStyle = palette.bib;
      ctx.beginPath();
      ctx.ellipse(p.cx + p.cr * 0.65, p.cy + 8, 22, 32, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Smooth top-to-mid linear gradient sheen
    const topY = Math.min(p.hy - p.hr, p.cy - p.cr) - p.arch;
    const midY = (p.hy + p.cy) * 0.5 + 8;
    const sheenGrad = ctx.createLinearGradient(0, topY, 0, midY);
    sheenGrad.addColorStop(0, palette.bodySheen);
    sheenGrad.addColorStop(1, 'rgba(32, 32, 32, 0)');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(p.hx - p.hr - 20, topY - 20, (p.cx - p.hx) + p.hr + p.cr + 40, midY - topY + 20);

    // Clipped Head Drop-Shadow onto Torso
    ctx.fillStyle = hang ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.48)';
    ctx.beginPath();
    ctx.ellipse(p.headX, p.headY + 12, 74, 56, p.headRoll, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore(); // End torso clip

    // 5. NEAR-SIDE LEGS (Back-Left & Front-Left, seamlessly emerging from lower torso)
    if (!(p.blInFrontOfHead > 0.5)) {
      drawBracelTaperedLeg(p.blRx, p.blRy, p.blKx, p.blKy, p.blPx, p.blPy, 22, 13.5, 9.5, palette.nearLeg, palette.pawPad, false);
    }
    if (!(p.flInFrontOfHead > 0.5)) {
      drawBracelTaperedLeg(p.flRx, p.flRy, p.flKx, p.flKy, p.flPx, p.flPy, 21, 13, 9.5, palette.nearLeg, palette.pawPad, false);
    }

    if (hang) ctx.restore();

    // 6. HEAD, EARS, EYES, NOSE, W-MOUTH & WHISKERS
    ctx.save();
    ctx.translate(p.headX, p.headY);
    ctx.rotate(p.headRoll);

    // Left & Right Ears
    // Head turn: features slide towards where it looks, the far side narrows
    const yw = p.headYaw, farL = 1 - Math.max(0, yw) * 0.4, farR = 1 - Math.max(0, -yw) * 0.4;
    drawBracelEar(-52 + yw * 16, -38, -0.31 + p.earL, palette.earOuter, palette.earInner, farL);
    drawBracelEar(50 + yw * 12, -38, 0.31 + p.earR, palette.earOuter, palette.earInner, farR);

    // Main Plump Head Shape (w=73, hTop=66, hBot=38)
    traceBracelHeadPath(73, 66, 38);
    const headGrad = ctx.createLinearGradient(0, -66, 0, 38);
    headGrad.addColorStop(0, palette.headTop);
    headGrad.addColorStop(0.75, palette.headTop);
    headGrad.addColorStop(1, palette.headBot);
    ctx.fillStyle = headGrad;
    ctx.fill();

    // Subtle top radial highlight on head
    ctx.save();
    ctx.clip();
    const headHi = ctx.createRadialGradient(0, -64, 4, 0, -25, 65);
    headHi.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
    headHi.addColorStop(1, 'rgba(32, 32, 32, 0)');
    ctx.fillStyle = headHi;
    ctx.fillRect(-75, -70, 150, 110);

    // 3 Whiskers on Each Cheek CLIPPED to head edge
    ctx.strokeStyle = palette.features;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      const angles = [0.10, 0.44, 0.76];
      angles.forEach((ang, idx) => {
        const wx0 = side * 28 * (side < 0 ? farL : farR) + yw * 24;
        const wy0 = 8 + idx * 3.2;
        const wx1 = wx0 + side * Math.cos(ang) * 28 * (side < 0 ? farL : farR);
        const wy1 = wy0 + Math.sin(ang) * 28;
        ctx.beginPath();
        ctx.moveTo(wx0, wy0);
        ctx.lineTo(wx1, wy1);
        ctx.stroke();
      });
    }
    ctx.restore(); // End head clip

    // Left & Right Expressive Cream-Yellow Eyes (at x = -34 and x = +34, y = -6)
    drawBracelEye(-34 * farL + yw * 20, -6, p, palette, farL);
    drawBracelEye(33 * farR + yw * 20, -6, p, palette, farR);
    ctx.save();
    ctx.translate(yw * 28, 0);

    // Nose & W-Mouth
    const ny = 10.5;

    // Open Mouth / Yawn / Grooming Tongue
    if (p.mouthOpen > 0.04) {
      ctx.fillStyle = palette.features;
      ctx.beginPath();
      ctx.ellipse(0, ny + 8.5, 7.5 * p.mouthOpen, 10.5 * p.mouthOpen, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (p.tongueOut > 0.05) {
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.ellipse(0, ny + 10.5, 4.8, 7.5 * p.tongueOut, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cute Inverted Rounded Triangle Nose (#fff3ce)
    ctx.fillStyle = palette.features;
    ctx.beginPath();
    ctx.moveTo(-4.5, ny - 2.0);
    ctx.lineTo(4.5, ny - 2.0);
    ctx.lineTo(0, ny + 2.6);
    ctx.closePath();
    ctx.fill();

    // W-Shaped Cat Mouth
    ctx.strokeStyle = palette.features;
    ctx.lineWidth = 2.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-3.6, ny + 2.2, 3.6, 0.05 * Math.PI, 0.92 * Math.PI, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(3.6, ny + 2.2, 3.6, 0.08 * Math.PI, 0.95 * Math.PI, false);
    ctx.stroke();

    ctx.restore();
    ctx.restore(); // End head transform

    // 7. FOREGROUND LIFTED PAWS (When grooming cheek, scratching ear, or scratching window pane)
    if (p.blInFrontOfHead > 0.5) {
      drawBracelTaperedLeg(p.blRx, p.blRy, p.blKx, p.blKy, p.blPx, p.blPy, 22, 13.5, 9.5, palette.nearLeg, palette.pawPad, true);
    }
    if (p.flInFrontOfHead > 0.5) {
      drawBracelTaperedLeg(p.flRx, p.flRy, p.flKx, p.flKy, p.flPx, p.flPy, 20, 12.5, 9.5, palette.nearLeg, palette.pawPad, true);
    }

    ctx.restore(); // End cat transform
  }
  function renderPropsAndParticles(dt) {
    if (sim.moth.active) {
      ctx.save();
      ctx.translate(sim.moth.x, sim.moth.y);
      ctx.scale(sim.scale * 2.2, sim.scale * 2.2);
      const flap = Math.sin(sim.moth.wingPhase);
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
      glow.addColorStop(0, THEME.glow);
      glow.addColorStop(1, 'rgba(79, 157, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = THEME.muted;
      ctx.beginPath();
      ctx.ellipse(-7, -3 * flap, 10, 5.5 * Math.abs(flap) + 2, -0.4, 0, Math.PI * 2);
      ctx.ellipse(7, -3 * flap, 10, 5.5 * Math.abs(flap) + 2, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = THEME.soft;
      ctx.beginPath();
      ctx.arc(-7, -3 * flap, 3, 0, Math.PI * 2);
      ctx.arc(7, -3 * flap, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (sim.yarn.active) {
      ctx.save();
      ctx.translate(sim.yarn.x, sim.yarn.y);
      ctx.rotate(sim.yarn.rot);
      const r = sim.yarn.r;
      ctx.fillStyle = THEME.accent;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = THEME.soft;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(-3, -2, r * 0.7, -0.5, 1.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(3, 2, r * 0.65, 1.2, 3.5);
      ctx.stroke();
      ctx.restore();
    }

    if (sim.state === 'scratch_pane') {
      ctx.save();
      ctx.strokeStyle = THEME.marks;
      ctx.lineWidth = 2.2;
      ctx.lineWidth = 1;
      for (let side of [-60, 36]) {
        for (let c = -6; c <= 6; c += 6) {
          ctx.beginPath();
          ctx.moveTo(sim.x + (side + c) * sim.scale, sim.groundY - 190 * sim.scale);
          ctx.lineTo(sim.x + (side + c) * sim.scale, sim.groundY - 135 * sim.scale);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    for (let i = sim.particles.length - 1; i >= 0; i--) {
      const pt = sim.particles[i];
      pt.x += pt.vx * dt * 30;
      pt.y += pt.vy * dt * 30;
      pt.life -= dt * 0.85;
      if (pt.life <= 0) {
        sim.particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      if (pt.type === 'zzz') {
        ctx.fillStyle = THEME.muted;
        ctx.font = '600 9px ui-monospace, Menlo, monospace';
        ctx.fillText(pt.text || 'zZz', pt.x, pt.y);
      } else if (pt.type === 'heart') {
        ctx.fillStyle = THEME.accent;
        ctx.font = '600 9px ui-monospace, Menlo, monospace';
        ctx.fillText(pt.text || '♥', pt.x, pt.y);
      } else if (pt.type === 'spark') {
        ctx.strokeStyle = THEME.muted;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x + pt.vx * 3.5, pt.y + pt.vy * 3.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /* ---------- state ---------- */
  const now = () => performance.now();
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function lerp(a, b, t) { return a + (b - a) * t; }
  const reduceQ = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)"); } catch (_) { return { matches: false }; } })();
  const RM = () => !!reduceQ.matches;
  const STOP = { stop: 1 };
  const store = host.store;
  let audioCtx = null, audioEnabled = !!store.get("sound", true), lastPurrPulse = 0;
  let on = false;
  const off = new Set(store.get("acts", []));
  const THEME = {};
  const sim = {
    state: "sit", stateTime: 0, globalTime: 0, coat: store.get("coat", "cloud"), bgTheme: "light",
    scale: clamp(+store.get("size", 0.2) || 0.2, 0.14, 0.45), speed: 1,
    x: 0, y: 0, groundY: 0, dir: 1, mouseX: -1e4, mouseY: -1e4, mouseActive: false,
    moving: false, gait: 0, sink: 0, hopP: -1, petting: false,
    pose: { ...POSE0, headYaw: 0, hang: 0 }, snap: false, clipL: -1e9,
    moth: { x: 0, y: 0, wingPhase: 0, active: false },
    yarn: { x: 0, y: 0, vx: 0, rot: 0, r: 6, active: false },
    particles: []
  };
  // st.x is measured from the left of the surface Bracel stands on, so it moves with the page
  const st = { spot: null, x: 0, shown: false, hopping: false };
  function addParticle(type, x, y, vx, vy, text = "") { if (sim.particles.length < 24) sim.particles.push({ type, x, y, vx, vy, text, life: 1 }); }
  // the page decides light or dark (the host reads its background); the small coloured touches are Bracel's own
  function readTheme() {
    const dark = host.theme() === "dark";
    sim.bgTheme = dark ? "dark" : "light";
    Object.assign(THEME, { shadow: dark ? "rgba(0,0,0,.45)" : "rgba(15,23,42,.14)", muted: dark ? "#94a3b8" : "#64748b", accent: dark ? "#60a5fa" : "#2563eb",
      soft: dark ? "#1e3a5f" : "#dbeafe", marks: dark ? "rgba(226,232,240,.3)" : "rgba(15,23,42,.22)", glow: dark ? "rgba(79,157,255,.35)" : "rgba(37,99,235,.18)" });
  }

  /* ---------- where Bracel can be: the host lists the spots (see src/spots.js); a spot is an element plus the kind of
     edge (ledge: its top, shelf/floor: the bottom inside it, bar: hanging under its bottom), the run it may use (x0..x1,
     from the element's left), walls (x from its left) and grp, shared by the spots of one box ---------- */
  const H = () => Math.round(255 * sim.scale) + 4, HALF = () => Math.round(120 * sim.scale), MINW = () => HALF() * 2 + 12;
  const vis = el => { if (!el || !el.getBoundingClientRect) return null; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? r : null; };
  const overlay = () => !!host.overlay();
  const lineOf = (sf, r = sf.el.getBoundingClientRect()) => sf.kind === "bar" ? r.bottom : sf.kind === "floor" ? r.bottom - 3 : r.top;
  const surfaces = () => host.surfaces({ h: H(), minW: MINW(), half: HALF() });
  const sameSpot = (a, b) => a && b && a.el === b.el && a.kind === b.kind;
  const scan = sf => sf && !overlay() ? { sit: [[sf.x0, sf.x1]], play: [[sf.x0, sf.x1]] } : null;
  function refresh() { const sp = st.spot; if (!sp) return false; const s = surfaces().find(o => sameSpot(o, sp)); if (!s) return false; Object.assign(sp, s); return true; }
  function pickSpot(avoid, kinds) {
    const c = [];
    for (const sf of surfaces()) { if (kinds && !kinds.includes(sf.kind)) continue; const w = sf.x1 - sf.x0; c.push({ sf, run: [sf.x0, sf.x1], score: sf.w * Math.min(w, 500) * (sameSpot(avoid, sf) ? 0.35 : 1) }); }
    if (!c.length) return null; let t = Math.random() * c.reduce((a, b) => a + b.score, 0); for (const o of c) { t -= o.score; if (t <= 0) return o; } return c[c.length - 1];
  }
  const spotOK = () => { const sp = st.spot; return !!sp && sp.el.isConnected && !!vis(sp.el) && !overlay() && refresh(); };
  const hanging = () => !!st.spot && st.spot.kind === "bar";
  const myRun = () => st.spot && [st.spot.x0, st.spot.x1];
  const spotLeft = () => { const r = st.spot && st.spot.el.getBoundingClientRect(); return r ? r.left : 0; };
  // where Bracel may walk (or shimmy) on its surface, in page (viewport) pixels
  function bounds() {
    const run = myRun(), o = spotLeft(), hf = HALF();
    return run ? { l: o + run[0] + hf, r: o + run[1] - hf } : { l: sim.x, r: sim.x };
  }
  function wallFor(side) {
    const sp = st.spot; if (!sp || !sp.walls || !sp.walls.length) return null;
    for (const w of sp.walls) { if (side !== -1 && Math.abs(w - sp.x1) < 26) return { x: w, side: 1 }; if (side !== 1 && Math.abs(w - sp.x0) < 26) return { x: w, side: -1 }; }
    return null;
  }
  // somewhere to jump to from here: another surface up to ~170 px higher or 260 lower, across a gap or overlapping;
  // within one box any height, so it can jump down into the box and back up onto its top
  function jumpTarget(kinds, maxUp = 170, maxDown = 260) {
    if (!st.spot) return null; const out = [];
    for (const sf of surfaces()) {
      if (sameSpot(sf, st.spot) || !kinds.includes(sf.kind)) continue;
      const r = sf.el.getBoundingClientRect(), y = lineOf(sf, r), dy = y - sim.groundY, same = sf.grp != null && sf.grp === st.spot.grp;
      if (!same && (dy < -maxUp || dy > maxDown) || Math.abs(dy) < 4 && sf.el === st.spot.el) continue;
      const lo = r.left + sf.x0 + HALF(), hi = r.left + sf.x1 - HALF(); if (hi < lo) continue;
      const x = clamp(sim.x + rnd(-60, 60), lo, hi); if (Math.abs(x - sim.x) > 220) continue;
      out.push({ sf, x, y });
    }
    return out[Math.floor(Math.random() * out.length)] || null;
  }

  /* ---------- walking: x moves at a steady speed and the step follows the distance, so planted paws never slide ---------- */
  const STRIDE = 22;
  function stepToward(tx, speed, dt, free) {
    const b = bounds(); if (!free) tx = clamp(tx, b.l, b.r);
    const d = tx - sim.x; if (Math.abs(d) < 0.8 || RM()) { if (RM()) st.x += d; return true; }
    sim.dir = Math.sign(d); const step = Math.min(Math.abs(d), speed * dt);
    st.x += sim.dir * step; sim.x += sim.dir * step; sim.moving = true;
    sim.gait += (step / sim.scale) * Math.PI / (2 * STRIDE);
    return false;
  }
  // one walk cycle added on top of any pose while moving: a paw is lifted while it swings forwards and planted while it slides back
  function gait(T) {
    if (!sim.moving) return;
    if (T.hang) {
      // slow hand over hand: one paw lets go a little and reaches along while the other holds; the body sways with it
      const w = sim.gait * 0.5;
      for (const [k, ph] of [["fl", 0], ["fr", Math.PI]]) { const a = w + ph; T[k + "Py"] += -Math.sin(a) * 9; T[k + "Px"] += Math.min(0, Math.cos(a)) * 6; }
      T.headX += Math.sin(w) * 3; T.brPy += Math.sin(w) * 5; T.blPy -= Math.sin(w) * 5; return;
    }
    const w = sim.gait, lift = 14;
    for (const [k, ph] of [["fl", 0], ["fr", Math.PI], ["bl", Math.PI * 0.5], ["br", Math.PI * 1.5]]) {
      const a = w + ph, dx = -Math.sin(a) * STRIDE, dy = Math.min(0, Math.cos(a) * lift);
      T[k + "Px"] += dx; T[k + "Py"] += dy; T[k + "Kx"] += dx * 0.5; T[k + "Ky"] += dy * 0.5;
    }
    const bob = Math.sin(w * 2) * 2.2; T.hy += bob; T.cy -= bob; T.headY += Math.cos(w * 2) * 2;
  }

  /* ---------- poses added to the original fifteen ---------- */
  function sitLegs(T) {
    T.hx = -68; T.hy = -44; T.hr = 44; T.cx = -20; T.cr = 41; T.arch = 4;
    T.brRx = -60; T.brRy = -39; T.brKx = -42; T.brKy = -17; T.brPx = -22; T.brPy = -9;
    T.blRx = -54; T.blRy = -35; T.blKx = -34; T.blKy = -15; T.blPx = -14; T.blPy = -8;
    T.frRx = -4; T.frRy = -106; T.frKx = 2; T.frKy = -54; T.frPx = 6; T.frPy = -9;
    T.flRx = -18; T.flRy = -104; T.flKx = -12; T.flKy = -52; T.flPx = -8; T.flPy = -8;
    T.tailRootX = -106; T.tailRootY = -32; T.tailAngle = 2.15;
  }
  function newStates(T, t) {
    const s = sim.state, breath = Math.sin(t * 2.5);
    if (s === "sniff") {
      // the head stretches forwards and down, nose twitching, then comes back
      const f = clamp(t / 0.6, 0, 1) * clamp((3.4 - t) / 0.6, 0, 1);
      T.cy += f * 8; T.headX = 4 + f * 34; T.headY = -178 + f * 40 + Math.sin(t * 28) * 1.3 * f;
      T.headYaw = Math.max(T.headYaw, 0.7 * f); T.pupilY = 4 * f; T.pupilX = 3 * f; T.browLift = 2 * f; T.earL = 0.15 * f; T.earR = -0.15 * f;
    } else if (s === "annoyed") {
      sitLegs(T); T.cy = -110; T.headX = -4; T.headY = -176; T.earL = -0.75; T.earR = 0.75; T.browLift = -4;
      T.pupilScale = 0.7; T.mouthOpen = 0.22; T.tailSwayAmp = 1.25; T.tailSwayFreq = 13; T.headYaw = -0.25;
    } else if (s === "petted") {
      sitLegs(T); T.cy = -110 + breath * 1.2; T.headX = 0; T.headY = -176; T.headRoll = 0.14 * Math.sin(t * 1.4);
      T.happySquint = 0.85; T.purrVib = 1; T.earL = -0.12; T.earR = 0.12; T.tailSwayAmp = 0.12; T.tailCurl = 0.45;
    } else if (s === "stalk") {
      const wig = Math.sin(t * 20) * 3.5 * clamp(t - 0.6, 0, 1);
      T.hx = -88; T.hy = -78 + wig; T.cx = -14; T.cy = -74; T.headX = 22; T.headY = -128; T.headYaw = 0.6; T.pupilScale = 1.32; T.browLift = 4;
      T.brRy = -72; T.brKy = -38; T.blRy = -70; T.blKy = -36; T.frRy = -70; T.frKy = -36; T.flRy = -68; T.flKy = -35;
      T.tailRootX = -126; T.tailRootY = -84 + wig; T.tailSwayAmp = 0.65; T.tailSwayFreq = 6;
      T.mouthOpen = t > 0.4 ? 0.12 + 0.18 * Math.abs(Math.sin(t * 26)) : 0;  // chattering
    } else if (s === "hang") {
      // front paws up on the bar's edge, head just below, body and back legs dangling, tail hanging and swaying.
      // Numbers are in the standing frame; the drawing turns that frame a quarter (see renderCat)
      const sw = Math.sin(t * 1.7);
      T.hang = 1; T.hx = -86; T.hy = -112; T.hr = 50; T.cx = -16; T.cy = -114; T.cr = 47; T.arch = 2;
      T.frRx = -4; T.frRy = -98; T.frKx = 54; T.frKy = -50; T.frPx = 98; T.frPy = -26;
      T.flRx = -18; T.flRy = -128; T.flKx = 54; T.flKy = -178; T.flPx = 98; T.flPy = -202;
      T.brRx = -94; T.brRy = -106; T.brKx = -141; T.brKy = -96 + sw * 4; T.brPx = -186; T.brPy = -92 + sw * 8;
      T.blRx = -80; T.blRy = -102; T.blKx = -141; T.blKy = -132 + sw * 4; T.blPx = -186; T.blPy = -136 + sw * 8;
      T.flInFrontOfHead = 0; T.blInFrontOfHead = 0;
      T.tailRootX = -124; T.tailRootY = -120; T.tailAngle = Math.PI; T.tailSwayAmp = 0.5; T.tailSwayFreq = 1.6; T.tailCurl = 0;
      T.headX = 0; T.headY = 78 + sw * 2; T.headRoll = sw * 0.06; T.earL = 0.1; T.earR = -0.1;
    } else if (s === "pounce" || s === "drop") {
      const p = (clamp(sim.hopP, 0, 1) - 0.5) * 32;
      T.hx = -88; T.hy = -112 - p; T.cx = -14; T.cy = -114 + p; T.headX = 14; T.headY = -178 + p * 1.2; T.headYaw = 0.5; T.pupilScale = 1.3;
      T.brRx = -94; T.brRy = -106 - p; T.brKx = -118; T.brKy = -68 - p; T.brPx = -138; T.brPy = -32 - p;
      T.blRx = -80; T.blRy = -102 - p; T.blKx = -104; T.blKy = -64 - p; T.blPx = -124; T.blPy = -28 - p;
      T.frRx = -4; T.frRy = -108 + p; T.frKx = 30; T.frKy = -80 + p; T.frPx = 58; T.frPy = -56 + p;
      T.flRx = -18; T.flRy = -104 + p; T.flKx = 16; T.flKy = -76 + p; T.flPx = 46; T.flPy = -50 + p;
      T.tailRootY = -120 - p;
    }
  }

  /* ---------- drawing: a small canvas that follows Bracel, drawn at the screen's real resolution (zoom included) ---------- */
  let cv = null, ctx = null, raf = 0, last = 0, mover = null, boxW = 0, boxH = 0, boxUp = 0, res = 0, told = false;
  function makeCanvas() {
    cv = document.createElement("canvas"); cv.setAttribute("aria-hidden", "true");
    try { ctx = cv.getContext && cv.getContext("2d"); } catch (_) { ctx = null; }
    host.mount(cv);
  }
  function sizeBox() {
    const s = sim.scale, vv = window.visualViewport, k = Math.min(6, (window.devicePixelRatio || 1) * (vv && vv.scale > 1 ? vv.scale : 1));
    const w = Math.ceil(2 * Math.max(300 * s, 135)), h = Math.ceil(Math.max(340 * s, 120) + 60 + 330 * s + 24); boxUp = Math.ceil(Math.max(340 * s, 120) + 60);
    // (a size set before the canvas exists is still applied when it is made)
    if (w === boxW && h === boxH && k === res && (!cv || cv.width === Math.round(w * k))) return; boxW = w; boxH = h; res = k;
    if (!cv) return; cv.width = Math.round(w * k); cv.height = Math.round(h * k); cv.style.width = w + "px"; cv.style.height = h + "px";
  }
  function frame(t) {
    raf = 0; if (!on || !cv) return;
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60; last = t;
    sim.globalTime += dt; sim.stateTime += dt; sim.moving = false; sim.mouseActive = now() - ptr.moved < 4000;
    if (mover) mover(dt);
    if (st.spot && !st.hopping) { const r = st.spot.el.getBoundingClientRect(); sim.x = r.left + st.x; sim.groundY = lineOf(st.spot, r); }
    if (hanging() && sim.state === "hang") sim.petting = allowed("petted") && now() - lastStroke < 2200;
    draw(dt);
    if (st.shown && !RM() && !document.hidden) need();
  }
  function draw(dt) {
    if (!cv) return; cv.style.visibility = st.shown ? "visible" : "hidden"; if (st.shown !== told) { told = st.shown; host.onShown && host.onShown(told); } if (!st.shown) return;
    sizeBox(); computeTargetPose(dt);
    const left = sim.x - boxW / 2, top = sim.groundY - boxUp;
    cv.style.transform = `translate3d(${left.toFixed(1)}px,${top.toFixed(1)}px,0)`;
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(res, 0, 0, res, -left * res, -top * res);
    // hiding behind an edge: nothing is drawn left of it
    ctx.save(); if (sim.clipL > -1e8) { ctx.beginPath(); ctx.rect(sim.clipL, -1e4, 2e4, 2e4); ctx.clip(); }
    renderCat(); ctx.restore(); renderPropsAndParticles(dt);
    if (host.paint) host.paint(ctx, dt);   // and draw props for them
  }
  function need() { if (!raf) raf = requestAnimationFrame(frame); }
  function stillFrame() { last = 0; sim.particles.length = 0; if (cv) draw(1); }  // a long step lands the pose at once

  /* ---------- behaviour: one activity at a time, picked by weight from the ones switched on, interrupted by what you do ---------- */
  let gen = 0, prev = "", lastInput = now(), lastStroke = 0, strokeAcc = 0, playAcc = 0, lastHunt = -1e9, clicks = [], px0 = null, dragged = false;
  const ptr = { moved: -1e9 };
  function setState(s) { sim.state = s; sim.stateTime = 0; sim.moth.active = s === "play_moth"; sim.yarn.active = s === "play_yarn"; if (RM()) stillFrame(); }
  const wait = (g, ms) => new Promise((res, rej) => setTimeout(() => g === gen ? res() : rej(STOP), RM() ? Math.min(ms, 500) : ms));
  function until(g, fn) { return new Promise((res, rej) => { if (RM()) { while (!fn(1)); res(); return; } mover = dt => { if (g !== gen) { mover = null; rej(STOP); return; } if (fn(dt)) { mover = null; res(); } }; need(); }); }
  const walkTo = (g, tx, speed = 42) => { if (!hanging()) setState("walk"); return until(g, dt => stepToward(tx, speed, dt)); };
  const sit = async (g, ms = rnd(4000, 8000)) => { setState("sit"); await wait(g, ms); };
  const after = (g, ms = 1500) => sit(g, ms);
  const idleS = () => (now() - lastInput) / 1000;
  function standOn(sf, x) { const r = sf.el.getBoundingClientRect(); st.spot = sf; st.x = x - r.left; sim.x = x; sim.groundY = lineOf(sf, r); }
  async function appear(g, avoid) {
    const c = pickSpot(avoid); if (!c) { st.shown = false; draw(0); return false; }
    const r = c.sf.el.getBoundingClientRect(); standOn(c.sf, r.left + rnd(c.run[0] + HALF(), c.run[1] - HALF())); sim.dir = Math.random() < 0.5 ? 1 : -1;
    st.shown = true; sim.clipL = -1e9; setState(hanging() ? "hang" : "idle"); sim.snap = true;
    if (RM()) { sim.sink = 0; if (!hanging()) setState("sit"); return true; }
    let u = 0; sim.sink = 1; await until(g, dt => { u += dt / 0.8; sim.sink = Math.max(0, 1 - u) ** 2; return u >= 1; });
    sim.sink = 0; return true;
  }
  async function leave(g, ms = 0.7) {
    if (!st.shown) return; if (RM()) { st.shown = false; draw(0); return; }
    if (!hanging()) setState("idle"); let u = 0; await until(g, dt => { u += dt / ms; sim.sink = Math.min(1, u * u); return u >= 1; });
    st.shown = false; sim.sink = 0; draw(0);
  }
  // a jump through the air: x and the line it stands on move from here to there along an arc; hopP drives the crouch and flight poses
  async function fly(g, x1, y1, T, arc, pose = "hop", startP = 0) {
    const x0 = sim.x, y0 = sim.groundY; sim.dir = x1 >= x0 ? 1 : x1 < x0 - 2 ? -1 : sim.dir; setState(pose); let u = startP; sim.hopP = u; st.hopping = true;
    try {
      await until(g, dt => {
        u += dt / T; sim.hopP = Math.min(1, u); const a = clamp((u - 0.39) / 0.61, 0, 1);
        sim.x = lerp(x0, x1, a); sim.groundY = lerp(y0, y1, pose === "drop" ? a * a : a); sim.y = -Math.sin(a * Math.PI) * arc; return u >= 1;
      });
    } finally { st.hopping = false; sim.hopP = -1; sim.y = 0; }
  }
  // standing height in px: a standing Bracel's paws are this far below a bar its front paws could reach
  const reach = () => 250 * sim.scale;
  async function jumpTo(g, t) {
    await fly(g, t.x, t.y, 0.9 + Math.min(0.9, Math.abs(t.y - sim.groundY) / 500), 18 + Math.min(120, Math.max(0, sim.groundY - t.y) * 0.5));
    standOn(t.sf, t.x); setState("idle"); await wait(g, 700);
  }
  async function hangOn(g, t) {
    await fly(g, t.x, t.y + reach(), 0.85, 16);
    standOn(t.sf, t.x); setState("hang"); sim.snap = true; await wait(g, 400);
  }
  const A = {
    idle: async g => { setState("idle"); await wait(g, rnd(3000, 5000)); },
    sit: g => sit(g),
    look: async g => { setState("look"); await wait(g, 4200); await after(g); },
    sniff: async g => { const b = bounds(); if (b.r - b.l > 40) await walkTo(g, clamp(sim.x + rnd(-90, 90), b.l, b.r)); setState("sniff"); await wait(g, 3400); setState("idle"); await wait(g, 800); },
    groom: async g => { setState("sit"); await wait(g, 900); setState("groom"); await wait(g, 5200); await after(g); },
    scratch_ear: async g => { setState("sit"); await wait(g, 800); setState("scratch_ear"); await wait(g, 2600); await after(g); },
    scratch_pane: async g => { setState("scratch_pane"); await wait(g, 4000); await after(g); },
    scratch_wall: async g => {
      const w = wallFor(); if (!w) return A.scratch_pane(g);
      const b = bounds(); await walkTo(g, w.side > 0 ? b.r : b.l);
      setState("walk"); await until(g, dt => stepToward(spotLeft() + w.x - w.side * (68 * sim.scale + 2), 30, dt, true));
      sim.dir = w.side; setState("scratch_wall"); await wait(g, 4200); await after(g);
    },
    knead: async g => { setState("knead"); await wait(g, 6500); await after(g); },
    play_moth: async g => {
      const b = bounds(); if (b.r - b.l < 100) return sit(g);
      Object.assign(sim.moth, { x: sim.x + sim.dir * 80, y: sim.groundY - 50 }); setState("play_moth"); await wait(g, 10000); sim.moth.active = false; await after(g);
    },
    play_yarn: async g => {
      const b = bounds(); if (b.r - b.l < 120) return sit(g);
      Object.assign(sim.yarn, { r: 15 * sim.scale * 2, x: clamp(sim.x + sim.dir * 70, b.l, b.r), vx: sim.dir * 2 * sim.scale * 1.6 }); setState("play_yarn"); await wait(g, 10000); await after(g);
    },
    yawn: async g => { setState("yawn"); await wait(g, 3600); await after(g); },
    stretch: async g => { setState("stretch"); await wait(g, 5400); setState("idle"); await wait(g, 1200); },
    nap: async g => { setState("sit"); await wait(g, 1200); setState("nap"); await wait(g, rnd(45000, 90000)); setState("yawn"); await wait(g, 3000); await after(g); },
    walk: async g => {
      const b = bounds(); if (b.r - b.l < 50) return sit(g);
      let tx = rnd(b.l, b.r); if (Math.abs(tx - sim.x) < 60) tx = sim.x < (b.l + b.r) / 2 ? b.r - rnd(0, 40) : b.l + rnd(0, 40);
      await walkTo(g, tx); setState("idle"); await wait(g, 900);
    },
    // jump to another spot nearby: the next box, the floor of a box, the bottom of the window, up or down
    hop: async g => { const t = jumpTarget(["ledge", "shelf", "floor"]); if (!t) return A.walk(g); await jumpTo(g, t); },
    // leap up and hang under a header or a box, shimmy along, then drop onto whatever is below
    hang: async g => {
      if (!hanging()) { const t = jumpTarget(["bar"], 220, 0); if (!t || t.y > sim.groundY - 20) return A.hop(g); await hangOn(g, t); }
      setState("hang"); await wait(g, rnd(2500, 4500));
      const b = bounds(); if (Math.random() < 0.6 && b.r - b.l > 40) { const tx = clamp(sim.x + (Math.random() < 0.5 ? -1 : 1) * rnd(25, 60), b.l, b.r); await until(g, dt => stepToward(tx, 11, dt)); await wait(g, rnd(1500, 3000)); }
      if (Math.random() < 0.65) await A.drop(g);
    },
    drop: async g => {
      if (!hanging()) return;
      const t = jumpTarget(["ledge", "shelf", "floor"], 0, 520);
      if (!t) { await leave(g); await wait(g, rnd(2000, 5000)); await appear(g, st.spot); return; }
      sim.groundY += reach(); setState("drop"); sim.snap = true;
      await fly(g, t.x, t.y, 0.45 + Math.sqrt(Math.max(1, t.y - sim.groundY)) / 45, 4, "drop", 0.39);
      standOn(t.sf, t.x); setState("idle"); await wait(g, 900);
    },
    // walks behind an edge on its left (a sidebar, a box's side), then peeks out with just its head before coming back
    peek: async g => {
      const w = wallFor(-1); if (!w) return A.walk(g);
      const wx = spotLeft() + w.x, s = sim.scale; await walkTo(g, bounds().l);
      sim.clipL = wx;
      try {
        setState("walk"); await until(g, dt => stepToward(wx - 270 * s, 38, dt, true)); setState("idle"); await wait(g, rnd(2500, 5000));
        setState("walk"); await until(g, dt => stepToward(wx - 300 * s, 20, dt, true)); sim.dir = 1;
        await until(g, dt => stepToward(wx + 25 * s, 30, dt, true)); setState("look"); await wait(g, rnd(2500, 4000));
        setState("walk"); await until(g, dt => stepToward(bounds().l + 20, 36, dt, true));
      } finally { sim.clipL = -1e9; }
      setState("idle"); await wait(g, 800);
    },
    // drops down behind its edge (or up behind the bar) and comes back a while later, somewhere else
    away: async g => { await leave(g); await wait(g, rnd(15000, 40000)); await appear(g, st.spot); if (!hanging()) await sit(g, 2500); },
    petted: async g => {
      setState("petted"); sim.petting = true;
      try { lastStroke = Math.max(lastStroke, now()); while (now() - lastStroke < 2200) await wait(g, 250); } finally { sim.petting = false; }
      await sit(g, 2500);
    },
    annoyed: async g => {
      setState("annoyed"); await wait(g, 2400);
      const b = bounds(), dir = sim.mouseActive ? (sim.mouseX < sim.x ? 1 : -1) : -sim.dir;
      if (b.r - b.l > 30) await walkTo(g, clamp(sim.x + dir * 90, b.l, b.r), 55); await sit(g, 2500);
    },
    // watch, wiggle and pounce at the pointer (or at a spot ahead)
    hunt: async g => {
      const b = bounds(), aim = clamp(sim.mouseActive ? sim.mouseX : sim.x + sim.dir * 70, b.l, b.r); sim.dir = aim >= sim.x ? 1 : -1;
      setState("stalk"); await wait(g, 1900);
      const x0 = st.x, x1 = st.x + clamp(sim.mouseActive ? sim.mouseX : aim, b.l, b.r) - sim.x;
      setState("pounce"); let u = 0; sim.hopP = 0;
      try { await until(g, dt => { u += dt / 0.55; const a = Math.min(1, u); sim.hopP = a; st.x = lerp(x0, x1, a); sim.y = -Math.sin(a * Math.PI) * 16; return u >= 1; }); }
      finally { sim.hopP = -1; sim.y = 0; }
      addParticle("spark", sim.x + sim.dir * 14, sim.groundY - 6, sim.dir * 1.2, -1.4); lastHunt = now(); await sit(g, 2500);
    },
    // a click where it stands: it steps aside so whatever is behind it is easy to reach
    room: async g => {
      if (hanging()) return A.drop(g);
      const b = bounds(), side = sim.mouseX < sim.x ? 1 : -1, tx = clamp(sim.x + side * (HALF() * 2 + 30), b.l, b.r);
      if (Math.abs(tx - sim.x) < 20) return A.hop(g);
      await walkTo(g, tx, 60); if (!hanging()) await sit(g, 3000);
    },
    wake: async g => { setState("yawn"); await wait(g, 2600); await after(g); },
    flee: async g => { await leave(g, 0.35); await wait(g, rnd(1500, 3000)); await appear(g, st.spot); }
  };
  // everything except moving about while hanging starts from standing: let go of the bar first
  for (const k of Object.keys(A)) if (!["hang", "drop", "away", "flee", "room"].includes(k)) { const f = A[k]; A[k] = async g => { if (hanging()) await A.drop(g); return f(g); }; }
  // the activities, in the order the popup lists them
  const ACTS = [["idle", "Stand"], ["sit", "Sit"], ["look", "Look around"], ["sniff", "Sniff"], ["groom", "Groom"], ["scratch_ear", "Scratch ear"],
    ["scratch_pane", "Paw at screen"], ["scratch_wall", "Scratch wall"], ["knead", "Knead & purr"], ["play_moth", "Play (moth)"], ["play_yarn", "Play (yarn)"],
    ["yawn", "Yawn"], ["stretch", "Stretch"], ["nap", "Nap"], ["walk", "Walk"], ["hop", "Jump to another spot"], ["hang", "Hang under a header or box"],
    ["peek", "Hide behind an edge"], ["away", "Leave & return"], ["petted", "Petted"], ["annoyed", "Annoyed"], ["hunt", "Hunt & pounce"]];
  const W8 = { sit: 2.2, idle: 1, look: 1.5, sniff: 1.5, groom: 1.6, scratch_ear: 0.9, scratch_pane: 0.6, scratch_wall: 1, knead: 0.9, play_moth: 0.7, play_yarn: 0.7,
    yawn: 0.8, stretch: 0.9, walk: 3, hop: 3.5, hang: 2.2, peek: 1.2, away: 0.5 };
  const allowed = k => !off.has(k);
  function pick() {
    if (hanging()) return allowed("hang") && Math.random() < 0.45 ? "hang" : "drop";
    if (idleS() > 90 && allowed("nap") && sim.state !== "nap") return "nap";
    const opts = Object.entries(W8).filter(([k]) => k !== prev && allowed(k) && (k !== "scratch_wall" || wallFor()) && (k !== "peek" || wallFor(-1)));
    let r = Math.random() * opts.reduce((s, [, w]) => s + w, 0); for (const [k, w] of opts) { r -= w; if (r <= 0) return k; } return "sit";
  }
  async function life(g) {
    for (;;) {
      if (!st.shown || !spotOK()) { if (st.shown) await leave(g, 0.35); await wait(g, rnd(1200, 3000)); if (!(await appear(g, st.spot))) { await wait(g, 4000); continue; } }
      if (RM()) { await wait(g, 4000); continue; }
      const n = pick(); await A[n](g); prev = n;
    }
  }
  function interrupt(fn) {
    if (!on || !cv) return; const g = ++gen; mover = null; sim.hopP = -1; sim.y = 0; sim.petting = false; sim.clipL = -1e9;
    if (st.hopping) { st.hopping = false; const t = jumpTarget(["ledge", "shelf", "floor"], 400, 600); if (t) standOn(t.sf, t.x); setState("idle"); sim.snap = true; }
    if (sim.sink > 0 && st.shown) sim.sink = 0;
    (async () => { try { if (fn) await fn(g); prev = ""; await life(g); } catch (e) { if (e !== STOP) console.error(e); } })();
    need();
  }

  /* ---------- the pointer: stroking, a click (steps aside), three quick clicks, wiggling above its spot ---------- */
  function catBox() {
    const s = sim.scale; if (hanging()) return { l: sim.x - 80 * s, r: sim.x + 80 * s, t: sim.groundY, b: sim.groundY + 300 * s };
    return { l: sim.x - (sim.dir > 0 ? 140 : 95) * s, r: sim.x + (sim.dir > 0 ? 95 : 140) * s, t: sim.groundY - 270 * s, b: sim.groundY };
  }
  const inBox = (x, y, b) => x > b.l && x < b.r && y > b.t && y < b.b;
  const calm = () => ["sit", "idle", "look", "sniff", "walk"].includes(sim.state) && sim.sink === 0 && sim.hopP < 0;
  function onMove(e) {
    const x = e.clientX, y = e.clientY, t = now(), d = px0 ? Math.hypot(x - px0[0], y - px0[1]) : 0; px0 = [x, y];
    sim.mouseX = x; sim.mouseY = y; ptr.moved = t; lastInput = t;
    if (!on || !st.shown || RM()) return;
    if (sim.state === "nap") { interrupt(A.wake); return; }
    const box = catBox();
    // something is being dragged through it: step aside once per drag, and no stroking
    if (e.buttons) { if (inBox(x, y, box) && !dragged && !st.hopping && sim.sink === 0) { dragged = true; interrupt(A.room); } return; }
    dragged = false;
    if (inBox(x, y, box) && sim.sink === 0) {
      strokeAcc += d; lastStroke = t;   // while hanging it just purrs where it is (see frame)
      if (strokeAcc > 90 && !hanging() && allowed("petted") && sim.state !== "petted" && !["annoyed", "pounce", "hop", "drop"].includes(sim.state)) { strokeAcc = 0; interrupt(A.petted); }
    } else strokeAcc *= 0.9;
    if (!hanging() && y < sim.groundY - 4 && y > sim.groundY - 110 && Math.abs(x - sim.x) < 220 && !inBox(x, y, box)) {
      playAcc += d; if (playAcc > 260 && t - lastHunt > 7000 && allowed("hunt") && calm()) { playAcc = 0; lastHunt = t; interrupt(A.hunt); }
    } else playAcc *= 0.95;
  }
  function onDown(e) {
    lastInput = now(); if (audioEnabled) initAudio(); if (!on || !st.shown || !inBox(e.clientX, e.clientY, catBox())) return;
    const t = now(); clicks = clicks.filter(c => t - c < 2500); clicks.push(t); playSoftChirp();
    if (clicks.length >= 3 && allowed("annoyed")) { clicks = []; interrupt(A.annoyed); }
    else if (clicks.length === 1 && !st.hopping) interrupt(A.room);
  }
  let chkT = 0;
  function soon() { if (document.hidden) return; clearTimeout(chkT); chkT = setTimeout(() => { if (on && st.shown && !st.hopping && sim.sink === 0 && !spotOK()) interrupt(A.flee); else if (RM()) stillFrame(); }, 220); }
  let watching = false;
  function watch() {
    if (watching) return; watching = true;
    host.onPageChange(soon); host.onThemeChange(() => { readTheme(); soon(); });
    addEventListener("scroll", () => { if (RM()) stillFrame(); soon(); }, { passive: true, capture: true });
    addEventListener("resize", () => { sizeBox(); soon(); }, { passive: true });
    window.visualViewport && visualViewport.addEventListener("resize", () => { sizeBox(); if (RM()) stillFrame(); });
    addEventListener("pointermove", onMove, { passive: true, capture: true }); addEventListener("pointerdown", onDown, { passive: true, capture: true });
    addEventListener("keydown", () => { lastInput = now(); if (on && sim.state === "nap") interrupt(A.wake); }, { passive: true, capture: true });
    document.addEventListener("visibilitychange", () => { if (document.hidden) return; if (on && st.shown) { last = 0; need(); } });
    reduceQ.addEventListener?.("change", () => interrupt(null));
    setInterval(soon, 2500);
  }

  /* ---------- switching Bracel on and off, and its settings. The host remembers on and off per site; delay (ms) is
     how long it waits before arriving, for pages where it comes on its own ---------- */
  let started = false;
  const arrive = delay => async g => { if (delay > 0) await wait(g, delay); if (!st.shown) await appear(g); };
  function start(delay = 0) { if (started) return; on = true; started = true; readTheme(); makeCanvas(); sizeBox(); watch(); interrupt(arrive(delay)); }
  function set(v, delay = 0) {
    // already on but still waiting to arrive on its own: brought now, it comes at once
    if (!!v === on && started) { if (on && !st.shown && !delay) interrupt(arrive(0)); return on; }
    on = !!v;
    if (!on) { gen++; mover = null; st.shown = false; sim.sink = 0; if (cv) draw(0); }
    else if (!started) start(delay); else interrupt(arrive(delay));
    return on;
  }
  function act(name) { if (!A[name]) return false; if (!started) start(); else if (!on) set(true); interrupt(async g => { if (!st.shown && !(await appear(g))) return; await A[name](g); }); return true; }
  function setAct(name, v) { if (v) off.delete(name); else off.add(name); store.set("acts", [...off]); }
  function coat(k) { if (k in COATS) { sim.coat = k; store.set("coat", k); } return sim.coat; }
  function size(v) { if (v != null) { sim.scale = clamp(+v || 0.2, 0.14, 0.45); store.set("size", sim.scale); sizeBox(); soon(); } return sim.scale; }
  function sound(v) { if (v != null) { audioEnabled = !!v; store.set("sound", audioEnabled); if (audioEnabled) { initAudio(); playSoftChirp(); } } return audioEnabled; }
  // for tests: stand on a surface (the real one when that element is a spot) right away in one activity's pose
  function debugPlace(el, x, state, kind) { if (!started) start(); gen++; mover = null; st.spot = surfaces().find(o => o.el === el && (!kind || o.kind === kind)) || { el, kind: kind || "shelf", walls: [], x0: 0, x1: el.getBoundingClientRect().width }; st.x = x; st.shown = true; sim.sink = 0; setState(state || "sit"); draw(0); return true; }
  function apply(o) {
    if (o.coat in COATS) sim.coat = o.coat;
    if (o.size != null) { sim.scale = clamp(+o.size || 0.2, 0.14, 0.45); sizeBox(); soon(); }
    if (o.sound != null) audioEnabled = !!o.sound;
    if (Array.isArray(o.acts)) { off.clear(); o.acts.forEach(k => off.add(k)); }
    if (RM()) stillFrame();
  }
  return {
    start, set, act, setAct, coat, size, sound, apply, debugPlace, refreshTheme: () => { readTheme(); if (RM()) stillFrame(); }, on: () => on, shown: () => st.shown, state: () => sim.state, el: () => cv, spot: () => st.spot && st.spot.kind,
    acts: () => ACTS, enabled: k => allowed(k), coats: () => Object.entries(COATS).map(([k, c]) => [k, c.name]), surfaces, scan, pickSpot,
    _t: host.test ? { sim, st, POSE0, gait, stepToward, computeTargetPose, pick, setState, interrupt, A, W8, RM, gen: () => gen, bounds, HALF, H,
      wait, until, sit, fly, standOn, lineOf, hanging, sitLegs, addParticle, THEME } : undefined
  };

};
