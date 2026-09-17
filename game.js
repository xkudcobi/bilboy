/* Boyutla — günlük boyut tahmin oyunu */
(() => {
  "use strict";

  // ---------- Sabitler ----------
  const W = 840, H = 510, GROUND = 430;
  const REF_X = 30, REF_MAX_H = 132, REF_MAX_W = 200;
  const ROUNDS = 5;
  const SCORE_TABLE = [
    { error: 0.06, score: 100 },
    { error: 0.12, score: 90 },
    { error: 0.20, score: 78 },
    { error: 0.32, score: 62 },
    { error: 0.50, score: 45 },
    { error: 0.75, score: 30 },
    { error: 1.10, score: 18 },
    { error: 1.60, score: 0 },
  ];
  const RATIO_MIN = 1.3, RATIO_MAX = 15;

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const canvas = $("board");
  const ctx = canvas.getContext("2d");
  const el = {
    roundLabel: $("round-label"), modeLabel: $("mode-label"), totalScore: $("total-score"),
    dots: $("round-dots"),
    refName: $("ref-name"), refSub: $("ref-sub"), targetName: $("target-name"), targetSub: $("target-sub"),
    refScaleLabel: $("ref-scale-label"), targetScaleLabel: $("target-scale-label"),
    controls: $("controls"), btnLock: $("btn-lock"),
    result: $("result"), resGuess: $("res-guess"), resActual: $("res-actual"), resError: $("res-error"),
    resScore: $("res-score"), resFact: $("res-fact"), btnNext: $("btn-next"),
    game: $("game"), final: $("final"), finalTitle: $("final-title"), finalPts: $("final-pts"),
    finalMsg: $("final-msg"), finalRounds: $("final-rounds"), btnShare: $("btn-share"),
    btnAgain: $("btn-again"), shareNote: $("share-note"),
    zoomIn: $("zoom-in"), zoomOut: $("zoom-out"), zoomFit: $("zoom-fit"), zoomLevel: $("zoom-level"),
    help: $("help"), btnHelp: $("btn-help"), btnHelpClose: $("btn-help-close"), btnPractice: $("btn-practice"),
  };

  // ---------- Yardımcılar ----------
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function todayKey() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rnd) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const nf = new Intl.NumberFormat("tr-TR", { maximumSignificantDigits: 4 });
  function formatMeters(m) {
    const a = Math.abs(m);
    const u = a >= 1000 ? ["km", 1000] : a >= 1 ? ["m", 1] : a >= 0.01 ? ["cm", 0.01] : ["mm", 0.001];
    return `${nf.format(m / u[1])} ${u[0]}`;
  }
  function scoreFromError(err) {
    if (!Number.isFinite(err) || err >= SCORE_TABLE.at(-1).error) return 0;
    if (err <= SCORE_TABLE[0].error) return 100;
    for (let i = 1; i < SCORE_TABLE.length; i++) {
      const a = SCORE_TABLE[i - 1], b = SCORE_TABLE[i];
      if (err <= b.error) {
        const t = (err - a.error) / (b.error - a.error);
        return Math.max(1, Math.min(99, Math.round(a.score + (b.score - a.score) * t)));
      }
    }
    return 0;
  }
  function keyDim(shape) { return shape.horiz ? shape.nW : shape.nH; }

  // ---------- Bulmaca üretimi ----------
  function buildRounds(seedStr) {
    const rnd = mulberry32(hashString(seedStr));
    const pool = shuffle(SHAPES, rnd);
    const rounds = [];
    const usedIds = new Set();
    for (const target of pool) {
      if (rounds.length >= ROUNDS) break;
      if (usedIds.has(target.id)) continue;
      const refs = pool.filter((r) => {
        if (r.id === target.id || usedIds.has(r.id)) return false;
        const ratio = target.realM / r.realM;
        return ratio >= RATIO_MIN && ratio <= RATIO_MAX;
      });
      if (!refs.length) continue;
      const ref = refs[Math.floor(rnd() * refs.length)];
      usedIds.add(target.id); usedIds.add(ref.id);
      rounds.push({ target, ref });
    }
    return rounds;
  }

  // ---------- Oyun durumu ----------
  const S = {
    mode: "daily", seed: todayKey(),
    rounds: [], round: 0, phase: "play",
    obj: { x: 0, y: GROUND, scale: 1 },
    sceneScale: 1,
    scores: [], total: 0,
    drag: null, pointers: new Map(), pinch: null,
    paths: new Map(),
  };

  function path2d(shape) {
    if (!S.paths.has(shape.id)) S.paths.set(shape.id, new Path2D(shape.path));
    return S.paths.get(shape.id);
  }
  // Path'in gerçek piksel sınırlarını ölçüp nW/nH ve offset değerlerini düzelt
  function measureBounds(shape) {
    if (shape.measured) return;
    const pad = 4;
    const w = Math.ceil(shape.nW) + pad * 2, h = Math.ceil(shape.nH) + pad * 2;
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d");
    x.translate(pad, pad); x.fillStyle = "#000";
    x.fill(path2d(shape), shape.fillRule || "nonzero");
    const d = x.getImageData(0, 0, w, h).data;
    let l = w, r = -1, t = h, b = -1;
    for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
      if (d[(y * w + i) * 4 + 3] > 0) { if (i < l) l = i; if (i > r) r = i; if (y < t) t = y; if (y > b) b = y; }
    }
    if (r > l) {
      shape.offX = -(l - pad); shape.offY = -(t - pad);
      shape.nW = r - l + 1; shape.nH = b - t + 1;
    } else { shape.offX = 0; shape.offY = 0; }
    shape.measured = true;
  }
  function cur() { return S.rounds[S.round]; }
  function refFit(ref) { return Math.min(REF_MAX_H / ref.nH, REF_MAX_W / ref.nW); }
  function pxPerMeter(ref) { return (keyDim(ref) * refFit(ref)) / ref.realM; }
  function correctScale(r) { return (r.target.realM * pxPerMeter(r.ref)) / keyDim(r.target); }
  function refBox(ref) {
    const f = refFit(ref);
    return { left: REF_X, top: GROUND - ref.nH * f, right: REF_X + ref.nW * f, bottom: GROUND, fit: f };
  }
  function objBox(shape, obj) {
    const w = shape.nW * obj.scale, h = shape.nH * obj.scale;
    return { left: obj.x, top: obj.y - h, right: obj.x + w, bottom: obj.y, w, h };
  }
  // dünya <-> ekran (tahta koordinatı 840x510)
  function toScreen(x, y) {
    const s = S.sceneScale;
    return { x: REF_X + (x - REF_X) * s, y: GROUND + (y - GROUND) * s };
  }
  function toWorld(x, y) {
    const s = S.sceneScale;
    return { x: REF_X + (x - REF_X) / s, y: GROUND + (y - GROUND) / s };
  }
  function clientToBoard(e) {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }

  // ---------- Tur kurulumu ----------
  function setupRound() {
    const r = cur();
    const rb = refBox(r.ref);
    // hedefi nötr bir boyutla başlat (ana boyutu ~110 px)
    const startScale = 110 / keyDim(r.target);
    S.obj = { x: rb.right + 60, y: GROUND, scale: startScale };
    S.sceneScale = 1;
    S.phase = "play";
    S.drag = null; S.pinch = null; S.pointers.clear();

    el.roundLabel.textContent = `Tur ${S.round + 1} / ${S.rounds.length}`;
    el.refName.textContent = r.ref.name; el.refSub.textContent = r.ref.sub || "";
    el.targetName.textContent = r.target.name; el.targetSub.textContent = r.target.sub || "";
    el.refScaleLabel.textContent = r.ref.horiz ? "Uzunluk ölçekli" : "Yükseklik ölçekli";
    el.targetScaleLabel.textContent = r.target.horiz ? "Uzunluğu ayarla" : "Yüksekliği ayarla";
    el.controls.classList.remove("hidden");
    el.result.classList.add("hidden");
    el.btnLock.disabled = false;
    renderDots();
    updateZoomLabel();
    draw();
  }

  function renderDots() {
    el.dots.innerHTML = "";
    for (let i = 0; i < S.rounds.length; i++) {
      const d = document.createElement("span");
      if (i < S.scores.length) d.classList.add("done");
      else if (i === S.round) d.classList.add("active");
      el.dots.appendChild(d);
    }
  }
  function updateZoomLabel() {
    el.zoomLevel.textContent = `${Math.round(S.sceneScale * 100)}%`;
  }

  // ---------- Çizim ----------
  function fillShape(shape, x, y, scale, color, alpha = 1, stroke = null) {
    ctx.save();
    ctx.translate(x, y - shape.nH * scale);
    ctx.scale(scale, scale);
    ctx.translate(shape.offX || 0, shape.offY || 0);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fill(path2d(shape), shape.fillRule || "nonzero");
    if (stroke) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2 / (scale * S.sceneScale);
      ctx.stroke(path2d(shape));
    }
    ctx.restore();
  }

  function drawGuide(box, horiz, color) {
    // ekran koordinatında noktalı kılavuz
    const a = toScreen(box.left, box.top), b = toScreen(box.right, box.bottom);
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.globalAlpha = 0.9;
    ctx.beginPath();
    if (horiz) {
      const y = b.y + 12;
      ctx.moveTo(a.x, y); ctx.lineTo(b.x, y);
      ctx.moveTo(a.x, y - 5); ctx.lineTo(a.x, y + 5);
      ctx.moveTo(b.x, y - 5); ctx.lineTo(b.x, y + 5);
    } else {
      const x = b.x + 12;
      ctx.moveTo(x, a.y); ctx.lineTo(x, b.y);
      ctx.moveTo(x - 5, a.y); ctx.lineTo(x + 5, a.y);
      ctx.moveTo(x - 5, b.y); ctx.lineTo(x + 5, b.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    const r = cur(); if (!r) return;
    const colRef = cssVar("--ref"), colTarget = cssVar("--target"), colOk = cssVar("--correct");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // ızgara
    ctx.strokeStyle = cssVar("--grid"); ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 60) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y <= H; y += 60) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    // zemin
    ctx.strokeStyle = cssVar("--ground"); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();

    // sahne
    ctx.save();
    ctx.translate(REF_X, GROUND); ctx.scale(S.sceneScale, S.sceneScale); ctx.translate(-REF_X, -GROUND);
    const rb = refBox(r.ref);
    fillShape(r.ref, REF_X, GROUND, rb.fit, colRef);
    if (S.phase === "result") {
      const cs = correctScale(r);
      fillShape(r.target, S.obj.x, S.obj.y, cs, colOk, 0.35, colOk);
      fillShape(r.target, S.obj.x, S.obj.y, S.obj.scale, colTarget, 0.55);
    } else {
      fillShape(r.target, S.obj.x, S.obj.y, S.obj.scale, colTarget);
    }
    ctx.restore();

    // kılavuzlar
    drawGuide(rb, r.ref.horiz, colRef);
    const ob = objBox(r.target, S.obj);
    drawGuide(ob, r.target.horiz, colTarget);

    // etiketler
    ctx.save();
    ctx.font = "600 12px system-ui, sans-serif"; ctx.textAlign = "center";
    const rs = toScreen((rb.left + rb.right) / 2, GROUND);
    ctx.fillStyle = colRef; ctx.fillText("Referans", rs.x, Math.min(H - 8, rs.y + 26));
    ctx.restore();

    // köşe tutamakları
    if (S.phase === "play") {
      ctx.save();
      ctx.fillStyle = cssVar("--card"); ctx.strokeStyle = colTarget; ctx.lineWidth = 2;
      for (const c of corners(ob)) {
        ctx.beginPath(); ctx.rect(c.x - 5, c.y - 5, 10, 10); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function corners(box) {
    return [
      { id: "tl", ...toScreen(box.left, box.top) },
      { id: "tr", ...toScreen(box.right, box.top) },
      { id: "bl", ...toScreen(box.left, box.bottom) },
      { id: "br", ...toScreen(box.right, box.bottom) },
    ];
  }

  // ---------- Etkileşim ----------
  const MIN_SCALE = 0.005, MAX_SCALE = 5000;
  function clampScale(s) { return Math.max(MIN_SCALE, Math.min(MAX_SCALE, s)); }

  function hitCorner(sx, sy) {
    const ob = objBox(cur().target, S.obj);
    for (const c of corners(ob)) if (Math.hypot(sx - c.x, sy - c.y) <= 18) return c.id;
    return null;
  }
  function hitInside(sx, sy) {
    const ob = objBox(cur().target, S.obj);
    const p = toWorld(sx, sy);
    return p.x >= ob.left && p.x <= ob.right && p.y >= ob.top && p.y <= ob.bottom;
  }

  function setScaleKeepingPoint(newScale, wx, wy) {
    // (wx,wy) dünya noktası sabit kalacak şekilde ölçekle
    const t = cur().target;
    const old = S.obj.scale;
    newScale = clampScale(newScale);
    const k = newScale / old;
    S.obj.x = wx - (wx - S.obj.x) * k;
    S.obj.y = wy - (wy - S.obj.y) * k;
    S.obj.scale = newScale;
    void t;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (S.phase !== "play") return;
    canvas.setPointerCapture(e.pointerId);
    const b = clientToBoard(e);
    S.pointers.set(e.pointerId, b);
    if (S.pointers.size === 2) {
      const [p1, p2] = [...S.pointers.values()];
      const c = toWorld((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      S.pinch = { initDist: Math.max(1, Math.hypot(p1.x - p2.x, p1.y - p2.y)), initScale: S.obj.scale, center: c };
      S.drag = null;
      return;
    }
    const corner = hitCorner(b.x, b.y);
    const ob = objBox(cur().target, S.obj);
    if (corner) {
      const anchor = {
        x: corner.includes("l") ? ob.right : ob.left,
        y: corner.includes("t") ? ob.bottom : ob.top,
      };
      const p = toWorld(b.x, b.y);
      S.drag = { type: "resize", corner, anchor, initDist: Math.max(1, Math.hypot(p.x - anchor.x, p.y - anchor.y)), initScale: S.obj.scale };
      canvas.style.cursor = "nwse-resize";
    } else if (hitInside(b.x, b.y)) {
      const p = toWorld(b.x, b.y);
      S.drag = { type: "move", dx: p.x - S.obj.x, dy: p.y - S.obj.y };
      canvas.style.cursor = "grabbing";
    } else {
      S.drag = null;
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const b = clientToBoard(e);
    if (S.phase !== "play") return;
    if (S.pointers.has(e.pointerId)) S.pointers.set(e.pointerId, b);
    if (S.pinch && S.pointers.size >= 2) {
      const [p1, p2] = [...S.pointers.values()];
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      setScaleKeepingPoint(S.pinch.initScale * (d / S.pinch.initDist), S.pinch.center.x, S.pinch.center.y);
      draw(); return;
    }
    if (!S.drag) {
      canvas.style.cursor = hitCorner(b.x, b.y) ? "nwse-resize" : hitInside(b.x, b.y) ? "grab" : "default";
      return;
    }
    const t = cur().target;
    const p = toWorld(b.x, b.y);
    if (S.drag.type === "move") {
      S.obj.x = p.x - S.drag.dx; S.obj.y = p.y - S.drag.dy;
    } else {
      const d = Math.hypot(p.x - S.drag.anchor.x, p.y - S.drag.anchor.y);
      const ns = clampScale(S.drag.initScale * (d / S.drag.initDist));
      S.obj.scale = ns;
      const w = t.nW * ns, h = t.nH * ns;
      S.obj.x = S.drag.corner.includes("l") ? S.drag.anchor.x - w : S.drag.anchor.x;
      S.obj.y = S.drag.corner.includes("t") ? S.drag.anchor.y : S.drag.anchor.y + h;
    }
    draw();
  });

  function endPointer(e) {
    S.pointers.delete(e.pointerId);
    if (S.pointers.size < 2) S.pinch = null;
    if (S.pointers.size === 0) { S.drag = null; canvas.style.cursor = "default"; }
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  canvas.addEventListener("wheel", (e) => {
    if (S.phase !== "play") return;
    e.preventDefault();
    const b = clientToBoard(e);
    const p = toWorld(b.x, b.y);
    const ob = objBox(cur().target, S.obj);
    const cx = (ob.left + ob.right) / 2, cy = (ob.top + ob.bottom) / 2;
    const factor = Math.pow(1.0015, -e.deltaY);
    const inside = hitInside(b.x, b.y);
    setScaleKeepingPoint(S.obj.scale * factor, inside ? p.x : cx, inside ? p.y : cy);
    draw();
  }, { passive: false });

  // ---------- Tahta zoom ----------
  function setSceneScale(s) {
    S.sceneScale = Math.max(0.01, Math.min(4, s));
    updateZoomLabel(); draw();
  }
  el.zoomIn.addEventListener("click", () => setSceneScale(S.sceneScale * 1.25));
  el.zoomOut.addEventListener("click", () => setSceneScale(S.sceneScale / 1.25));
  el.zoomFit.addEventListener("click", fitScene);

  function fitScene() {
    const r = cur();
    const rb = refBox(r.ref);
    const ob = objBox(r.target, S.obj);
    let left = Math.min(rb.left, ob.left), top = Math.min(rb.top, ob.top);
    let right = Math.max(rb.right, ob.right), bottom = Math.max(rb.bottom, ob.bottom);
    if (S.phase === "result") {
      const cs = correctScale(r);
      const cb = objBox(r.target, { x: S.obj.x, y: S.obj.y, scale: cs });
      left = Math.min(left, cb.left); top = Math.min(top, cb.top);
      right = Math.max(right, cb.right); bottom = Math.max(bottom, cb.bottom);
    }
    // sahne (30,430) etrafında ölçeklenir; içeriği 20px kenar payıyla sığdır
    const sx = (W - REF_X - 40) / Math.max(1, right - REF_X);
    const sy = (GROUND - 40) / Math.max(1, GROUND - top);
    const sLeft = left < REF_X ? (REF_X - 20) / (REF_X - left) : Infinity;
    const sBottom = bottom > GROUND ? (H - GROUND - 20) / (bottom - GROUND) : Infinity;
    setSceneScale(Math.min(sx, sy, sLeft, sBottom, 1.5));
  }

  // ---------- Kilitle / sonuç ----------
  el.btnLock.addEventListener("click", lockIn);
  function lockIn() {
    if (S.phase !== "play") return;
    const r = cur();
    const ppm = pxPerMeter(r.ref);
    const guessPx = keyDim(r.target) * S.obj.scale;
    const guessM = guessPx / ppm;
    const err = Math.abs(guessM - r.target.realM) / r.target.realM;
    const score = scoreFromError(err);

    S.phase = "result";
    S.scores.push(score);
    S.total += score;
    el.totalScore.textContent = S.total;
    el.resGuess.textContent = formatMeters(guessM);
    el.resActual.textContent = formatMeters(r.target.realM);
    el.resError.textContent = `%${Math.round(err * 100)} ${guessM > r.target.realM ? "büyük" : "küçük"}`;
    el.resScore.textContent = score;
    el.resFact.innerHTML = r.target.fact || "";
    el.btnNext.textContent = S.round < S.rounds.length - 1 ? "Sonraki tur" : "Sonuçları gör";
    el.controls.classList.add("hidden");
    el.result.classList.remove("hidden");
    renderDots();
    fitScene();
    if (S.mode === "daily") saveProgress();
  }

  el.btnNext.addEventListener("click", () => {
    if (S.round < S.rounds.length - 1) { S.round++; setupRound(); }
    else showFinal();
  });

  // ---------- Final ----------
  function message(ratio) {
    if (ratio >= 0.9) return "Mükemmel göz! Ölçek senin için sır değil.";
    if (ratio >= 0.7) return "Çok iyi — çoğu insandan daha keskin bir gözün var.";
    if (ratio >= 0.5) return "Fena değil — ölçek göründüğünden zordur.";
    return "Zorlu bir set. Gözünü ölçeğe alıştırmaya devam et.";
  }
  function showFinal() {
    el.game.classList.add("hidden");
    el.final.classList.remove("hidden");
    el.finalTitle.textContent = S.mode === "daily" ? `Bugünkü sonucun (${S.seed})` : "Pratik sonucu";
    el.finalPts.textContent = S.total;
    el.finalMsg.textContent = message(S.total / (100 * S.rounds.length));
    el.finalRounds.innerHTML = "";
    S.rounds.forEach((r, i) => {
      const li = document.createElement("li");
      li.innerHTML = `${r.target.name}<b>${S.scores[i] ?? 0}</b>`;
      el.finalRounds.appendChild(li);
    });
    el.shareNote.textContent = "";
  }
  function squares() {
    return S.scores.map((s) => (s >= 90 ? "🟩" : s >= 60 ? "🟨" : s >= 30 ? "🟧" : "🟥")).join("");
  }
  el.btnShare.addEventListener("click", async () => {
    const text = `Boyutla ${S.mode === "daily" ? S.seed : "(pratik)"}\n${squares()} ${S.total}/${100 * S.rounds.length}\n${location.href.split("#")[0]}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); el.shareNote.textContent = "Sonuç panoya kopyalandı."; }
    } catch { el.shareNote.textContent = text; }
  });
  el.btnAgain.addEventListener("click", () => startGame("practice"));

  // ---------- Kayıt ----------
  function storageKey() { return `boyutla:${S.seed}`; }
  function saveProgress() {
    try {
      localStorage.setItem(storageKey(), JSON.stringify({ scores: S.scores, total: S.total, round: S.round, phase: S.phase }));
    } catch { /* yoksay */ }
  }
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(storageKey()) || "null"); } catch { return null; }
  }

  // ---------- Başlat ----------
  function startGame(mode) {
    S.mode = mode;
    S.seed = mode === "daily" ? todayKey() : `practice-${Date.now()}-${Math.random()}`;
    S.rounds = buildRounds(S.seed);
    S.round = 0; S.scores = []; S.total = 0;
    el.modeLabel.textContent = mode === "daily" ? "Bugün" : "Pratik";
    el.final.classList.add("hidden");
    el.game.classList.remove("hidden");

    if (mode === "daily") {
      const saved = loadProgress();
      if (saved && Array.isArray(saved.scores) && saved.scores.length) {
        S.scores = saved.scores.map((s) => Math.max(0, Math.min(100, Math.round(Number(s) || 0))));
        S.total = S.scores.reduce((a, b) => a + b, 0);
        if (S.scores.length >= S.rounds.length) { showFinal(); return; }
        S.round = S.scores.length; // kaldığı turdan devam
      }
    }
    el.totalScore.textContent = S.total;
    setupRound();
  }

  el.btnHelp.addEventListener("click", () => el.help.classList.remove("hidden"));
  el.btnHelpClose.addEventListener("click", () => {
    el.help.classList.add("hidden");
    try { localStorage.setItem("boyutla:help-seen", "1"); } catch { /* yoksay */ }
  });
  el.help.addEventListener("click", (e) => { if (e.target === el.help) el.btnHelpClose.click(); });
  el.btnPractice.addEventListener("click", () => startGame("practice"));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && S.phase === "play" && !el.game.classList.contains("hidden")) lockIn();
    else if (e.key === "Enter" && S.phase === "result") el.btnNext.click();
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);

  SHAPES.forEach(measureBounds);
  let helpSeen = false;
  try { helpSeen = !!localStorage.getItem("boyutla:help-seen"); } catch { /* yoksay */ }
  if (helpSeen) el.help.classList.add("hidden");
  startGame("daily");
})();
