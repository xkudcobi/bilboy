/* Bilboy — günlük boyut tahmin oyunu */
(() => {
  "use strict";

  // ---------- Sabitler ----------
  // Tahta boyutu: dar ekranlarda daha kare bir tahta (nesneler daha büyük görünür)
  const NARROW = window.matchMedia("(max-width: 600px)").matches;
  const W = NARROW ? 600 : 840, H = NARROW ? 600 : 510, GROUND = NARROW ? 500 : 430;
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
  const SLIDER_MIN = 0.05, SLIDER_MAX = 200; // hedef/referans oranı aralığı (log)
  const EPOCH = "2026-09-18"; // ilk bulmaca günü (#1)
  const SPEED_SECONDS = 90;     // Hız Turu süresi
  const SPEED_RESULT_MS = 1400; // Hız Turunda sonucun ekranda kalma süresi

  const MODES = {
    gunluk:   { label: "Günlük",   short: "Günlük",   cats: null },
    hayvanlar:{ label: "Hayvanlar", short: "Hayvan",  cats: ["hayvan"] },
    yapilar:  { label: "Yapılar",  short: "Yapı",     cats: ["yapi"] },
    araclar:  { label: "Araçlar",  short: "Araç",     cats: ["arac"] },
    esyalar:  { label: "Eşyalar",  short: "Eşya",     cats: ["esya"] },
  };

  const BADGES = [
    { id: "ilk_oyun",   icon: "🎯", name: "İlk Adım",        desc: "İlk oyununu tamamla" },
    { id: "keskin_goz", icon: "👁️", name: "Keskin Göz",      desc: "Bir turda 100 puan al" },
    { id: "yildiz",     icon: "⭐", name: "Yıldız",          desc: "Bir oyunda 450+ puan al" },
    { id: "tam_isabet", icon: "🏆", name: "Tam İsabet",      desc: "Bir oyunda 500 puan al" },
    { id: "seri3",      icon: "🔥", name: "3 Gün Seri",      desc: "3 gün üst üste günlük oyna" },
    { id: "seri7",      icon: "🔥", name: "7 Gün Seri",      desc: "7 gün üst üste günlük oyna" },
    { id: "seri30",     icon: "💎", name: "30 Gün Seri",     desc: "30 gün üst üste günlük oyna" },
    { id: "dev_avcisi", icon: "🏔️", name: "Dev Avcısı",      desc: "100 m'den büyük bir hedefte 90+ puan" },
    { id: "mikro_goz",  icon: "🔬", name: "Mikro Göz",       desc: "10 cm'den küçük bir hedefte 90+ puan" },
    { id: "gezgin",     icon: "🧭", name: "Gezgin",          desc: "Beş modun hepsinde oyun tamamla" },
    { id: "meydan",     icon: "⚔️", name: "Düellocu",        desc: "Bir meydan okumayı tamamla" },
    { id: "geceyarisi", icon: "🦉", name: "Gece Kuşu",       desc: "Gece 00:00–05:00 arasında oyna" },
  ];

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const canvas = $("board");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const el = {
    modes: $("modes"), banner: $("challenge-banner"),
    roundLabel: $("round-label"), modeLabel: $("mode-label"), totalScore: $("total-score"),
    dots: $("round-dots"),
    refName: $("ref-name"), refSub: $("ref-sub"), targetName: $("target-name"), targetSub: $("target-sub"),
    refScaleLabel: $("ref-scale-label"), targetScaleLabel: $("target-scale-label"),
    ratio: $("ratio"),
    controls: $("controls"), btnLock: $("btn-lock"),
    sizeDown: $("size-down"), sizeUp: $("size-up"), sizeRange: $("size-range"),
    result: $("result"), resGuess: $("res-guess"), resActual: $("res-actual"), resError: $("res-error"),
    resScore: $("res-score"), resFact: $("res-fact"), btnNext: $("btn-next"), devMarker: $("dev-marker"),
    game: $("game"), final: $("final"), finalTitle: $("final-title"), finalPts: $("final-pts"),
    finalMsg: $("final-msg"), finalCompare: $("final-compare"), finalRounds: $("final-rounds"),
    finalBadges: $("final-badges"),
    btnShare: $("btn-share"), btnChallenge: $("btn-challenge"), btnPractice: $("btn-practice"),
    btnReview: $("btn-review"), countdown: $("countdown"), shareNote: $("share-note"),
    zoomIn: $("zoom-in"), zoomOut: $("zoom-out"), zoomFit: $("zoom-fit"), zoomLevel: $("zoom-level"),
    help: $("help"), btnHelp: $("btn-help"), btnHelpClose: $("btn-help-close"),
    stats: $("stats"), btnStats: $("btn-stats"), statGrid: $("stat-grid"), hist: $("hist"), badges: $("badges"),
    archive: $("archive"), btnArchive: $("btn-archive"), archiveTitle: $("archive-title"), archiveList: $("archive-list"),
    confetti: $("confetti"), toast: $("toast"),
    refHint: $("ref-hint"), btnHint: $("btn-hint"), btnShareImg: $("btn-share-img"),
    settings: $("settings"), btnSettings: $("btn-settings"), btnReset: $("btn-reset"),
  };
  const HINT_COST = 15;

  // ---------- Yardımcılar ----------
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  const pad2 = (n) => String(n).padStart(2, "0");
  function dateKey(d = new Date()) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  function parseDate(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function addDays(key, n) {
    const d = parseDate(key); d.setDate(d.getDate() + n); return dateKey(d);
  }
  function puzzleNumber(key) {
    return Math.round((parseDate(key) - parseDate(EPOCH)) / 86400000) + 1;
  }
  function isValidDate(key) {
    return /^\d{4}-\d{2}-\d{2}$/.test(key) && dateKey(parseDate(key)) === key;
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
  function randomSeed() {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let s = "";
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
  const nf = new Intl.NumberFormat("tr-TR", { maximumSignificantDigits: 4 });
  const nf1 = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });
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
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  function store(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* yoksay */ } }
  function load(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  }
  function toast(msg, ms = 2200) {
    el.toast.textContent = msg;
    el.toast.classList.remove("hidden");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.toast.classList.add("hidden"), ms);
  }
  function squares(scores) {
    return scores.map((s) => (s >= 90 ? "🟩" : s >= 60 ? "🟨" : s >= 30 ? "🟧" : "🟥")).join("");
  }

  // ---------- Ayarlar ----------
  const settings = Object.assign({ theme: "", sound: 1, vibe: 1 }, load("bilboy:settings", {}));
  function saveSettings() { store("bilboy:settings", settings); }
  function applyTheme() {
    if (settings.theme) document.documentElement.dataset.theme = settings.theme;
    else delete document.documentElement.dataset.theme;
  }
  applyTheme();

  // ---------- Ses (WebAudio, dosyasız) ----------
  let audio = null;
  function tone(freq, dur = 0.12, type = "sine", gain = 0.08, when = 0) {
    if (!settings.sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      const t0 = audio.currentTime + when;
      const o = audio.createOscillator(), gn = audio.createGain();
      o.type = type; o.frequency.value = freq;
      gn.gain.setValueAtTime(0, t0);
      gn.gain.linearRampToValueAtTime(gain, t0 + 0.01);
      gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(gn); gn.connect(audio.destination);
      o.start(t0); o.stop(t0 + dur + 0.02);
    } catch { /* ses yok */ }
  }
  function sfxScore(score) {
    if (score === 100) { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", 0.07, i * 0.09)); }
    else if (score >= 60) { tone(523, 0.12, "triangle"); tone(784, 0.16, "triangle", 0.07, 0.1); }
    else if (score >= 30) { tone(440, 0.15, "triangle"); }
    else { tone(196, 0.25, "sawtooth", 0.04); }
  }
  function vibrate(pattern) { if (settings.vibe && navigator.vibrate) { try { navigator.vibrate(pattern); } catch { /* yok */ } } }

  // ---------- Bulmaca üretimi ----------
  function buildRounds(seedStr, cats) {
    const rnd = mulberry32(hashString(seedStr));
    const pool = shuffle(SHAPES, rnd);
    const targets = cats ? pool.filter((s) => cats.includes(s.cat)) : pool;
    const rounds = [];
    const used = new Set();
    for (const target of targets) {
      if (rounds.length >= ROUNDS) break;
      if (used.has(target.id)) continue;
      const refs = pool.filter((r) => {
        if (r.id === target.id || used.has(r.id)) return false;
        const ratio = target.realM / r.realM;
        return ratio >= RATIO_MIN && ratio <= RATIO_MAX;
      });
      if (!refs.length) continue;
      const ref = refs[Math.floor(rnd() * refs.length)];
      used.add(target.id); used.add(ref.id);
      rounds.push({ target, ref });
    }
    return rounds;
  }
  // Hız Turu: son birkaç turda kullanılmayan rastgele bir çift üret
  function randomRound(recent) {
    for (let tries = 0; tries < 200; tries++) {
      const target = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      if (recent.includes(target.id)) continue;
      const refs = SHAPES.filter((r) => {
        if (r.id === target.id || recent.includes(r.id)) return false;
        const ratio = target.realM / r.realM;
        return ratio >= RATIO_MIN && ratio <= RATIO_MAX;
      });
      if (!refs.length) continue;
      return { target, ref: refs[Math.floor(Math.random() * refs.length)] };
    }
    return { target: SHAPES[0], ref: SHAPES[1] };
  }

  // ---------- Oyun durumu ----------
  const S = {
    kind: "daily",          // daily | archive | practice | challenge
    mode: "gunluk", date: dateKey(), seed: "", opponent: null,
    rounds: [], round: 0, phase: "play",
    obj: { x: 0, y: GROUND, scale: 1 },
    sceneScale: 1,
    scores: [], total: 0, guesses: [], hints: [],
    drag: null, pointers: new Map(), pinch: null,
    paths: new Map(), anim: null, review: false,
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
  function refKeyPx(ref) { return keyDim(ref) * refFit(ref); }
  function pxPerMeter(ref) { return refKeyPx(ref) / ref.realM; }
  function correctScale(r) { return (r.target.realM * pxPerMeter(r.ref)) / keyDim(r.target); }
  function ratioToRef() {
    const r = cur();
    return (keyDim(r.target) * S.obj.scale) / refKeyPx(r.ref);
  }
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
    if (S.kind === "speed" && S.round >= S.rounds.length) {
      const recent = S.rounds.slice(-4).flatMap((x) => [x.target.id, x.ref.id]);
      S.rounds.push(randomRound(recent));
    }
    const r = cur();
    const rb = refBox(r.ref);
    // hedefi nötr bir boyutla başlat (referansla aynı ana boyut)
    const startScale = refKeyPx(r.ref) / keyDim(r.target);
    S.obj = { x: rb.right + 60, y: GROUND, scale: startScale };
    S.sceneScale = 1;
    S.phase = "play";
    S.anim = null;
    S.drag = null; S.pinch = null; S.pointers.clear();

    el.roundLabel.textContent = S.kind === "speed" ? `Tur ${S.round + 1}` : `Tur ${S.round + 1} / ${S.rounds.length}`;
    el.dots.classList.toggle("hidden", S.kind === "speed");
    el.btnHint.classList.toggle("hidden", S.review || S.kind === "speed");
    el.refName.textContent = r.ref.name; el.refSub.textContent = r.ref.sub || "";
    el.targetName.textContent = r.target.name; el.targetSub.textContent = r.target.sub || "";
    el.refScaleLabel.textContent = r.ref.horiz ? "Uzunluk ölçekli" : "Yükseklik ölçekli";
    el.targetScaleLabel.textContent = r.target.horiz ? "Uzunluğu ayarla" : "Yüksekliği ayarla";
    el.controls.classList.remove("hidden");
    el.result.classList.add("hidden");
    el.btnLock.disabled = false;
    const hinted = !!S.hints[S.round];
    el.btnHint.disabled = hinted;
    el.refHint.classList.toggle("hidden", !hinted);
    if (hinted) el.refHint.textContent = `≈ ${formatMeters(r.ref.realM)}`;
    renderDots();
    updateZoomLabel();
    syncSlider();
    draw();
  }

  function renderDots() {
    el.dots.innerHTML = "";
    for (let i = 0; i < S.rounds.length; i++) {
      const d = document.createElement("span");
      if (i < S.scores.length) {
        d.classList.add("done");
        d.style.setProperty("--p", S.scores[i] / 100);
      } else if (i === S.round) d.classList.add("active");
      el.dots.appendChild(d);
    }
  }
  function updateZoomLabel() {
    el.zoomLevel.textContent = `${Math.round(S.sceneScale * 100)}%`;
  }
  function updateRatio() {
    const q = ratioToRef();
    el.ratio.textContent = `×${q >= 10 ? nf1.format(Math.round(q)) : nf1.format(q)}`;
  }
  function syncSlider() {
    const q = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, ratioToRef()));
    const t = Math.log(q / SLIDER_MIN) / Math.log(SLIDER_MAX / SLIDER_MIN);
    el.sizeRange.value = Math.round(t * 1000);
    updateRatio();
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
    const a = toScreen(box.left, box.top), b = toScreen(box.right, box.bottom);
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.globalAlpha = 0.9;
    ctx.beginPath();
    if (horiz) {
      const y = Math.min(H - 6, b.y + 12);
      ctx.moveTo(a.x, y); ctx.lineTo(b.x, y);
      ctx.moveTo(a.x, y - 5); ctx.lineTo(a.x, y + 5);
      ctx.moveTo(b.x, y - 5); ctx.lineTo(b.x, y + 5);
    } else {
      const x = Math.min(W - 6, b.x + 12);
      ctx.moveTo(x, a.y); ctx.lineTo(x, b.y);
      ctx.moveTo(x - 5, a.y); ctx.lineTo(x + 5, a.y);
      ctx.moveTo(x - 5, b.y); ctx.lineTo(x + 5, b.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function ghostScale(r) {
    const cs = correctScale(r);
    if (!S.anim) return cs;
    const t = Math.min(1, (performance.now() - S.anim.start) / S.anim.dur);
    return S.anim.from + (cs - S.anim.from) * easeOut(t);
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
      fillShape(r.target, S.obj.x, S.obj.y, ghostScale(r), colOk, 0.35, colOk);
      fillShape(r.target, S.obj.x, S.obj.y, S.obj.scale, colTarget, 0.55);
    } else {
      fillShape(r.target, S.obj.x, S.obj.y, S.obj.scale, colTarget);
    }
    ctx.restore();

    // kılavuzlar
    drawGuide(rb, r.ref.horiz, colRef);
    const ob = objBox(r.target, S.obj);
    drawGuide(ob, r.target.horiz, colTarget);

    // etiket
    ctx.save();
    ctx.font = "600 12px system-ui, sans-serif"; ctx.textAlign = "center";
    const rs = toScreen((rb.left + rb.right) / 2, GROUND);
    ctx.fillStyle = colRef; ctx.fillText("Referans", rs.x, Math.min(H - 8, rs.y + (r.ref.horiz ? 34 : 22)));
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

    if (S.anim && performance.now() - S.anim.start < S.anim.dur) requestAnimationFrame(draw);
    else if (S.anim) { S.anim = null; }
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
  const MIN_SCALE = 0.002, MAX_SCALE = 20000;
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
    const old = S.obj.scale;
    newScale = clampScale(newScale);
    const k = newScale / old;
    S.obj.x = wx - (wx - S.obj.x) * k;
    S.obj.y = wy - (wy - S.obj.y) * k;
    S.obj.scale = newScale;
  }
  function setScaleAnchoredBottomLeft(newScale) {
    S.obj.scale = clampScale(newScale);
  }
  function changed() { syncSlider(); draw(); }

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
      changed(); return;
    }
    if (!S.drag) {
      canvas.style.cursor = hitCorner(b.x, b.y) ? "nwse-resize" : hitInside(b.x, b.y) ? "grab" : "default";
      return;
    }
    const t = cur().target;
    const p = toWorld(b.x, b.y);
    if (S.drag.type === "move") {
      S.obj.x = p.x - S.drag.dx; S.obj.y = p.y - S.drag.dy;
      draw();
    } else {
      const d = Math.hypot(p.x - S.drag.anchor.x, p.y - S.drag.anchor.y);
      const ns = clampScale(S.drag.initScale * (d / S.drag.initDist));
      S.obj.scale = ns;
      const w = t.nW * ns, h = t.nH * ns;
      S.obj.x = S.drag.corner.includes("l") ? S.drag.anchor.x - w : S.drag.anchor.x;
      S.obj.y = S.drag.corner.includes("t") ? S.drag.anchor.y : S.drag.anchor.y + h;
      changed();
    }
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
    changed();
  }, { passive: false });

  // kaydırıcı ve ince ayar
  el.sizeRange.addEventListener("input", () => {
    if (S.phase !== "play") return;
    const t = el.sizeRange.value / 1000;
    const q = SLIDER_MIN * Math.pow(SLIDER_MAX / SLIDER_MIN, t);
    const r = cur();
    setScaleAnchoredBottomLeft((q * refKeyPx(r.ref)) / keyDim(r.target));
    updateRatio(); draw();
  });
  function nudge(factor) {
    if (S.phase !== "play") return;
    setScaleAnchoredBottomLeft(S.obj.scale * factor);
    changed();
  }
  el.sizeDown.addEventListener("click", () => nudge(1 / 1.02));
  el.sizeUp.addEventListener("click", () => nudge(1.02));

  // ipucu: referansın gerçek ölçüsünü göster, turdan puan düş
  el.btnHint.addEventListener("click", () => {
    if (S.phase !== "play" || S.hints[S.round]) return;
    S.hints[S.round] = true;
    const r = cur();
    el.refHint.textContent = `≈ ${formatMeters(r.ref.realM)}`;
    el.refHint.classList.remove("hidden");
    el.btnHint.disabled = true;
    tone(660, 0.08, "sine", 0.05);
    toast(`Referans ${formatMeters(r.ref.realM)} · bu turdan ${HINT_COST} puan düşer`);
  });

  // ---------- Tahta zoom ----------
  function setSceneScale(s) {
    S.sceneScale = Math.max(0.005, Math.min(4, s));
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
      const cb = objBox(r.target, { x: S.obj.x, y: S.obj.y, scale: correctScale(r) });
      left = Math.min(left, cb.left); top = Math.min(top, cb.top);
      right = Math.max(right, cb.right); bottom = Math.max(bottom, cb.bottom);
    }
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
    const guessM = (keyDim(r.target) * S.obj.scale) / pxPerMeter(r.ref);
    const err = Math.abs(guessM - r.target.realM) / r.target.realM;
    const score = Math.max(0, scoreFromError(err) - (S.hints[S.round] ? HINT_COST : 0));

    S.phase = "result";
    sfxScore(score);
    vibrate(score === 100 ? [30, 40, 60] : score >= 60 ? 30 : [15, 30, 15]);
    S.anim = { start: performance.now(), dur: 700, from: S.obj.scale };
    S.scores.push(score);
    S.guesses.push(guessM);
    S.total += score;
    showRoundResult(r, guessM, err, score);
    renderDots();
    fitScene();
    if (score === 100) confetti(60);
    if (S.kind !== "practice" && S.kind !== "speed") saveGame();
    checkRoundBadges(r.target, score);
    if (S.kind === "speed") {
      clearTimeout(S.speedNext);
      S.speedNext = setTimeout(() => { if (S.kind === "speed" && S.phase === "result" && !S.speedOver) { S.round++; setupRound(); } }, SPEED_RESULT_MS);
    }
  }

  // ---------- Hız Turu zamanlayıcısı ----------
  function startSpeedTimer() {
    clearInterval(S.speedTimer);
    S.speedEnd = Date.now() + SPEED_SECONDS * 1000;
    S.speedOver = false;
    const tick = () => {
      const left = Math.max(0, S.speedEnd - Date.now());
      const s = Math.ceil(left / 1000);
      el.modeLabel.textContent = `⏱ ${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
      el.modeLabel.classList.toggle("urgent", s <= 10);
      if (left <= 0) {
        clearInterval(S.speedTimer); clearTimeout(S.speedNext);
        S.speedOver = true;
        if (S.phase === "play") { S.rounds.pop(); } // yarım kalan tur sayılmaz
        tone(330, 0.3, "square", 0.04);
        showFinal();
      }
    };
    tick();
    S.speedTimer = setInterval(tick, 250);
  }

  function showRoundResult(r, guessM, err, score) {
    el.totalScore.textContent = S.total;
    el.resGuess.textContent = formatMeters(guessM);
    el.resActual.textContent = formatMeters(r.target.realM);
    el.resError.textContent = err < 0.005 ? "Tam isabet" : `%${Math.round(err * 100)} ${guessM > r.target.realM ? "büyük" : "küçük"}`;
    el.resScore.textContent = score;
    el.resScore.title = S.hints[S.round] ? `İpucu kullanıldı (−${HINT_COST})` : "";
    el.devMarker.style.left = `${Math.min(1, err / 1.6) * 100}%`;
    el.resFact.innerHTML = r.target.fact || "";
    const last = S.round >= S.rounds.length - 1;
    el.btnNext.textContent = S.review ? (last ? "Özete dön" : "Sonraki tur") : (last ? "Sonuçları gör" : "Sonraki tur");
    el.btnNext.classList.toggle("hidden", S.kind === "speed");
    el.controls.classList.add("hidden");
    el.result.classList.remove("hidden");
  }

  el.btnNext.addEventListener("click", () => {
    if (S.kind === "speed") return;
    tone(440, 0.05, "sine", 0.03);
    if (S.round < S.rounds.length - 1) {
      S.round++;
      if (S.review) showReviewRound(); else setupRound();
    } else showFinal();
  });

  // Tamamlanmış bir turu (inceleme modunda) yeniden göster
  function showReviewRound() {
    const r = cur();
    const guessM = S.guesses[S.round];
    setupRound();
    S.phase = "result";
    if (Number.isFinite(guessM)) {
      S.obj.scale = (guessM * pxPerMeter(r.ref)) / keyDim(r.target);
    } else {
      S.obj.scale = correctScale(r);
    }
    const err = Number.isFinite(guessM) ? Math.abs(guessM - r.target.realM) / r.target.realM : 0;
    showRoundResult(r, Number.isFinite(guessM) ? guessM : r.target.realM, err, S.scores[S.round]);
    el.totalScore.textContent = S.total;
    fitScene();
  }

  // ---------- Final ----------
  function message(ratio) {
    if (ratio >= 0.98) return "Kusursuz! Gözün bir cetvel gibi çalışıyor.";
    if (ratio >= 0.9) return "Mükemmel göz! Ölçek senin için sır değil.";
    if (ratio >= 0.7) return "Çok iyi — çoğu insandan daha keskin bir gözün var.";
    if (ratio >= 0.5) return "Fena değil — ölçek göründüğünden zordur.";
    return "Zorlu bir set. Gözünü ölçeğe alıştırmaya devam et.";
  }
  function gameTitle() {
    const m = MODES[S.mode].label;
    if (S.kind === "practice") return "Pratik sonucu";
    if (S.kind === "speed") return `Hız Turu · ${S.scores.length} tur`;
    if (S.kind === "challenge") return `Meydan okuma · ${S.seed}`;
    const n = puzzleNumber(S.date);
    const isToday = S.date === dateKey();
    return `${m} #${n}${isToday ? "" : ` · ${S.date}`}`;
  }
  function showFinal() {
    S.review = false;
    el.game.classList.add("hidden");
    el.final.classList.remove("hidden");
    el.finalTitle.textContent = gameTitle();
    el.finalPts.textContent = S.total;
    el.finalMsg.textContent = S.kind === "speed"
      ? `${SPEED_SECONDS} saniyede ${S.scores.length} tur, ortalama ${S.scores.length ? Math.round(S.total / S.scores.length) : 0} puan.`
      : message(S.total / (100 * S.rounds.length));
    document.querySelector("#final .of").textContent = S.kind === "speed" ? "puan" : `/ ${100 * S.rounds.length}`;
    $("ladder").parentElement.querySelector(".ladder-title").classList.toggle("hidden", S.kind === "speed");
    $("ladder").classList.toggle("hidden", S.kind === "speed");
    el.btnReview.classList.toggle("hidden", S.kind === "speed");
    el.btnChallenge.classList.toggle("hidden", S.kind === "speed");
    el.finalRounds.innerHTML = "";
    S.rounds.forEach((r, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${r.target.name}</span><b>${S.scores[i] ?? 0}</b>`;
      el.finalRounds.appendChild(li);
    });
    el.shareNote.textContent = "";
    renderLadder();
    if (S.opponent !== null) {
      const diff = S.total - S.opponent;
      el.finalCompare.textContent = diff > 0 ? `Rakibini ${diff} puanla geçtin! (${S.opponent})`
        : diff < 0 ? `Rakibin ${-diff} puan önde. (${S.opponent})` : `Berabere! İkiniz de ${S.total} puan.`;
      el.finalCompare.classList.remove("hidden");
    } else el.finalCompare.classList.add("hidden");

    const earned = finishGame();
    if (S.kind === "speed") {
      const st = getStats();
      if (S.total > (st.speedBest || 0)) { st.speedBest = S.total; setStats(st); el.finalCompare.textContent = "🏁 Yeni Hız Turu rekoru!"; el.finalCompare.classList.remove("hidden"); }
      else { el.finalCompare.textContent = `Rekorun: ${st.speedBest || 0}`; el.finalCompare.classList.remove("hidden"); }
    }
    if (earned.length) {
      el.finalBadges.innerHTML = `<span class="k">Yeni rozet</span>` + earned.map((b) =>
        `<span class="badge-chip" title="${b.desc}">${b.icon} ${b.name}</span>`).join("");
      el.finalBadges.classList.remove("hidden");
    } else el.finalBadges.classList.add("hidden");

    if (S.total >= 450 && !S.celebrated) { S.celebrated = true; confetti(160); }
    startCountdown();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Günün tüm nesnelerini gerçek boyuta göre sıralı SVG şerit olarak göster
  function renderLadder() {
    const items = [];
    const seen = new Set();
    for (const r of S.rounds) for (const [shape, role] of [[r.ref, "ref"], [r.target, "target"]]) {
      if (seen.has(shape.id)) continue; seen.add(shape.id);
      items.push({ shape, role });
    }
    items.sort((a, b) => a.shape.realM - b.shape.realM);
    $("ladder").innerHTML = items.map(({ shape, role }) => {
      const vb = `${-(shape.offX || 0)} ${-(shape.offY || 0)} ${shape.nW} ${shape.nH}`;
      return `<div class="ladder-item ${role}" title="${shape.name} ${shape.sub || ""}">
        <svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet"><path d="${shape.path}" fill-rule="${shape.fillRule || "nonzero"}"/></svg>
        <b>${shape.name}</b><small>${formatMeters(shape.realM)}</small></div>`;
    }).join("");
  }

  function startCountdown() {
    clearInterval(startCountdown.t);
    if (S.kind !== "daily") { el.countdown.textContent = ""; return; }
    const tick = () => {
      const now = new Date();
      const next = parseDate(addDays(dateKey(now), 1));
      const ms = next - now;
      const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
      el.countdown.textContent = `Yeni bulmaca: ${pad2(h)}:${pad2(m)}:${pad2(s)}`;
      if (ms < 1000) location.reload();
    };
    tick();
    startCountdown.t = setInterval(tick, 1000);
  }

  function shareLink(withScore) {
    const base = location.href.split(/[?#]/)[0];
    const p = new URLSearchParams();
    if (S.kind === "speed") return base;
    if (S.kind === "practice" || S.kind === "challenge") p.set("c", S.seed);
    else { if (S.mode !== "gunluk") p.set("m", S.mode); p.set("d", S.date); }
    if (withScore) p.set("s", S.total);
    return `${base}?${p.toString()}`;
  }
  async function shareText(text, okMsg) {
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      el.shareNote.textContent = okMsg;
    } catch { el.shareNote.textContent = text; }
  }
  el.btnShare.addEventListener("click", () => {
    const text = `Bilboy ${gameTitle()}\n${squares(S.scores)} ${S.total}/${100 * S.rounds.length}\n${shareLink(false)}`;
    shareText(text, "Sonuç panoya kopyalandı.");
  });
  el.btnChallenge.addEventListener("click", () => {
    const text = `Bilboy'da ${S.total} puan aldım — aynı 5 turda beni geçebilir misin?\n${shareLink(true)}`;
    shareText(text, "Meydan okuma linki panoya kopyalandı.");
  });
  el.btnShareImg.addEventListener("click", shareImage);
  async function shareImage() {
    const c = document.createElement("canvas"); c.width = 1080; c.height = 1080;
    const x = c.getContext("2d");
    const dark = cssVar("--bg") !== "#f4f5f8";
    const bg = dark ? "#0f1117" : "#f4f5f8", card = dark ? "#181b23" : "#ffffff", text = dark ? "#eef0f5" : "#17181c", muted = dark ? "#9aa1ae" : "#6b7280";
    const colRef = cssVar("--ref"), colTarget = cssVar("--target"), colOk = cssVar("--correct"), colWarn = cssVar("--warn");
    x.fillStyle = bg; x.fillRect(0, 0, 1080, 1080);
    x.fillStyle = card; x.beginPath(); x.roundRect(60, 60, 960, 960, 40); x.fill();
    x.fillStyle = colRef; x.beginPath(); x.roundRect(110, 110, 64, 64, 18); x.fill();
    x.fillStyle = colTarget; x.beginPath(); x.roundRect(150, 150, 40, 40, 12); x.fill();
    x.fillStyle = text; x.font = "800 56px system-ui, sans-serif"; x.textBaseline = "middle";
    x.fillText("Bilboy", 214, 142);
    x.fillStyle = muted; x.font = "500 30px system-ui, sans-serif";
    x.fillText(gameTitle(), 110, 230);
    x.fillStyle = text; x.font = "900 200px system-ui, sans-serif"; x.textAlign = "center";
    x.fillText(String(S.total), 540, 400);
    x.fillStyle = muted; x.font = "600 40px system-ui, sans-serif";
    x.fillText(`/ ${100 * S.rounds.length}`, 540, 520);
    x.font = "500 34px system-ui, sans-serif";
    x.fillText(message(S.total / (100 * S.rounds.length)), 540, 590);
    x.textAlign = "left";
    S.rounds.forEach((r, i) => {
      const y = 660 + i * 62, s = S.scores[i] ?? 0;
      const col = s >= 90 ? colOk : s >= 60 ? colWarn : colTarget;
      x.fillStyle = col; x.beginPath(); x.roundRect(120, y - 20, 40, 40, 10); x.fill();
      x.fillStyle = text; x.font = "600 32px system-ui, sans-serif"; x.fillText(r.target.name, 184, y);
      x.textAlign = "right"; x.font = "800 34px system-ui, sans-serif"; x.fillText(String(s), 960, y); x.textAlign = "left";
    });
    x.fillStyle = muted; x.font = "500 26px system-ui, sans-serif"; x.textAlign = "center";
    x.fillText(location.host ? `${location.host}${location.pathname}` : "bilboy", 540, 985);
    const blob = await new Promise((res) => c.toBlob(res, "image/png"));
    const file = new File([blob], `bilboy-${S.total}.png`, { type: "image/png" });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: `Bilboy ${gameTitle()} — ${S.total} puan` }); return; }
    } catch { /* paylaşım iptal */ }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    el.shareNote.textContent = "Görsel kart indirildi.";
  }
  el.btnPractice.addEventListener("click", () => startGame({ kind: "practice" }));
  el.btnReview.addEventListener("click", () => {
    S.review = true; S.round = 0;
    el.final.classList.add("hidden"); el.game.classList.remove("hidden");
    showReviewRound();
  });

  // ---------- Kayıt & istatistik ----------
  function gameKey() { return `bilboy:g:${S.mode}:${S.kind === "challenge" || S.kind === "practice" ? "c-" + S.seed : S.date}`; }
  function saveGame() {
    store(gameKey(), { scores: S.scores, guesses: S.guesses, hints: S.hints, total: S.total, done: S.scores.length >= S.rounds.length });
  }
  function loadGame() { return load(gameKey()); }

  const DEFAULT_STATS = { played: 0, sum: 0, best: 0, streak: 0, maxStreak: 0, lastDaily: null, dist: [0, 0, 0, 0, 0, 0], badges: {}, modes: {}, perfectRounds: 0 };
  function getStats() { return Object.assign({}, DEFAULT_STATS, load("bilboy:stats", {})); }
  function setStats(st) { store("bilboy:stats", st); }

  function award(st, id, list) {
    if (st.badges[id]) return;
    st.badges[id] = dateKey();
    const b = BADGES.find((x) => x.id === id);
    if (b) list.push(b);
  }
  function checkRoundBadges(target, score) {
    if (S.kind === "practice" || S.kind === "speed") return;
    const st = getStats(); const earned = [];
    if (score === 100) { st.perfectRounds++; award(st, "keskin_goz", earned); }
    if (score >= 90 && target.realM >= 100) award(st, "dev_avcisi", earned);
    if (score >= 90 && target.realM <= 0.1) award(st, "mikro_goz", earned);
    const h = new Date().getHours();
    if (h < 5) award(st, "geceyarisi", earned);
    setStats(st);
    earned.forEach((b) => toast(`${b.icon} Rozet: ${b.name}`));
  }
  // Oyun bittiğinde istatistikleri güncelle; yeni rozetleri döndür
  function finishGame() {
    const earned = [];
    if (S.kind === "practice" || S.kind === "speed") return earned;
    const st = getStats();
    const gk = gameKey();
    if (st.counted && st.counted[gk]) return earned;
    st.counted = st.counted || {};
    st.counted[gk] = 1;
    st.played++; st.sum += S.total; st.best = Math.max(st.best, S.total);
    st.dist[Math.min(5, Math.floor(S.total / 100))]++;
    st.modes[S.mode] = (st.modes[S.mode] || 0) + 1;
    award(st, "ilk_oyun", earned);
    if (S.total >= 450) award(st, "yildiz", earned);
    if (S.total === 500) award(st, "tam_isabet", earned);
    if (S.kind === "challenge") award(st, "meydan", earned);
    if (Object.keys(MODES).every((m) => st.modes[m])) award(st, "gezgin", earned);
    if (S.kind === "daily" && S.mode === "gunluk") {
      const today = dateKey();
      if (st.lastDaily !== today) {
        st.streak = st.lastDaily === addDays(today, -1) ? st.streak + 1 : 1;
        st.lastDaily = today;
        st.maxStreak = Math.max(st.maxStreak, st.streak);
      }
      if (st.streak >= 3) award(st, "seri3", earned);
      if (st.streak >= 7) award(st, "seri7", earned);
      if (st.streak >= 30) award(st, "seri30", earned);
    }
    setStats(st);
    return earned;
  }
  function currentStreak(st) {
    const today = dateKey();
    if (st.lastDaily === today || st.lastDaily === addDays(today, -1)) return st.streak;
    return 0;
  }

  function renderStats() {
    const st = getStats();
    const avg = st.played ? Math.round(st.sum / st.played) : 0;
    const items = [
      ["Oyun", st.played], ["Ortalama", avg], ["En iyi", st.best],
      ["Seri", currentStreak(st)], ["En uzun seri", st.maxStreak], ["100'lük tur", st.perfectRounds],
      ["Hız rekoru", st.speedBest || 0],
    ];
    el.statGrid.innerHTML = items.map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join("");
    const max = Math.max(1, ...st.dist);
    const labels = ["0–99", "100–199", "200–299", "300–399", "400–499", "500"];
    el.hist.innerHTML = st.dist.map((n, i) =>
      `<div class="hist-row"><span>${labels[i]}</span><div class="hist-bar" style="width:${Math.max(4, (n / max) * 100)}%">${n}</div></div>`).join("");
    el.badges.innerHTML = BADGES.map((b) => {
      const got = st.badges[b.id];
      return `<div class="badge ${got ? "" : "locked"}" title="${b.desc}${got ? " · " + got : ""}"><span class="badge-icon">${b.icon}</span><b>${b.name}</b><small>${b.desc}</small></div>`;
    }).join("");
  }

  function renderArchive() {
    const today = dateKey();
    el.archiveTitle.textContent = `Arşiv · ${MODES[S.mode].label}`;
    const rows = [];
    for (let i = 0; i < 30; i++) {
      const d = addDays(today, -i);
      if (d < EPOCH) break;
      const g = load(`bilboy:g:${S.mode}:${d}`);
      const p = new URLSearchParams(); if (S.mode !== "gunluk") p.set("m", S.mode); p.set("d", d);
      const href = `?${p.toString()}`;
      const status = g && g.done ? `<b>${g.total}</b><span class="sq">${squares(g.scores)}</span>` : g ? `<span class="muted">devam ediyor</span>` : `<span class="muted">oynanmadı</span>`;
      rows.push(`<a class="archive-row ${g && g.done ? "done" : ""}" href="${href}"><span>#${puzzleNumber(d)} · ${d}${i === 0 ? " (bugün)" : ""}</span>${status}</a>`);
    }
    el.archiveList.innerHTML = rows.join("") || `<p class="note">Henüz arşiv yok.</p>`;
  }

  // ---------- Konfeti ----------
  function confetti(n) {
    const c = el.confetti, x = c.getContext("2d");
    c.width = innerWidth; c.height = innerHeight;
    c.classList.remove("hidden");
    const colors = [cssVar("--ref"), cssVar("--target"), cssVar("--correct"), "#f59e0b", "#a855f7"];
    const ps = Array.from({ length: n }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 4,
      r: 4 + Math.random() * 5, a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 0.3,
      col: colors[Math.floor(Math.random() * colors.length)],
    }));
    const t0 = performance.now();
    (function frame() {
      const t = (performance.now() - t0) / 1000;
      x.clearRect(0, 0, c.width, c.height);
      for (const p of ps) {
        p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.a += p.va;
        x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.col;
        x.globalAlpha = Math.max(0, 1 - t / 2.2);
        x.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6); x.restore();
      }
      if (t < 2.2) requestAnimationFrame(frame); else { x.clearRect(0, 0, c.width, c.height); c.classList.add("hidden"); }
    })();
  }

  // ---------- Başlat ----------
  function renderModes() {
    el.modes.innerHTML = Object.entries(MODES).map(([k, m]) => {
      const p = new URLSearchParams(); if (k !== "gunluk") p.set("m", k);
      const g = load(`bilboy:g:${k}:${dateKey()}`);
      const done = g && g.done;
      return `<a href="${p.toString() ? "?" + p : "./"}" class="mode ${k === S.mode && S.kind !== "practice" && S.kind !== "challenge" ? "active" : ""}" data-mode="${k}">${m.label}${done ? `<span class="mode-done">${g.total}</span>` : ""}</a>`;
    }).join("") + `<button type="button" class="mode mode-btn ${S.kind === "practice" ? "active" : ""}" id="mode-practice">∞ Pratik</button>` +
      `<button type="button" class="mode mode-btn ${S.kind === "speed" ? "active" : ""}" id="mode-speed">⏱ Hız Turu</button>`;
    $("mode-practice").addEventListener("click", () => startGame({ kind: "practice" }));
    $("mode-speed").addEventListener("click", () => startGame({ kind: "speed" }));
  }

  function startGame(opts) {
    S.kind = opts.kind;
    S.mode = opts.mode || "gunluk";
    S.date = opts.date || dateKey();
    S.opponent = Number.isFinite(opts.opponent) ? opts.opponent : null;
    S.review = false;
    clearInterval(S.speedTimer); clearTimeout(S.speedNext);
    if (S.kind === "practice" || S.kind === "speed") S.seed = randomSeed();
    else if (S.kind === "challenge") S.seed = opts.seed;
    const seedStr = S.kind === "practice" || S.kind === "challenge" ? `c:${S.seed}` : `${S.mode}:${S.date}`;
    S.rounds = S.kind === "speed" ? [] : buildRounds(seedStr, MODES[S.mode].cats);
    S.round = 0; S.scores = []; S.guesses = []; S.hints = []; S.total = 0; S.celebrated = false;
    el.modeLabel.classList.remove("urgent");
    el.modeLabel.textContent = S.kind === "practice" ? "Pratik" : S.kind === "speed" ? "Hız Turu" : S.kind === "challenge" ? "Meydan okuma"
      : S.date === dateKey() ? `Bugün · #${puzzleNumber(S.date)}` : `Arşiv · ${S.date}`;
    el.final.classList.add("hidden");
    el.game.classList.remove("hidden");
    renderModes();

    if (S.opponent !== null) {
      el.banner.innerHTML = `⚔️ <b>Meydan okuma!</b> Rakibin bu turlarda <b>${S.opponent}</b> puan aldı. Geçebilir misin?`;
      el.banner.classList.remove("hidden");
    } else el.banner.classList.add("hidden");

    if (S.kind !== "practice" && S.kind !== "speed") {
      const saved = loadGame();
      if (saved && Array.isArray(saved.scores) && saved.scores.length) {
        S.scores = saved.scores.map((s) => Math.max(0, Math.min(100, Math.round(Number(s) || 0))));
        S.guesses = Array.isArray(saved.guesses) ? saved.guesses : [];
        S.hints = Array.isArray(saved.hints) ? saved.hints : [];
        S.total = S.scores.reduce((a, b) => a + b, 0);
        if (S.scores.length >= S.rounds.length) { showFinal(); return; }
        S.round = S.scores.length; // kaldığı turdan devam
      }
    }
    el.totalScore.textContent = S.total;
    setupRound();
    if (S.kind === "speed") { toast(`⏱ ${SPEED_SECONDS} saniye — olabildiğince çok tur!`); startSpeedTimer(); }
  }

  function openModal(m) { m.classList.remove("hidden"); }
  function closeModal(m) { m.classList.add("hidden"); }
  el.btnHelp.addEventListener("click", () => openModal(el.help));
  el.btnHelpClose.addEventListener("click", () => { closeModal(el.help); store("bilboy:help-seen", 1); });
  el.btnStats.addEventListener("click", () => { renderStats(); openModal(el.stats); });
  function renderSettings() {
    document.querySelectorAll("#theme-seg button").forEach((b) => b.classList.toggle("on", b.dataset.theme === settings.theme));
    document.querySelectorAll("#sound-seg button").forEach((b) => b.classList.toggle("on", Number(b.dataset.sound) === settings.sound));
    document.querySelectorAll("#vibe-seg button").forEach((b) => b.classList.toggle("on", Number(b.dataset.vibe) === settings.vibe));
  }
  el.btnSettings.addEventListener("click", () => { renderSettings(); openModal(el.settings); });
  el.settings.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-theme],button[data-sound],button[data-vibe]");
    if (!b) return;
    if (b.dataset.theme !== undefined) { settings.theme = b.dataset.theme; applyTheme(); draw(); }
    if (b.dataset.sound !== undefined) { settings.sound = Number(b.dataset.sound); if (settings.sound) tone(660, 0.1); }
    if (b.dataset.vibe !== undefined) { settings.vibe = Number(b.dataset.vibe); vibrate(20); }
    saveSettings(); renderSettings();
  });
  el.btnReset.addEventListener("click", () => {
    if (!confirm("Tüm istatistikler, rozetler ve kayıtlı oyunlar silinecek. Emin misin?")) return;
    try { Object.keys(localStorage).filter((k) => k.startsWith("bilboy:")).forEach((k) => localStorage.removeItem(k)); } catch { /* yoksay */ }
    location.reload();
  });
  el.btnArchive.addEventListener("click", () => { renderArchive(); openModal(el.archive); });
  document.querySelectorAll(".modal").forEach((m) => m.addEventListener("click", (e) => {
    if (e.target === m || e.target.closest(".modal-close")) {
      if (m === el.help) el.btnHelpClose.click(); else closeModal(m);
    }
  }));

  window.addEventListener("keydown", (e) => {
    const openModalEl = document.querySelector(".modal:not(.hidden)");
    if (openModalEl) {
      if (e.key === "Escape" || e.key === "Enter") { if (openModalEl === el.help) el.btnHelpClose.click(); else closeModal(openModalEl); }
      return;
    }
    if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON" && e.key !== "Enter") return;
    const inGame = !el.game.classList.contains("hidden");
    const playing = S.phase === "play" && inGame;
    if (e.key === "Enter") {
      if (playing) lockIn(); else if (S.phase === "result" && inGame) el.btnNext.click();
    } else if (playing) {
      const big = e.shiftKey ? 1.10 : 1.02;
      if (e.key === "ArrowUp") { e.preventDefault(); nudge(big); }
      else if (e.key === "ArrowDown") { e.preventDefault(); nudge(1 / big); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); S.obj.x -= (e.shiftKey ? 40 : 10) / S.sceneScale; draw(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); S.obj.x += (e.shiftKey ? 40 : 10) / S.sceneScale; draw(); }
      else if (e.key === "+" || e.key === "=") setSceneScale(S.sceneScale * 1.25);
      else if (e.key === "-") setSceneScale(S.sceneScale / 1.25);
      else if (e.key.toLowerCase() === "f") fitScene();
    }
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);

  // URL parametreleri
  const params = new URLSearchParams(location.search);
  const qMode = params.get("m");
  const qDate = params.get("d");
  const qSeed = params.get("c");
  const qScore = params.get("s");
  const opponent = qScore !== null && Number.isFinite(Number(qScore)) ? Math.max(0, Math.min(500, Math.round(Number(qScore)))) : undefined;

  SHAPES.forEach(measureBounds);
  if (!load("bilboy:help-seen")) openModal(el.help);

  if (qSeed && /^[a-z0-9]{4,12}$/.test(qSeed)) {
    startGame({ kind: "challenge", seed: qSeed, opponent });
  } else {
    const mode = qMode && MODES[qMode] ? qMode : "gunluk";
    const today = dateKey();
    if (qDate && isValidDate(qDate) && qDate < today && qDate >= EPOCH) startGame({ kind: "archive", mode, date: qDate, opponent });
    else startGame({ kind: "daily", mode, date: today, opponent });
  }

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
