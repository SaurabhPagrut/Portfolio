/* The candidate actions from ROADMAP.md Phase 8, for the demos only (demo-first rule): chase its tail, loaf, box, laser
   dot, knock it off, zoomies, bird watching, roll over and follow me. Nothing here is in the extension.
   They plug into an unchanged engine through three things a demo host can give it: host.pose (poses for the new states),
   host.paint (their props) and test: true (the engine's internals as engine._t). Use:
     const extra = BracelNewActions();
     const engine = BracelEngine({ ...host, test: true, pose: extra.pose, paint: extra.paint });
     extra.install(engine);   // then engine.act("box") etc., and extra.mix(true) lets it pick them on its own
   Numbers in the poses are in Bracel's standing frame (as in computeTargetPose): x forwards, y up is negative. */
globalThis.BracelNewActions = globalThis.BracelNewActions || function newActions() {
  const NEW = [["chase_tail", "Chase its tail"], ["loaf", "Loaf"], ["box", "Box"], ["laser", "Laser dot"], ["knock", "Knock it off"],
    ["zoomies", "Zoomies"], ["bird", "Bird watching"], ["roll", "Roll over"], ["follow", "Follow me"]];
  const W = { chase_tail: 0.6, loaf: 1.2, box: 0.5, laser: 0.5, knock: 0.5, zoomies: 0.5, bird: 0.5, roll: 0.5 };  // follow me: only when asked
  const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, u) => a + (b - a) * u;
  let E = null, _ = null;
  // the props: each belongs to the activity (generation) that made it, so an interrupted one disappears with it
  const P = { box: null, dot: null, cup: null, bird: null };
  const live = p => p && p.g === _.gen();
  const reachX = () => 0.8 * Math.max(300 * _.sim.scale, 135);  // how far from Bracel a prop can be and still be on its canvas

  /* ---------- poses ---------- */
  function pose(T, t, dt) {
    if (!_) return; const s = _.sim, st = s.state;
    if (st === "chase_tail") {
      // low and round, head turned back to the tail, which whips about; the feet patter as it turns
      T.hy = -100; T.cy = -102; T.arch = 14; T.headX = -26; T.headY = -150; T.headYaw = -0.65; T.headRoll = 0.22;
      T.pupilScale = 1.3; T.pupilX = -6; T.tailCurl = 0.9; T.tailSwayAmp = 0.9; T.tailSwayFreq = 9; T.earL = -0.2; T.earR = 0.2;
      s.moving = true; s.gait += dt * 9;
    } else if (st === "loaf") {
      // a bread loaf: paws tucked out of sight, head up, eyes half shut and slowly blinking
      const b = Math.sin(t * 1.4);
      T.hx = -74; T.hy = -46 + b; T.hr = 46; T.cx = -14; T.cy = -48 + b; T.cr = 44; T.arch = 12;
      T.headX = 10; T.headY = -112 + b * 1.2; T.blink = (t % 6) > 5.4 ? 1 : 0.55; T.happySquint = 0.3;
      T.brRx = -78; T.brRy = -32; T.brKx = -72; T.brKy = -16; T.brPx = -64; T.brPy = -9;
      T.blRx = -68; T.blRy = -30; T.blKx = -58; T.blKy = -14; T.blPx = -46; T.blPy = -8;
      T.frRx = -6; T.frRy = -34; T.frKx = 6; T.frKy = -18; T.frPx = 12; T.frPy = -12;
      T.flRx = -16; T.flRy = -32; T.flKx = -2; T.flKy = -16; T.flPx = 6; T.flPy = -11;
      T.tailRootX = -114; T.tailRootY = -34; T.tailAngle = 2.85; T.tailSwayAmp = 0.04; T.tailCurl = 0.75;
    } else if (st === "box") {
      // sitting inside the box: only the head and ears show over its edge, peeking about
      _.sitLegs(T); const peek = Math.max(0, Math.sin(t * 1.3));
      T.cy = -112; T.headX = 2; T.headY = -150 - peek * 22; T.pupilX = Math.sin(t * 0.9) * 7; T.pupilScale = 1.2;
      T.earL = Math.sin(t * 3.1) * 0.15; T.earR = -T.earL; T.tailSwayAmp = 0.1;
    } else if (st === "knock") {
      // sits at the edge and pats the cup forwards with the near front paw, watching it
      _.sitLegs(T); const ph = (t % 1.05) / 1.05, pat = Math.sin(ph * Math.PI);
      T.cy = -110; T.headX = 12; T.headY = -172; T.headYaw = 0.55; T.pupilX = 5; T.pupilY = 4; T.pupilScale = 1.15;
      T.flRx = -14; T.flRy = -100; T.flKx = 26; T.flKy = -78 - pat * 22; T.flPx = 58 + pat * 6; T.flPy = -16 - pat * 44; T.flInFrontOfHead = 1;
      T.tailSwayAmp = 0.45; T.tailSwayFreq = 3;
    } else if (st === "peer_down") {
      _.sitLegs(T); T.cy = -110; T.headX = 22; T.headY = -160; T.headYaw = 0.6; T.pupilY = 6.5; T.pupilX = 6; T.browLift = 2;
    } else if (st === "zoom") {
      // ears back, tail up, head low and forwards: a run, not a walk
      T.hy = -108; T.cy = -110; T.headX = 30; T.headY = -160; T.headYaw = 0.65; T.earL = -0.55; T.earR = 0.55; T.pupilScale = 1.35;
      T.tailAngle = 1.55; T.tailSwayAmp = 0.15; T.tailCurl = 0.05;
    } else if (st === "bird") {
      // sits up tall, eyes on the bird, chattering, tail twitching
      _.sitLegs(T); const b = P.bird, hx = s.x + s.dir * 2 * s.scale;
      T.cy = -116; T.headX = 0; T.headY = -188; T.pupilScale = 1.3; T.pupilY = -6.5; T.browLift = 3;
      if (live(b)) { const d = (b.x - hx) * s.dir; T.pupilX = clamp(d * 0.06, -8.5, 8.5); T.headYaw = clamp(d * 0.006, -0.6, 0.6); T.headRoll = clamp(d * 0.0012, -0.15, 0.15); }
      T.mouthOpen = 0.1 + 0.2 * Math.abs(Math.sin(t * 26)); T.tailSwayAmp = 0.6; T.tailSwayFreq = 9; T.earL = 0.22; T.earR = -0.22;
    } else if (st === "roll") {
      // on its back: body low, head tipped over sideways, all four paws in the air, batting a little
      const w = Math.sin(t * 3);
      T.hx = -72; T.hy = -40; T.hr = 45; T.cx = -18; T.cy = -42; T.cr = 43; T.arch = -6;
      T.headX = 22; T.headY = -60; T.headRoll = 0.95; T.happySquint = 0.6; T.mouthOpen = 0.12; T.pupilY = -3;
      T.frRx = -4; T.frRy = -50; T.frKx = 12; T.frKy = -98; T.frPx = 2; T.frPy = -128 + w * 6;
      T.flRx = -20; T.flRy = -48; T.flKx = -4; T.flKy = -94; T.flPx = -20; T.flPy = -122 - w * 6;
      T.brRx = -90; T.brRy = -46; T.brKx = -110; T.brKy = -88; T.brPx = -96; T.brPy = -120 - w * 4;
      T.blRx = -76; T.blRy = -44; T.blKx = -92; T.blKy = -84; T.blPx = -80; T.blPy = -110 + w * 4;
      T.flInFrontOfHead = 0; T.blInFrontOfHead = 0;
      T.tailRootX = -112; T.tailRootY = -34; T.tailAngle = 2.95; T.tailCurl = 0.4; T.tailSwayAmp = 0.35; T.tailSwayFreq = 4;
    }
  }

  /* ---------- props, drawn on Bracel's canvas in page pixels ---------- */
  function paint(ctx, dt) {
    if (!_) return; const s = _.sim, k = s.scale;
    const b = P.box;
    if (live(b)) {
      b.a = Math.min(1, b.a + dt * 3); const w = 250 * k, h = 118 * k, x = b.x - w / 2, y = s.groundY - h, f = 34 * k;
      ctx.save(); ctx.globalAlpha = b.a; ctx.lineJoin = "round"; ctx.lineWidth = Math.max(1, 2.4 * k);
      ctx.fillStyle = "#b9844a"; ctx.strokeStyle = "#7c5126";
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - f, y - f * 0.9); ctx.lineTo(x + w * 0.3, y - f * 0.9); ctx.lineTo(x + w * 0.42, y); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w + f, y - f * 0.9); ctx.lineTo(x + w * 0.7, y - f * 0.9); ctx.lineTo(x + w * 0.58, y); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#d4a066"; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = "rgba(124,81,38,.35)"; ctx.fillRect(x + w * 0.44, y, w * 0.12, h * 0.45);
      ctx.restore();
    }
    const d = P.dot;
    if (live(d) && d.on) {
      const x = d.x + Math.sin(s.globalTime * 31) * 1.2, y = s.groundY - 2, r = Math.max(3, 10 * k);
      ctx.save(); const gl = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2); gl.addColorStop(0, "rgba(255,40,40,.55)"); gl.addColorStop(1, "rgba(255,40,40,0)");
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ff2a2a"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    const c = P.cup;
    if (live(c) && c.a > 0) {
      if (c.falling) { c.vy += 1400 * dt; c.y += c.vy * dt; c.rot += 7 * dt * c.dir; if (c.y > c.y0 + 18) c.a = Math.max(0, c.a - dt * 2.2); }
      const w = 46 * k, h = 52 * k;
      ctx.save(); ctx.globalAlpha = c.a; ctx.translate(c.x, c.y - h / 2); ctx.rotate(c.rot); ctx.lineWidth = Math.max(1, 2 * k);
      ctx.fillStyle = "#f8fafc"; ctx.strokeStyle = "#475569";
      ctx.beginPath(); ctx.arc(w / 2, 0, h * 0.24, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-w / 2, -h / 2, w, h, 3 * k) : ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
      ctx.fillStyle = _.THEME.accent || "#2563eb"; ctx.fillRect(-w / 2 + 1, -h * 0.12, w - 2, h * 0.2);
      ctx.restore();
    }
    const bd = P.bird;
    if (live(bd)) {
      const span = Math.max(18, 120 * k), fl = Math.sin(s.globalTime * 14);
      ctx.save(); ctx.strokeStyle = s.bgTheme === "dark" ? "#cbd5e1" : "#334155"; ctx.lineWidth = Math.max(1.4, 5 * k); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(bd.x - span / 2, bd.y - fl * span * 0.25); ctx.quadraticCurveTo(bd.x - span / 4, bd.y - span * 0.3 * (1 + fl * 0.5), bd.x, bd.y);
      ctx.quadraticCurveTo(bd.x + span / 4, bd.y - span * 0.3 * (1 + fl * 0.5), bd.x + span / 2, bd.y - fl * span * 0.25); ctx.stroke(); ctx.restore();
    }
  }

  /* ---------- the activities ---------- */
  const A = {
    chase_tail: async g => {
      _.setState("chase_tail"); let u = 0, flip = 0;
      await _.until(g, dt => { u += dt; flip += dt; if (flip > 0.24) { flip = 0; _.sim.dir *= -1; } return u >= rnd(2.6, 3.4); });
      _.setState("sit"); await _.wait(g, 1400); await _.A.groom(g);   // as if nothing happened
    },
    loaf: async g => { _.setState("sit"); await _.wait(g, 900); _.setState("loaf"); await _.wait(g, rnd(18000, 35000)); await _.sit(g, 2000); },
    box: async g => {
      const s = _.sim, k = s.scale; P.box = { g, x: s.x - s.dir * 30 * k, a: 0 }; _.setState("look"); await _.wait(g, 1600);
      // hop in: up and down on the spot, landing inside, behind the box's front
      _.setState("hop"); let u = 0; s.hopP = 0;
      try { await _.until(g, dt => { u += dt / 0.8; s.hopP = Math.min(1, u); s.y = -Math.sin(clamp((u - 0.39) / 0.61, 0, 1) * Math.PI) * 90 * k; return u >= 1; }); }
      finally { s.hopP = -1; s.y = 0; }
      _.setState("box"); await _.wait(g, rnd(7000, 11000));
      _.setState("hop"); u = 0; s.hopP = 0; const x0 = _.st.x, x1 = x0 + s.dir * 60 * k;
      try { await _.until(g, dt => { u += dt / 0.8; s.hopP = Math.min(1, u); const a = clamp((u - 0.39) / 0.61, 0, 1); _.st.x = lerp(x0, x1, a); s.y = -Math.sin(a * Math.PI) * 90 * k; return u >= 1; }); }
      finally { s.hopP = -1; s.y = 0; }
      P.box = null; await _.sit(g, 2500);
    },
    laser: async g => {
      const s = _.sim, b = _.bounds(); if (b.r - b.l < 60) return _.sit(g);
      const near = () => clamp(rnd(b.l, b.r), s.x - reachX(), s.x + reachX());
      P.dot = { g, x: clamp(s.x + s.dir * reachX() * 0.6, b.l, b.r), on: true };
      for (let i = 0; i < 3; i++) {
        s.dir = P.dot.x >= s.x ? 1 : -1; _.setState("stalk"); await _.wait(g, rnd(1100, 1800));
        const x0 = _.st.x, x1 = _.st.x + clamp(P.dot.x, b.l, b.r) - s.x, last = i === 2; let u = 0, moved = false; _.setState("pounce"); s.hopP = 0;
        try {
          await _.until(g, dt => {
            u += dt / 0.55; const a = Math.min(1, u); s.hopP = a; _.st.x = lerp(x0, x1, a); s.y = -Math.sin(a * Math.PI) * 16;
            if (a > 0.75 && !moved) { moved = true; if (last) P.dot.on = false; else { let n = near(); for (let j = 0; j < 6 && Math.abs(n - P.dot.x) < 40; j++) n = near(); P.dot.x = n; } }
            return u >= 1;
          });
        } finally { s.hopP = -1; s.y = 0; }
        _.addParticle("spark", s.x + s.dir * 14, s.groundY - 6, s.dir * 1.2, -1.4); await _.wait(g, 350);
      }
      P.dot = null; _.setState("look"); await _.wait(g, 2600); await _.sit(g, 2000);   // where did it go?
    },
    knock: async g => {
      const s = _.sim, k = s.scale, b = _.bounds(); if (b.r - b.l < 40) return _.sit(g);
      const right = s.x < (b.l + b.r) / 2 ? false : true, edge = right ? b.r : b.l;
      _.setState("walk"); await _.until(g, dt => _.stepToward(edge, 42, dt)); s.dir = right ? 1 : -1;
      // the cup stands just in front of its paws; the edge of the spot is HALF() further than its middle
      const lip = s.x + s.dir * _.HALF(); P.cup = { g, x: s.x + s.dir * 62 * k, y: s.groundY, y0: s.groundY, vy: 0, rot: 0, dir: s.dir, a: 1, falling: false };
      _.setState("sit"); await _.wait(g, 900); _.setState("knock");
      for (let i = 0; i < 6 && !P.cup.falling; i++) {
        await _.wait(g, 1050); P.cup.x += s.dir * Math.max(4, 22 * k);
        if ((P.cup.x - lip) * s.dir > -6 * k) P.cup.falling = true;
      }
      P.cup.falling = true; _.setState("peer_down"); await _.wait(g, 2200); P.cup = null; await _.sit(g, 2500);   // and looks pleased
    },
    zoomies: async g => {
      const s = _.sim, b = _.bounds(); if (b.r - b.l < 80) return _.A.walk(g);
      const first = s.x < (b.l + b.r) / 2 ? b.r : b.l, back = first === b.r ? b.l : b.r;
      _.setState("zoom"); await _.until(g, dt => _.stepToward(first, 200, dt)); _.setState("zoom");
      await _.until(g, dt => _.stepToward(back, 210, dt)); _.setState("zoom");
      await _.until(g, dt => _.stepToward((b.l + b.r) / 2, 170, dt));
      _.setState("idle"); await _.wait(g, 500); await _.A.groom(g);
    },
    bird: async g => {
      const s = _.sim, R = reachX(), from = s.dir > 0 ? -1 : 1; _.setState("sit"); await _.wait(g, 600);
      const y = s.groundY - Math.max(360 * s.scale, 90);
      P.bird = { g, x: s.x + from * R, y }; _.setState("bird"); let u = 0;
      await _.until(g, dt => { u += dt / 4.2; P.bird.x = s.x + from * R * (1 - 2 * u); P.bird.y = y + Math.sin(u * 9) * 6; return u >= 1; });
      P.bird = null; _.setState("look"); await _.wait(g, 1800); await _.sit(g, 2000);
    },
    roll: async g => { _.setState("sit"); await _.wait(g, 700); _.setState("roll"); await _.wait(g, rnd(4500, 6500)); _.setState("stretch"); await _.wait(g, 2400); await _.sit(g, 2000); },
    // walks along the edges towards the pointer, jumping across to the spot nearest it, and sits close by
    follow: async g => {
      const s = _.sim, t0 = performance.now(); let settled = 0;
      while (performance.now() - t0 < 20000 && settled < 3) {
        if (!s.mouseActive) { _.setState("look"); await _.wait(g, 900); continue; }
        const px = s.mouseX, py = s.mouseY, here = _.st.spot;
        let best = null;
        for (const sf of E.surfaces()) {
          if (sf.kind === "bar") continue;
          const r = sf.el.getBoundingClientRect(), y = _.lineOf(sf, r), lo = r.left + sf.x0 + _.HALF(), hi = r.left + sf.x1 - _.HALF(); if (hi < lo) continue;
          const x = clamp(px, lo, hi), d = Math.hypot(x - px, Math.max(0, y - py) * 0.5 + Math.max(0, py - y - 40) * 1.5);
          const same = here && sf.el === here.el && sf.kind === here.kind, dy = y - s.groundY, ok = same || (Math.abs(x - s.x) < 280 && dy > -190 && dy < 280);
          if (!best || d < best.d) best = { sf, x, y, d, same, ok };
        }
        if (!best) break;
        if (best.same || !best.ok) {
          const b = _.bounds(), tx = clamp(best.same ? best.x : px, b.l, b.r);
          if (Math.abs(tx - s.x) > 24) { _.setState("walk"); await _.until(g, dt => _.stepToward(tx, 70, dt)); settled = 0; }
          else { s.dir = px >= s.x ? 1 : -1; _.setState("sit"); await _.wait(g, 700); settled += 0.7; }
          if (!best.same && Math.abs(tx - s.x) <= 24) { s.dir = px >= s.x ? 1 : -1; _.setState("look"); await _.wait(g, 700); settled += 0.7; }
        } else {
          await _.fly(g, best.x, best.y, 0.8 + Math.min(0.8, Math.abs(best.y - s.groundY) / 500), 18 + Math.min(110, Math.max(0, s.groundY - best.y) * 0.5));
          _.standOn(best.sf, best.x); _.setState("idle"); settled = 0; await _.wait(g, 300);
        }
      }
      await _.sit(g, 2500);
    }
  };

  function install(engine) {
    E = engine; _ = engine._t; if (!_) throw new Error("BracelNewActions needs the engine made with test: true");
    for (const [k, f] of Object.entries(A)) _.A[k] = async g => { if (_.hanging()) await _.A.drop(g); return f(g); };
  }
  // put them in (or take them out of) what Bracel picks from on its own
  function mix(on) { for (const [k, w] of Object.entries(W)) { if (on) _.W8[k] = w; else delete _.W8[k]; } }
  return { NEW, pose, paint, install, mix };
};
