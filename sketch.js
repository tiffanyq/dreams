let img = null;
let pg = null;
let pgScale = 4;
let hSmooth = 0.1;

const TIME_SCALE = 0.015;
const OVERSCAN = 1.12;
const PIXEL_SCALE_MIN = 3;
const PIXEL_SCALE_MAX = 16;
const BLUR_MIN = 0.05;
const BLUR_MAX = 0.78;
const BLUR_BREATH_MAX = 0.32;
const WARP_STRIPS = 54;

const COLORS = {
  pink: [255, 150, 215],
  purple: [190, 150, 255],
  blue: [150, 200, 255],
  lilac: [245, 205, 255],
  bright: [255, 175, 235],
  cyan: [140, 235, 255],
  magenta: [255, 120, 220],
};

const PALETTE_MONO = [COLORS.bright, COLORS.pink, COLORS.purple, COLORS.blue];
const PALETTE_MULTI = [COLORS.bright, COLORS.pink, COLORS.magenta, COLORS.purple, COLORS.blue, COLORS.cyan, COLORS.lilac];
const BAR_POOL = 220;
const SPECK_POOL = 9000;
let bars = [];
let specks = [];

const LEVEL = {
  legibilityA: { 1: 28, 2: 30, 3: 34, 4: 46, 5: 54 },
  gradAlphaBase: { 4: 80, 5: 105 },
  gradRotSpeed: { 4: 0.40, 5: 0.30 },
  gradDriftX: { 4: 0.22, 5: 0.16 },
  gradDriftY: { 4: 0.18, 5: 0.14 },
  gradLenMul: { 4: 0.45, 5: 0.50 },
  gradBloom: { 4: 26, 5: 34 },
  driftAmt: { 2: 1.2, 3: 1.2, 4: 4.2, 5: 7.0 },
  driftSpeedMul34: 0.5,
  warpStrength: { 4: 1.2, 5: 2.0 },
  warpSpeed: { 4: 0.085, 5: 0.070 },
  lvl5ExtraBlurBase: 0.14,
  lvl5ExtraBlurAmp: 0.42,
  barCount: {
    3: (glitchH) => Math.floor(map(glitchH, 0, 1, 10, 42, true)),
    4: (glitchH) => Math.floor(map(glitchH, 0, 1, 10, 34, true)),
    5: (glitchH) => Math.floor(map(glitchH, 0, 1, 20, 85, true)),
  },
  barDecay: { 3: 0.030, 4: 0.026, 5: 0.032 },
  barFallStep: { 3: 0.12, 4: 0.10, 5: 0.12 },
  barMaxDrop: { 3: 18, 4: 16, 5: 22 },
  shimmerSpeed: { 3: 0.055, 4: 0.055, 5: 0.11 },
  speckCount: {
    2: (strength) => Math.floor(lerp(1800, 5200, strength)),
    3: (strength) => Math.floor(lerp(900, 2600, strength)),
    4: (strength) => Math.floor(lerp(1100, 3000, strength)),
    5: (strength) => Math.floor(lerp(1400, 3600, strength)),
  },
  speckAlphaBase: { 2: 130, 3: 115, 4: 125, 5: 140 },
  speckGate: { 2: 0.14, 3: 0.48, 4: 0.44, 5: 0.40 },
  speckBigChance: { 2: 0.2, 3: 0.3, 4: 0.3, 5: 0.4 },
  speckBrightChance: { 2: 0.15, 3: 0.2, 4: 0.3, 5: 0.4 },
};

window.setDreamImage = function setDreamImage(path) {
  loadImage(
    path,
    (loaded) => {
      img = loaded;
      rebuildPG(pgScale);
    },
    (err) => console.warn("Failed to load image:", path, err)
  );
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  imageMode(CENTER);
  noStroke();
  rebuildPG(pgScale);
  initPools();
  if (!img) window.setDreamImage("img/office.jpg");
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  rebuildPG(pgScale);
  initPools();
}

function draw() {
  clear();
  if (!img) return;
  const level = clampInt(window.hallucinationLevel ?? 3, 1, 5);
  const hTarget = (level - 1) / 4;
  hSmooth = lerp(hSmooth, hTarget, 0.06);
  const h = hSmooth;
  const tr = millis() * 0.001;
  const t = tr * TIME_SCALE;
  if (level === 1) {
    drawCoverImageWithOverscan(img);
    drawGlobalTextLegibilityOverlay(level, h);
    return;
  }
  const desiredScale = Math.round(lerp(PIXEL_SCALE_MIN, PIXEL_SCALE_MAX, h));
  if (desiredScale !== pgScale) {
    pgScale = desiredScale;
    rebuildPG(pgScale);
  }
  renderBaseToPG(t, h, level);
  drawPGToCanvas(t, h, level);
  if (level >= 4) drawDreamGradient(tr, h, level);
  if (level !== 2) drawGlitchBars(t, h, level);
  drawTVStaticSpecks(t, h, level);
  drawGlobalTextLegibilityOverlay(level, h);
}

function rebuildPG(scale) {
  pg = createGraphics(Math.ceil(windowWidth / scale), Math.ceil(windowHeight / scale));
  pg.pixelDensity(1);
  pg.noSmooth();
}

function renderBaseToPG(t, h, level) {
  pg.clear();
  const cover = coverRect(img.width, img.height, pg.width, pg.height);
  pg.push();
  pg.translate(pg.width / 2, pg.height / 2);
  pg.imageMode(CENTER);
  const tintG = lerp(255, 246, h);
  pg.tint(255, tintG, 255, 255);
  pg.image(img, 0, 0, cover.w, cover.h);
  pg.pop();
  const blurBase = lerp(BLUR_MIN, BLUR_MAX, pow(h, 1.12));
  const blurBreath = (0.55 + 0.45 * noise(100 + t * 0.25)) * lerp(0.0, BLUR_BREATH_MAX, pow(h, 1.1));
  let extra = 0;
  if (level === 5) {
    const breathe = 0.5 + 0.5 * noise(4200, t * 0.10);
    extra = LEVEL.lvl5ExtraBlurBase + LEVEL.lvl5ExtraBlurAmp * breathe;
  }

  pg.filter(BLUR, blurBase + blurBreath + extra);
}

function drawPGToCanvas(t, h, level) {
  push();
  noSmooth();
  const cover = coverRect(pg.width, pg.height, width, height);
  const w = cover.w * OVERSCAN;
  const hh = cover.h * OVERSCAN;
  const slow34 = level === 3 || level === 4 ? LEVEL.driftSpeedMul34 : 1.0;
  const driftAmt = LEVEL.driftAmt[level] ?? 1.2;
  const gx = (noise(t * 0.40 * slow34) - 0.5) * driftAmt * h;
  const gy = (noise(999 + t * 0.40 * slow34) - 0.5) * (driftAmt * 0.55) * h;
  const doWarp = level >= 4;
  if (!doWarp) {
    image(pg, width / 2 + gx, height / 2 + gy, w, hh);
    pop();
    return;
  }

  const strips = WARP_STRIPS;
  const stripH = hh / strips;
  const warpStrength = (LEVEL.warpStrength[level] ?? 1.2) * pow(h, 1.02);
  const warpSpeed = (LEVEL.warpSpeed[level] ?? 0.085) * slow34;
  for (let i = 0; i < strips; i++) {
    const y0 = i * stripH;
    const yMid = (i + 0.5) / strips;
    const warp = (noise(2000 + yMid * 3.0, t * warpSpeed) - 0.5) * warpStrength;
    const dx = width / 2 + gx + warp;
    const dy = height / 2 - hh / 2 + y0 + stripH / 2 + gy;
    const sy = yMid * pg.height;
    const sh = pg.height / strips;
    image(pg, dx, dy, w, stripH, 0, sy, pg.width, sh);
  }
  pop();
}

function drawCoverImageWithOverscan(im) {
  push();
  noSmooth();
  const cover = coverRect(im.width, im.height, width, height);
  imageMode(CENTER);
  image(im, width / 2, height / 2, cover.w * OVERSCAN, cover.h * OVERSCAN);
  pop();
}

function drawDreamGradient(tr, h, level) {
  const lvl = clampInt(level, 4, 5);
  const strength = map(h, 0.55, 1.0, 0.0, 1.0, true);
  if (strength <= 0) return;
  const alpha = LEVEL.gradAlphaBase[lvl] * strength;
  const ang = tr * LEVEL.gradRotSpeed[lvl];
  const cx = width * (0.50 + 0.20 * Math.sin(tr * LEVEL.gradDriftX[lvl]));
  const cy = height * (0.50 + 0.20 * Math.cos(tr * LEVEL.gradDriftY[lvl]));
  const L = Math.hypot(width, height) * LEVEL.gradLenMul[lvl];
  const dx = Math.cos(ang) * L;
  const dy = Math.sin(ang) * L;
  const x0 = cx - dx;
  const y0 = cy - dy;
  const x1 = cx + dx;
  const y1 = cy + dy;

  push();
  noStroke();

  blendMode(BLEND);
  const g = drawingContext.createLinearGradient(x0, y0, x1, y1);
  const mid = 0.50 + 0.18 * Math.sin(tr * 0.22);

  g.addColorStop(0.0, `rgba(35, 8, 58, ${alpha / 255})`);
  g.addColorStop(mid, `rgba(140, 28, 130, ${alpha / 255})`);
  g.addColorStop(0.78, `rgba(30, 40, 120, ${alpha / 255})`);
  g.addColorStop(1.0, `rgba(10, 5, 30, ${alpha / 255})`);

  drawingContext.fillStyle = g;
  rect(0, 0, width, height);

  blendMode(SCREEN);
  const bloom = LEVEL.gradBloom[lvl];
  const pulse = 0.65 + 0.35 * Math.sin(tr * 0.35);

  fill(200, 90, 255, bloom * strength * pulse);
  rect(0, 0, width, height);
  fill(110, 140, 255, (bloom - 10) * strength * (0.9 - 0.2 * pulse));
  rect(0, 0, width, height);
  pop();
}

function drawGlobalTextLegibilityOverlay(level, h) {
  push();
  blendMode(MULTIPLY);
  noStroke();
  const base = LEVEL.legibilityA[level] ?? 34;
  const aa = base + 10 * pow(h, 1.1);
  fill(0, aa);
  rect(0, 0, width, height);
  pop();
}

function initPools() {
  bars = [];
  specks = [];
  for (let i = 0; i < BAR_POOL; i++) bars.push(makeBar(i));
  for (let i = 0; i < SPECK_POOL; i++) specks.push(makeSpeck(i));
}

function makeBar(i) {
  const b = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    active: false,
    life: 0,
    decay: 0.10,
    baseY: 0,
    fall: 0,
    seed: (i * 1337 + 17) >>> 0,
    nextSpawn: 0,
  };
  randomizeBarGeometry(b);
  scheduleSpawn(b, 3);
  return b;
}

function randomizeBarGeometry(b) {
  const r = hash01(b.seed + 11);
  let w, h;
  if (r < 0.70) {
    w = lerp(width * 0.18, width * 0.90, hash01(b.seed + 21));
    h = [2, 3, 3, 4][(b.seed + 7) % 4];
  } else if (r < 0.88) {
    w = lerp(width * 0.10, width * 0.50, hash01(b.seed + 31));
    h = lerp(6, 18, hash01(b.seed + 41));
  } else {
    const s = lerp(14, 60, hash01(b.seed + 51));
    w = s * lerp(0.85, 1.15, hash01(b.seed + 61));
    h = s * lerp(0.85, 1.15, hash01(b.seed + 71));
  }
  b.w = snap(w, 2);
  b.h = snap(h, 2);
  b.x = snap((width - b.w) * hash01(b.seed + 81), 2);
  b.y = snap((height - b.h) * hash01(b.seed + 91), 2);
  b.baseY = b.y;
  b.fall = 0;
}

function scheduleSpawn(b, level) {
  const now = millis();
  const slow = level >= 3 ? 2.0 : 1.0;
  let minMs, maxMs;
  if (level === 3) {
    minMs = 260 * slow;
    maxMs = 820 * slow;
  } else if (level === 4) {
    minMs = 300 * slow;
    maxMs = 980 * slow;
  } else if (level === 5) {
    minMs = 220 * slow;
    maxMs = 780 * slow;
  } else {
    minMs = 260;
    maxMs = 860;
  }
  const span = lerp(minMs, maxMs, hash01(b.seed + now * 0.001));
  b.nextSpawn = now + span;
}

function respawnBar(b) {
  b.seed = (b.seed * 1664525 + 1013904223) >>> 0;
  randomizeBarGeometry(b);
  b.active = false;
  b.life = 0;
  b.fall = 0;
  b.baseY = b.y;
}

function makeSpeck(i) {
  return {
    x: snap(width * hash01(i * 19 + 2), 2),
    y: snap(height * hash01(i * 23 + 3), 2),
  };
}

function glitchIntensityForLevel(level, h) {
  if (level <= 1) return 0;
  if (level === 2) return constrain(h * 0.60, 0, 1);
  if (level === 3) return constrain(h * 0.78, 0, 1);
  if (level === 4) return constrain(h * 0.95, 0, 1);
  return constrain(h * 1.10, 0, 1);
}

function drawGlitchBars(t, h, level) {
  const glitchH = glitchIntensityForLevel(level, h);
  if (glitchH <= 0.001) return;
  push();
  blendMode(SCREEN);
  noStroke();
  const lvl = clampInt(level, 3, 5);
  let count = LEVEL.barCount[lvl](glitchH);
  count = Math.min(count, bars.length);
  const decay = LEVEL.barDecay[lvl];
  const alphaBase = map(glitchH, 0, 1, 40, 165, true);
  const fallStep = LEVEL.barFallStep[lvl];
  const maxDrop = LEVEL.barMaxDrop[lvl];
  const now = millis();
  const shimmerSpeed = LEVEL.shimmerSpeed[lvl];

  for (let i = 0; i < count; i++) {
    const b = bars[i];

    if (!b.active && now >= b.nextSpawn) {
      b.active = true;
      b.life = 1.0;
      b.decay = decay;
      b.fall = 0;
      b.baseY = b.y;
      scheduleSpawn(b, lvl);
    }

    if (!b.active) continue;

    b.life -= b.decay;
    if (b.life <= 0.03) {
      respawnBar(b);
      continue;
    }

    b.fall += fallStep;
    if (b.fall > maxDrop) {
      respawnBar(b);
      continue;
    }

    const y = b.baseY + b.fall;
    const fallFade = 1.0 - b.fall / (maxDrop + 2);
    const shimmer = 0.92 + 0.08 * noise(i * 0.1, t * shimmerSpeed);
    const a = alphaBase * shimmer * b.life * fallFade;

    if (lvl < 4) {
      const c = PALETTE_MONO[(i + (b.seed % PALETTE_MONO.length)) % PALETTE_MONO.length];
      fill(c[0], c[1], c[2], a);
      rect(b.x, y, b.w, b.h);
      fill(c[0], c[1], c[2], a * 0.14);
      rect(b.x, y - 1, b.w, b.h + 2);
    } else {
      drawMultiHueFleckBar(b.x, y, b.w, b.h, a, b.seed, t);
    }
  }

  pop();
}

function drawMultiHueFleckBar(x, y, w, h, alpha, seed, t) {
  const segW = 3;
  const segs = Math.max(1, Math.ceil(w / segW));
  const p = PALETTE_MULTI;
  const plen = p.length;
  const s = seed >>> 0;
  const aIdx = Math.floor(hash01(s + 1) * plen) % plen;
  const bIdx = Math.floor(hash01(s + 2) * plen) % plen;
  const cIdx = Math.floor(hash01(s + 3) * plen) % plen;
  const flickT = t * 0.5;

  for (let i = 0; i < segs; i++) {
    const rr = hash01(s + i * 97);
    let col = p[aIdx];
    if (rr > 0.33) col = p[bIdx];
    if (rr > 0.72) col = p[cIdx];
    const f = 0.90 + 0.10 * noise(s * 0.001 + i * 0.11, flickT * 0.25);
    const a = alpha * f;
    fill(col[0], col[1], col[2], a);
    rect(x + i * segW, y, segW + 1, h);
  }
  fill(255, 200, 245, alpha * 0.10);
  rect(x, y - 1, w, h + 2);
}

function drawTVStaticSpecks(t, h, level) {
  if (level < 2) return;
  const glitchH = glitchIntensityForLevel(level, h);
  const strength = map(glitchH, 0, 1, 0.35, 1.0, true);
  const lvl = clampInt(level, 2, 5);
  const count = LEVEL.speckCount[lvl](strength);
  const slow = lvl >= 3 ? 0.5 : 1.0;
  const palette = PALETTE_MULTI;
  const palLen = palette.length;
  const alphaBase = LEVEL.speckAlphaBase[lvl];
  const gate = LEVEL.speckGate[lvl];
  const bigChance = LEVEL.speckBigChance[lvl];
  const brightChance = LEVEL.speckBrightChance[lvl];
  const frameDrift = (frameCount * (lvl === 2 ? 6 : 5 * slow)) | 0;

  push();
  noStroke();
  blendMode(SCREEN);

  for (let i = 0; i < count; i++) {
    const idx = (Math.random() * specks.length) | 0;
    const s = specks[idx];
    if (Math.random() < gate) continue;
    const c = palette[(idx + frameDrift) % palLen];
    if (!c) continue;
    const big = Math.random() < bigChance;
    const bright = Math.random() < brightChance;
    const wob =
      lvl === 2
        ? 0.82 + 0.18 * noise(8000 + idx * 0.01, t * 0.45)
        : 0.88 + 0.12 * noise(8000 + idx * 0.01, (t * slow) * 0.45);
    const a = (bright ? 1.45 : 1.0) * alphaBase * strength * wob;
    fill(c[0], c[1], c[2], a);
    if (big) rect(s.x, s.y, bright ? 3 : 2, bright ? 3 : 2);
    else rect(s.x, s.y, bright ? 2 : 1, bright ? 2 : 1);
  }
  pop();
}

function coverRect(srcW, srcH, dstW, dstH) {
  const srcAspect = srcW / srcH;
  const dstAspect = dstW / dstH;
  let w, h;
  if (srcAspect > dstAspect) {
    h = dstH;
    w = h * srcAspect;
  } else {
    w = dstW;
    h = w / srcAspect;
  }
  return { w, h };
}

function snap(v, step) {
  return Math.floor(v / step) * step;
}

function clampInt(v, lo, hi) {
  v = Math.floor(v);
  return Math.max(lo, Math.min(hi, v));
}

function hash01(n) {
  if (!Number.isFinite(n)) return 0;
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}