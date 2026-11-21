/* 星河彈幕
   直向彈幕射擊。想調難度，改下面的 DIFFS、敵機血量與 BOSS_DEFS。
   簡單已經偏密，困難是高速、高密度、高耐久。 */
(() => {
  'use strict';

  const W = 360;
  const H = 640;
  const HIT_R = 2.8;
  const GRAZE_R = 15;
  const MAX_EB = 740;
  const SCORE_KEY = 'xinghe-danmaku-scores';

  const PAL = {
    c: '#5ce1ff',
    k: '#12324a',
    m: '#ff4fd8',
    w: '#f4f0ff',
    r: '#ff3355',
    y: '#ffe14a',
    g: '#3dff9a',
    p: '#b388ff',
    o: '#ff7a3c',
  };

  const SPRITE_SRC = {
    player: [
      '......c......',
      '.....ccc.....',
      '....ccccc....',
      '...cckckcc...',
      '..ccckkkccc..',
      '.mcccccccccm.',
      'mmcccccccccmm',
      'mccccw.wccccm',
      '.ccccc.ccccc.',
      '..ccc...ccc..',
      '..oo.....oo..',
    ],
    scout: [
      '..r..',
      '.rrr.',
      'rryrr',
      '.rrr.',
      '..r..',
      '.r.r.',
    ],
    waver: [
      '.g.g.',
      'ggggg',
      '.gwg.',
      'gg.gg',
      '.g.g.',
    ],
    turret: [
      '.ppp.',
      'ppppp',
      'ppwpp',
      'ppppp',
      '.p.p.',
    ],
    sniper: [
      '..y..',
      '..y..',
      '.yyy.',
      'yy.yy',
      '.y.y.',
    ],
    danmaku: [
      '..o..',
      '.ooo.',
      'oowoo',
      '.ooo.',
      '..o..',
    ],
    elite: [
      'rr...rr',
      'rrrrrrr',
      'rwwwwwr',
      'rrrrrrr',
      '.rr.rr.',
      'r.....r',
    ],
    drone: [
      '.c.',
      'cmc',
      '.c.',
    ],
  };

  const ENEMY_STATS = {
    scout: { r: 11, hitR: 9, hp: 16, score: 100, xp: 6, maxAge: 12 },
    waver: { r: 12, hitR: 10, hp: 20, score: 140, xp: 7, maxAge: 14 },
    turret: { r: 14, hitR: 12, hp: 46, score: 260, xp: 10, maxAge: 16 },
    sniper: { r: 12, hitR: 10, hp: 36, score: 280, xp: 10, maxAge: 14 },
    danmaku: { r: 15, hitR: 12, hp: 78, score: 420, xp: 14, maxAge: 13 },
    elite: { r: 18, hitR: 15, hp: 150, score: 900, xp: 24, maxAge: 16 },
  };

  const BOSS_DEFS = {
    comet: { name: '赤彗哨戒艦', hp: 5600, score: 12000, xp: 90, hitR: 34 },
    eclipse: { name: '月蝕母艦', hp: 9200, score: 20000, xp: 120, hitR: 38 },
    void: { name: '虛空核心', hp: 14000, score: 32000, xp: 160, hitR: 32 },
  };

  const STAGES = [
    {
      name: '第 1 戰區', sub: '外環塵域', clear: '赤彗已擊破', duration: 32, interval: 1.02, boss: 'comet',
      pool: [{ type: 'scout', w: 5 }, { type: 'waver', w: 3 }, { type: 'turret', w: 1.4 }],
    },
    {
      name: '第 2 戰區', sub: '月蝕星環', clear: '母艦已擊破', duration: 34, interval: 0.84, boss: 'eclipse',
      pool: [
        { type: 'scout', w: 2 }, { type: 'waver', w: 3 }, { type: 'turret', w: 2 },
        { type: 'sniper', w: 2.4 }, { type: 'danmaku', w: 1.6 },
      ],
    },
    {
      name: '第 3 戰區', sub: '虛空深境', clear: '核心已沉默', duration: 36, interval: 0.7, boss: 'void',
      pool: [
        { type: 'waver', w: 2 }, { type: 'sniper', w: 2 }, { type: 'turret', w: 1.5 },
        { type: 'danmaku', w: 3 }, { type: 'elite', w: 2.2 },
      ],
    },
  ];

  /* 全體偏難。bulletSpeed 乘彈速，density 乘彈數，hp 乘耐久，spawn 乘出現間隔（越小越密）。 */
  const DIFFS = {
    easy: {
      id: 'easy', name: '簡單',
      blurb: '彈幕稍疏，但還是得專心走位。適合先熟悉判定點與武器。',
      bulletSpeed: 0.9, density: 0.74, hp: 0.82, spawn: 1.2, scoreMul: 1,
    },
    normal: {
      id: 'normal', name: '中等',
      blurb: '標準彈幕密度。容錯很小，停下來就容易被擊中。',
      bulletSpeed: 1.06, density: 1.08, hp: 1, spawn: 0.94, scoreMul: 1.15,
    },
    hard: {
      id: 'hard', name: '困難',
      blurb: '極密、高速、敵機更耐打。幾乎不留失誤空間。',
      bulletSpeed: 1.26, density: 1.58, hp: 1.4, spawn: 0.66, scoreMul: 1.35,
    },
  };

  const SPREAD_IV = [0.17, 0.15, 0.14, 0.125, 0.11];
  const SPREAD_N = [3, 3, 4, 5, 5];
  const SPREAD_ARC = [0.3, 0.42, 0.52, 0.64, 0.56];
  const SPREAD_DMG = [3.6, 4.4, 5, 5.6, 6.8];
  const SPREAD_SPD = [480, 500, 520, 540, 580];
  const LASER_DPS = [34, 50, 68, 90, 118];
  const LASER_HALF = [4, 6, 8, 11, 14];
  const MISSILE_IV = [0.72, 0.64, 0.56, 0.5, 0.42];
  const WAVE_IV = [0.88, 0.8, 0.72, 0.64, 0.55];

  const WEAPON_INFO = {
    spread: {
      name: '擴散彈',
      unlock: '向前方射出三發扇形彈。',
      up: ['扇形變寬，每發傷害提高。', '改為四發，清掃正面的敵機。', '五發扇形，彈幕更密。', '五發高速彈，命中後可再貫穿 1 架敵機。'],
    },
    laser: {
      name: '貫穿雷射',
      unlock: '射出貫穿所有敵機的雷射，要站在敵機正下方。',
      up: ['雷射變粗，每秒傷害提高。', '寬度與傷害再提升。', '高輸出光束，適合壓制直線。', '最粗的貫穿雷射，持續灼燒整條航道。'],
    },
    missile: {
      name: '追蹤飛彈',
      unlock: '發射會轉彎追向敵機的飛彈。',
      up: ['一次兩發，較容易打中走位的敵人。', '轉彎更快，不容易被甩開。', '一次三發。', '三發高速飛彈，命中時造成小範圍爆炸。'],
    },
    wave: {
      name: '穿透波動',
      unlock: '發射緩慢、寬大、可貫穿的能量波。',
      up: ['波動範圍變大。', '一次兩道波動。', '兩道更大的波動，適合清雜兵。', '三道高傷害波動。'],
    },
  };

  const audio = window.XingheAudio;
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const frame = document.getElementById('frame');
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const ui = document.getElementById('ui');
  const hud = document.getElementById('hud');
  const announceEl = document.getElementById('announce');
  const scoreEl = document.getElementById('hud-score');
  const bestEl = document.getElementById('hud-best');
  const livesEl = document.getElementById('hud-lives');
  const shieldEl = document.getElementById('hud-shield');
  const diffEl = document.getElementById('hud-diff');
  const levelEl = document.getElementById('hud-level');
  const comboEl = document.getElementById('hud-combo');
  const xpBar = document.getElementById('xpbar');
  const weaponBar = document.getElementById('weaponbar');
  const bossBar = document.getElementById('bossbar');
  const bossFill = document.getElementById('bossfill');
  const bossNameEl = document.getElementById('bossname');
  const muteBtn = document.getElementById('btn-mute');
  const pauseBtn = document.getElementById('btn-pause');
  const focusBtn = document.getElementById('btn-focus');

  let scaleX = 1;
  let scaleY = 1;
  let state = 'title';
  let clock = 0;
  let shake = 0;
  let flash = 0;
  let announceT = 0;
  let countdownT = 0;
  let countdownLabel = '';
  let dyingT = 0;
  let diff = null;
  let bestAtStart = 0;
  let hiscores = { easy: 0, normal: 0, hard: 0 };
  let score = 0;
  let level = 1;
  let xp = 0;
  let xpNeed = 16;
  let pendingLevel = 0;
  let lives = 3;
  let combo = 0;
  let comboT = 0;
  let player = null;
  let boss = null;
  let bossDefeatT = 0;
  let director = null;
  let currentChoices = [];
  let hudDirty = true;
  let recordDirty = false;
  let recordSaveT = 2;
  let focusState = false;
  let focusHeld = false;
  let resumeState = 'play';
  let inputMode = 'key';
  let mouseInside = false;
  let mousePos = { x: W / 2, y: H / 2 };
  let touch = null;
  let nextId = 1;
  let crashed = false;

  let stars = [];
  let nebulas = [];
  let enemies = [];
  let eBullets = [];
  let pBullets = [];
  let missiles = [];
  let waves = [];
  let gems = [];
  let particles = [];
  let floaters = [];
  let attractBullets = [];
  let attractT = 0;
  let attractAng = 0;
  const keys = Object.create(null);
  const sprites = { normal: {}, white: {} };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function xpToNext(lv) { return Math.round(16 * Math.pow(1.26, lv - 1)); }
  function fmt(n) {
    n = Math.floor(n || 0);
    if (n > 999999) return String(n);
    return String(n).padStart(6, '0');
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function muteLabel() { return audio.muted ? '音效：關' : '音效：開'; }
  function bSpeed(s) { return s * (diff ? diff.bulletSpeed : 1); }
  function scaledCount(n) { return Math.max(1, Math.round(n * (diff ? diff.density : 1))); }
  function iv(base) {
    if (!diff) return base;
    if (diff.id === 'hard') return base * 0.8;
    if (diff.id === 'easy') return base * 1.18;
    return base;
  }

  function loadScores() {
    try {
      const raw = localStorage.getItem(SCORE_KEY);
      const o = raw ? JSON.parse(raw) : {};
      hiscores = { easy: o.easy | 0, normal: o.normal | 0, hard: o.hard | 0 };
    } catch (err) {
      hiscores = { easy: 0, normal: 0, hard: 0 };
    }
  }

  function persistScores() {
    try { localStorage.setItem(SCORE_KEY, JSON.stringify(hiscores)); } catch (err) { /* 忽略 */ }
  }

  function bake(rows, scale, override) {
    const h = rows.length;
    const w = rows[0].length;
    const c = document.createElement('canvas');
    c.width = w * scale;
    c.height = h * scale;
    const g = c.getContext('2d');
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = rows[y][x];
        if (!ch || ch === '.') continue;
        g.fillStyle = override || PAL[ch] || '#fff';
        g.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    return c;
  }

  function bakeAll() {
    Object.keys(SPRITE_SRC).forEach((name) => {
      sprites.normal[name] = bake(SPRITE_SRC[name], 2, null);
      sprites.white[name] = bake(SPRITE_SRC[name], 2, '#ffffff');
    });
  }

  function makeStars() {
    stars = [];
    for (let i = 0; i < 86; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: 0.25 + Math.random() * 0.75,
        s: Math.random() < 0.14 ? 2 : 1,
        c: Math.random() < 0.1 ? '#ff4fd8' : Math.random() < 0.12 ? '#5ce1ff' : '#f4f0ff',
      });
    }
    nebulas = [
      { x: 70, y: 180, rx: 100, ry: 38, c: '#3a1468' },
      { x: 270, y: 420, rx: 120, ry: 42, c: '#12304a' },
      { x: 150, y: 40, rx: 80, ry: 26, c: '#4a1848' },
    ];
  }

  function clearActors() {
    enemies = [];
    eBullets = [];
    pBullets = [];
    missiles = [];
    waves = [];
    gems = [];
    particles = [];
    floaters = [];
    boss = null;
  }

  function makePlayer() {
    return {
      x: W / 2,
      y: H - 96,
      time: 0,
      alive: true,
      invuln: 1.6,
      respawnT: 0,
      shield: 0,
      speedMul: 1,
      dmgMul: 1,
      rateMul: 1,
      magnet: 120,
      drones: 0,
      droneDmg: 1,
      weapons: { spread: 1, laser: 0, missile: 0, wave: 0 },
      cd: { spread: 0.1, laser: 0, missile: 0.3, wave: 0.4, drone: 0.2 },
      ranks: { dmg: 0, rate: 0, speed: 0, drone: 0, magnet: 0 },
    };
  }

  function addShake(n) {
    if (reduceMotion) return;
    if (n > shake) shake = n;
  }

  function spark(x, y, color, n, speed, life) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 200) particles.shift();
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random());
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: life * (0.55 + Math.random()),
        max: life,
        color: color,
        sz: 2 + (Math.random() < 0.3 ? 2 : 0),
      });
    }
  }

  function floater(x, y, text, color) {
    if (floaters.length > 14) floaters.shift();
    floaters.push({ x: x, y: y, text: text, color: color || '#ffe14a', life: 0.7, max: 0.7 });
  }

  function addScore(base, withCombo) {
    let mul = diff ? diff.scoreMul : 1;
    if (withCombo) {
      combo += 1;
      comboT = 2.15;
      mul *= 1 + Math.min(combo - 1, 24) * 0.08;
    }
    score += Math.round(base * mul);
    if (diff && score > (hiscores[diff.id] || 0)) {
      hiscores[diff.id] = score;
      recordDirty = true;
    }
  }

  function shootDir(x, y, ang, speed, color, r, extra) {
    if (eBullets.length >= MAX_EB) return;
    extra = extra || {};
    eBullets.push({
      x: x, y: y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      r: r || 3.2,
      color: color,
      life: extra.life != null ? extra.life : 5.2,
      spin: extra.spin || 0,
      accel: extra.accel || 0,
      grazed: false,
    });
  }

  function ring(x, y, count, speed, rot, color, r, extra) {
    extra = extra || {};
    for (let i = 0; i < count; i++) {
      const a = rot + (i / count) * Math.PI * 2;
      if (extra.gapCenter != null && extra.gapWidth) {
        const d = Math.atan2(Math.sin(a - extra.gapCenter), Math.cos(a - extra.gapCenter));
        if (Math.abs(d) < extra.gapWidth) continue;
      }
      shootDir(x, y, a, speed, color, r, extra);
    }
  }

function aimedFan(x, y, n, spread, speed, color, r, extra) {
  if (!player) return;
  const base = Math.atan2(player.y - y, player.x - x);
  n = Math.max(1, n | 0);
  if (n <= 1) {
      shootDir(x, y, base, speed, color, r, extra);
      return;
    }
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * spread;
      shootDir(x, y, a, speed, color, r, extra);
    }
  }

  function every(store, key, interval, dt, fn) {
    if (store[key] == null) store[key] = interval;
    store[key] -= dt;
    if (store[key] <= 0) {
      store[key] += interval;
      if (store[key] <= 0) store[key] = interval;
      fn();
    }
  }

  function gapAtPlayer(x, y, width, chance) {
    if (Math.random() > chance || !player) return {};
    return {
      gapCenter: Math.atan2(player.y - y, player.x - x),
      gapWidth: width,
    };
  }

  function spawnEnemy(type, x, y) {
    const cap = diff && diff.id === 'hard' ? 20 : 14;
    if (enemies.length >= cap) return null;
    const st = ENEMY_STATS[type];
    const e = {
      id: nextId++,
      type: type,
      x: x,
      y: y,
      originX: x,
      r: st.r,
      hitR: st.hitR,
      hp: st.hp * diff.hp,
      maxHp: st.hp * diff.hp,
      score: st.score,
      xp: st.xp,
      maxAge: st.maxAge,
      t: 0,
      age: 0,
      shootT: 0.4 + Math.random() * 0.45,
      ringT: 1.1,
      angle: Math.random() * Math.PI * 2,
      state: 'enter',
      tx: x,
      ty: type === 'turret' ? 62 + Math.random() * 84
        : type === 'danmaku' ? 84 + Math.random() * 70
          : type === 'elite' ? 76 + Math.random() * 24
            : 48,
      volleys: 0,
      aimT: 0,
      flash: 0,
      dead: false,
      isBoss: false,
    };
    enemies.push(e);
    return e;
  }

  function spawnFromPool(stage) {
    const teach = diff.id === 'hard' ? 5 : diff.id === 'easy' ? 12 : 8;
    let pool = stage.pool;
    if (director.stage === 0 && director.time < teach) pool = [{ type: 'scout', w: 1 }];
    else if (director.stage === 0 && director.time < teach + 8) {
      pool = [{ type: 'scout', w: 3 }, { type: 'waver', w: 2 }, { type: 'turret', w: 1 }];
    }
    let total = 0;
    for (let i = 0; i < pool.length; i++) total += pool[i].w;
    let r = Math.random() * total;
    let type = pool[0].type;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].w;
      if (r <= 0) { type = pool[i].type; break; }
    }
    spawnEnemy(type, rand(40, W - 40), -16);
  }

  function spawnFormation() {
    const type = director.stage === 0 ? 'scout' : 'waver';
    const cx = rand(90, W - 90);
    for (let i = -2; i <= 2; i++) spawnEnemy(type, cx + i * 28, -12 - Math.abs(i) * 16);
  }

function updateEnemy(e, dt) {
  if (e.state === 'leave') {
    if (e.type === 'sniper') {
      e.y -= 150 * dt;
      if (e.y < -40) e.dead = true;
    } else {
      e.y += 190 * dt;
      if (e.y > H + 30) e.dead = true;
    }
    return;
  }
    switch (e.type) {
      case 'scout':
        e.y += (102 + (e.id % 3) * 14) * dt * (diff.id === 'hard' ? 1.1 : 1);
        e.x = clamp(e.x + Math.sin(e.t * 2.6 + e.id) * 30 * dt, 16, W - 16);
        if (e.y > H + 24) e.dead = true;
        e.shootT -= dt;
        if (e.shootT <= 0 && e.y > 8 && e.y < H - 80) {
          e.shootT = iv(diff.id === 'hard' ? 0.95 : 1.32);
          const n = diff.id === 'hard' ? 2 : 1;
          aimedFan(e.x, e.y + 6, n, 0.18, bSpeed(170), '#ff4fd8', 3.3);
        }
        break;
      case 'waver':
        e.y += 78 * dt;
        e.x = clamp(e.originX + Math.sin(e.t * 2.3) * 58, 16, W - 16);
        if (e.y > H + 24) e.dead = true;
        e.shootT -= dt;
        if (e.shootT <= 0 && e.y > 16 && e.y < H - 40) {
          e.shootT = iv(1.42);
          const n = diff.id === 'easy' ? 3 : scaledCount(3);
          const arc = 0.72;
          for (let i = 0; i < n; i++) {
            const a = Math.PI / 2 + (i - (n - 1) / 2) * (arc / Math.max(1, n - 1));
            shootDir(e.x, e.y + 6, a, bSpeed(148), '#3dff9a', 3.2);
          }
        }
        break;
      case 'turret':
        if (e.state === 'enter') {
          e.y += 60 * dt;
          if (e.y >= e.ty) { e.y = e.ty; e.state = 'hold'; e.shootT = 0.35; }
        } else if (e.state === 'hold') {
          e.shootT -= dt;
          if (e.shootT <= 0) {
            e.shootT = iv(diff.id === 'hard' ? 0.9 : 1.32);
            ring(e.x, e.y, scaledCount(diff.id === 'easy' ? 10 : 12), bSpeed(110), e.angle, '#b388ff', 3.3);
            e.angle += 0.31;
            e.volleys += 1;
            if (e.volleys >= (diff.id === 'easy' ? 2 : 3)) e.state = 'leave';
          }
        }
        break;
      case 'sniper':
        if (e.state === 'enter') {
          e.tx = rand(36, W - 36);
          e.ty = rand(46, 160);
          e.state = 'move';
        }
        if (e.state === 'move') {
          e.x += (e.tx - e.x) * Math.min(1, dt * 3.1);
          e.y += (e.ty - e.y) * Math.min(1, dt * 3.1);
          if (Math.hypot(e.tx - e.x, e.ty - e.y) < 5) {
            e.state = 'aim';
            e.aimT = 0;
            e.shootT = 0;
          }
        } else if (e.state === 'aim') {
          e.aimT += dt;
          if (e.aimT > 0.4) {
            e.shootT -= dt;
            if (e.shootT <= 0) {
              e.shootT = diff.id === 'hard' ? 0.08 : 0.12;
              aimedFan(e.x, e.y, 1, 0, bSpeed(diff.id === 'hard' ? 330 : 275), '#ffe14a', 2.8);
            }
          }
          if (e.aimT > (diff.id === 'hard' ? 1.2 : 1.02)) {
            e.volleys += 1;
            if (e.volleys >= 2) e.state = 'leave';
            else {
              e.state = 'move';
              e.tx = rand(36, W - 36);
              e.ty = rand(44, 150);
            }
          }
        }
        if (e.age > e.maxAge) e.state = 'leave';
        break;
      case 'danmaku':
        if (e.y < e.ty) e.y += 70 * dt;
        else e.y += Math.sin(e.t * 1.5) * 16 * dt;
        e.x = clamp(e.originX + Math.sin(e.t * 0.9) * 78, 24, W - 24);
        e.angle += dt * (1.45 + diff.density * 0.4);
        e.shootT -= dt;
        if (e.shootT <= 0 && e.y > 24) {
          e.shootT = iv(0.15);
          const sp = bSpeed(126);
          shootDir(e.x, e.y, e.angle, sp, '#ff7a3c', 3.2);
          shootDir(e.x, e.y, e.angle + Math.PI, sp, '#ff7a3c', 3.2);
          if (diff.id !== 'easy') shootDir(e.x, e.y, -e.angle, sp * 0.85, '#ff4fd8', 3);
        }
        if (e.age > e.maxAge) e.state = 'leave';
        break;
      case 'elite':
        if (e.y < e.ty) e.y += 48 * dt;
        e.x = clamp(W / 2 + Math.sin(e.t * 0.62) * 120, 28, W - 28);
        e.shootT -= dt;
        if (e.shootT <= 0 && e.y > 36) {
          e.shootT = iv(0.95);
          aimedFan(e.x, e.y + 8, scaledCount(diff.id === 'easy' ? 3 : 4), 0.13, bSpeed(188), '#ff3355', 3.4);
        }
        e.ringT -= dt;
        if (e.ringT <= 0 && e.y > 36) {
          e.ringT = iv(1.65);
          const extra = gapAtPlayer(e.x, e.y, diff.id === 'hard' ? 0.32 : 0.48, diff.id === 'easy' ? 1 : 0.75);
          ring(e.x, e.y, scaledCount(16), bSpeed(102), e.angle, '#ffe14a', 3.3, extra);
          e.angle += 0.42;
        }
        if (e.age > e.maxAge) e.state = 'leave';
        break;
      default:
        break;
    }
}

  function updateEnemies(dt) {
    const n = enemies.length;
    for (let i = 0; i < n; i++) {
      const e = enemies[i];
      if (!e || e.dead) continue;
      if (e.flash > 0) e.flash -= dt;
      e.t += dt;
      e.age += dt;
      updateEnemy(e, dt);
    }
    enemies = enemies.filter((e) => e && !e.dead && e.x > -70 && e.x < W + 70 && e.y < H + 80);
  }

  function startBoss(kind) {
    const def = BOSS_DEFS[kind];
    enemies.length = 0;
    boss = {
      id: 'boss',
      isBoss: true,
      kind: kind,
      name: def.name,
      x: W / 2,
      y: -50,
      homeY: 112,
      hitR: def.hitR,
      r: def.hitR,
      hp: def.hp * diff.hp,
      maxHp: def.hp * diff.hp,
      score: def.score,
      xp: def.xp,
      phase: 1,
      t: 0,
      angle: 0,
      entering: true,
      grace: 0,
      flash: 0,
      dead: false,
      timers: {},
    };
  }

  function updateBoss(dt) {
    if (!boss || boss.dead) return;
    const b = boss;
    b.t += dt;
    if (b.flash > 0) b.flash -= dt;
    if (b.entering) {
      b.y += 76 * dt;
      if (b.y >= b.homeY) {
        b.y = b.homeY;
        b.entering = false;
        eBullets.length = 0;
      }
      return;
    }
    if (b.kind === 'comet') {
      const amp = b.phase === 1 ? 96 : 128;
      const freq = b.phase === 1 ? 0.85 : 1.35;
      b.x = W / 2 + Math.sin(b.t * freq) * amp;
      b.y = b.homeY + Math.sin(b.t * 1.4) * 12;
    } else if (b.kind === 'eclipse') {
      b.x = W / 2 + Math.sin(b.t * (b.phase === 3 ? 1.15 : 0.7)) * (b.phase === 3 ? 130 : 100);
      b.y = b.homeY + Math.sin(b.t * 0.9) * 18;
    } else {
      b.x = W / 2 + Math.sin(b.t * 0.82) * 118;
      b.y = 118 + Math.sin(b.t * 1.65) * 34;
    }
    b.x = clamp(b.x, 48, W - 48);
    if (b.grace > 0) {
      b.grace -= dt;
      return;
    }
    if (b.kind === 'comet') bossComet(b, dt);
    else if (b.kind === 'eclipse') bossEclipse(b, dt);
    else bossVoid(b, dt);
  }

  function bossComet(b, dt) {
    if (b.phase === 1) {
      every(b.timers, 'aim', iv(0.82), dt, () => {
        aimedFan(b.x, b.y + 16, scaledCount(3), 0.16, bSpeed(172), '#ff4fd8', 3.4);
      });
      every(b.timers, 'ring', iv(1.65), dt, () => {
        const extra = gapAtPlayer(b.x, b.y, diff.id === 'hard' ? 0.38 : 0.55, diff.id === 'easy' ? 1 : 0.8);
        ring(b.x, b.y, scaledCount(14), bSpeed(118), b.angle, '#ff7a3c', 3.3, extra);
        b.angle += 0.35;
      });
    } else {
      b.angle += dt * (2.1 + diff.density * 0.3);
      every(b.timers, 'spiral', iv(0.09), dt, () => {
        shootDir(b.x, b.y, b.angle, bSpeed(150), '#ff3355', 3.2);
        shootDir(b.x, b.y, b.angle + Math.PI, bSpeed(150), '#ffe14a', 3.2);
        if (diff.id === 'hard') shootDir(b.x, b.y, b.angle + 1.2, bSpeed(130), '#ff4fd8', 3);
      });
      every(b.timers, 'aim', iv(1.05), dt, () => {
        aimedFan(b.x, b.y + 10, scaledCount(4), 0.12, bSpeed(205), '#ff4fd8', 3.2);
      });
      every(b.timers, 'add', iv(4.4), dt, () => {
        spawnEnemy('scout', b.x - 36, b.y + 8);
        spawnEnemy('scout', b.x + 36, b.y + 8);
      });
    }
  }

  function bossEclipse(b, dt) {
    if (b.phase === 1) {
      every(b.timers, 'wall', iv(0.13), dt, () => {
        const gapW = diff.id === 'hard' ? 32 : diff.id === 'easy' ? 58 : 44;
        const gapX = W / 2 + Math.sin(b.t * 0.8) * 110;
        const spacing = diff.id === 'hard' ? 16 : diff.id === 'easy' ? 26 : 20;
        for (let x = 14; x < W; x += spacing) {
          if (Math.abs(x - gapX) < gapW) continue;
          shootDir(x, b.y + 28, Math.PI / 2, bSpeed(128), '#c77dff', 3.3);
        }
      });
    } else if (b.phase === 2) {
      b.angle += dt * (2.2 + diff.density * 0.25);
      every(b.timers, 'arm', iv(0.075), dt, () => {
        const n = diff.id === 'hard' ? 4 : 3;
        for (let i = 0; i < n; i++) {
          const col = i % 2 ? '#ff4fd8' : '#7af0ff';
          shootDir(b.x, b.y, b.angle + (i * Math.PI * 2) / n, bSpeed(146), col, 3.2);
        }
      });
      every(b.timers, 'aim', iv(1.25), dt, () => {
        aimedFan(b.x - 40, b.y, 2, 0.2, bSpeed(190), '#ffe14a', 3.2);
        aimedFan(b.x + 40, b.y, 2, 0.2, bSpeed(190), '#ffe14a', 3.2);
      });
    } else {
      every(b.timers, 'slow', iv(0.7), dt, () => {
        const chance = diff.id === 'hard' ? 0.45 : diff.id === 'easy' ? 1 : 0.72;
        const extra = gapAtPlayer(b.x, b.y, diff.id === 'hard' ? 0.28 : 0.46, chance);
        ring(b.x, b.y, scaledCount(18), bSpeed(92), b.angle, '#b388ff', 3.5, Object.assign({ accel: 28 }, extra));
        b.angle += 0.4;
      });
      every(b.timers, 'fast', iv(1.15), dt, () => {
        ring(b.x, b.y, scaledCount(14), bSpeed(210), -b.angle, '#ff4fd8', 2.8);
      });
      every(b.timers, 'stream', iv(1.4), dt, () => {
        aimedFan(b.x, b.y, scaledCount(diff.id === 'easy' ? 3 : 5), 0.1, bSpeed(230), '#ffe14a', 3);
      });
    }
  }

  function bossVoid(b, dt) {
    const breath = (b.t % 5.2);
    const windowLen = diff.id === 'hard' ? 0.38 : diff.id === 'easy' ? 0.85 : 0.6;
    if (b.phase === 3 && breath < windowLen) {
      every(b.timers, 'rest', iv(0.5), dt, () => {
        const extra = gapAtPlayer(b.x, b.y, 0.7, 1);
        ring(b.x, b.y, scaledCount(12), bSpeed(86), b.angle, '#5ce1ff', 3.2, extra);
      });
      return;
    }
    if (b.phase === 1) {
      every(b.timers, 'geo', iv(0.95), dt, () => {
        ring(b.x, b.y, scaledCount(18), bSpeed(120), b.angle, '#5ce1ff', 3.3);
        ring(b.x, b.y, scaledCount(12), bSpeed(78), -b.angle * 0.7, '#ff4fd8', 3.6, { accel: 22 });
        b.angle += 0.45;
      });
      every(b.timers, 'aim', iv(1.5), dt, () => {
        aimedFan(b.x, b.y, diff.id === 'easy' ? 2 : 3, 0.22, bSpeed(176), '#ffe14a', 3.2);
      });
    } else if (b.phase === 2) {
      b.angle += dt * 1.7;
      every(b.timers, 'curve', iv(0.1), dt, () => {
        shootDir(b.x, b.y, b.angle, bSpeed(148), '#5ce1ff', 3.2, { spin: 1.35 });
        shootDir(b.x, b.y, b.angle + Math.PI, bSpeed(148), '#ff4fd8', 3.2, { spin: -1.35 });
        shootDir(b.x, b.y, -b.angle, bSpeed(120), '#ffe14a', 3, { spin: 0.7 });
      });
      every(b.timers, 'ring', iv(1.8), dt, () => {
        const extra = gapAtPlayer(b.x, b.y, 0.42, diff.id === 'hard' ? 0.5 : 0.85);
        ring(b.x, b.y, scaledCount(20), bSpeed(110), b.t, '#b388ff', 3.3, extra);
      });
    } else {
      b.angle += dt * (2.4 + diff.density * 0.2);
      every(b.timers, 'spiral', iv(0.08), dt, () => {
        shootDir(b.x, b.y, b.angle, bSpeed(156), '#ff3355', 3.1);
        shootDir(b.x, b.y, b.angle + Math.PI, bSpeed(156), '#5ce1ff', 3.1);
      });
      every(b.timers, 'aim', iv(0.85), dt, () => {
        aimedFan(b.x, b.y, scaledCount(4), 0.11, bSpeed(220), '#ffe14a', 3);
      });
      every(b.timers, 'ring', iv(1.35), dt, () => {
        const extra = gapAtPlayer(b.x, b.y, diff.id === 'hard' ? 0.26 : 0.4, diff.id === 'easy' ? 1 : 0.55);
        ring(b.x, b.y, scaledCount(22), bSpeed(132), -b.angle, '#ff4fd8', 3.2, extra);
      });
      if (diff.id === 'hard') {
        every(b.timers, 'add', iv(5), dt, () => spawnEnemy('danmaku', rand(60, W - 60), -16));
      }
    }
  }

  function refreshBossPhase() {
    if (!boss || boss.dead) return;
    const ratio = boss.hp / boss.maxHp;
    let next = 1;
    if (boss.kind === 'comet') next = ratio <= 0.5 ? 2 : 1;
    else next = ratio <= 0.33 ? 3 : ratio <= 0.66 ? 2 : 1;
    if (next === boss.phase) return;
    boss.phase = next;
    boss.grace = 1.05;
    boss.timers = {};
    addShake(8);
    audio.phase();
    spark(boss.x, boss.y, '#ffe14a', 22, 170, 0.45);
    announce('第 ' + next + ' 形態', boss.name, 1.25);
  }

  function damageTarget(e, dmg) {
    if (!e || e.dead || dmg <= 0) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (e.hp <= 0) {
      e.hp = 0;
      e.dead = true;
      if (e.isBoss) defeatBoss(e);
      else defeatEnemy(e);
    }
  }

  function defeatEnemy(e) {
    addScore(e.score, true);
    audio.explode(false);
    spark(e.x, e.y, '#ffe14a', 8, 130, 0.32);
    spark(e.x, e.y, e.type === 'elite' ? '#ff3355' : '#ff4fd8', 8, 100, 0.3);
    const n = e.type === 'elite' ? 3 : 1;
    for (let i = 0; i < n; i++) {
      gems.push({
        x: e.x + rand(-8, 8),
        y: e.y + rand(-8, 8),
        xp: Math.max(1, Math.round(e.xp / n)),
        t: Math.random() * 0.2,
        dead: false,
      });
    }
  }

  function defeatBoss(b) {
    addScore(b.score, true);
    audio.explode(true);
    addShake(14);
    flash = 0.45;
    spark(b.x, b.y, '#ffe14a', 36, 230, 0.6);
    spark(b.x, b.y, '#ff4fd8', 28, 190, 0.55);
    spark(b.x, b.y, '#5ce1ff', 18, 160, 0.5);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      gems.push({
        x: b.x + Math.cos(a) * 18,
        y: b.y + Math.sin(a) * 12,
        xp: Math.max(1, Math.round(b.xp / 8)),
        t: 0,
        dead: false,
      });
    }
    eBullets.length = 0;
    enemies.length = 0;
    bossDefeatT = 1.3;
    if (boss === b) boss = null;
    announce('擊破', b.name, 1.25);
    hudDirty = true;
  }

  function eachTarget(fn) {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e && !e.dead) fn(e);
    }
    if (boss && !boss.dead) fn(boss);
  }

  function nearestEnemy(x, y) {
    let best = null;
    let bestD = 1e12;
    eachTarget((e) => {
      const d = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
      if (d < bestD) { bestD = d; best = e; }
    });
    return best;
  }

  function fireWeapons(dt) {
    fireSpread(dt);
    fireLaser(dt);
    fireMissile(dt);
    fireWave(dt);
    fireDrones(dt);
  }

  function fireSpread(dt) {
    const lv = player.weapons.spread;
    if (!lv) return;
    player.cd.spread -= dt;
    const interval = Math.max(0.05, SPREAD_IV[lv - 1] * player.rateMul);
    if (player.cd.spread > 0) return;
    player.cd.spread = interval;
    const n = SPREAD_N[lv - 1];
    const arc = SPREAD_ARC[lv - 1];
    const dmg = SPREAD_DMG[lv - 1] * player.dmgMul;
    const spd = SPREAD_SPD[lv - 1];
    const pierce = lv >= 5 ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (n === 1 ? 0 : (i - (n - 1) / 2) * (arc / (n - 1)));
      pBullets.push({
        x: player.x, y: player.y - 14,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        r: 3.2, dmg: dmg, pierce: pierce, life: 1.45, hit: new Set(),
      });
    }
    audio.shoot();
  }

  function fireLaser(dt) {
    const lv = player.weapons.laser;
    if (!lv) return;
    const half = LASER_HALF[lv - 1];
    const dps = LASER_DPS[lv - 1] * player.dmgMul / player.rateMul;
    eachTarget((e) => {
      if (Math.abs(e.x - player.x) < half + e.hitR && e.y < player.y - 6) damageTarget(e, dps * dt);
    });
  }

  function fireMissile(dt) {
    const lv = player.weapons.missile;
    if (!lv) return;
    player.cd.missile -= dt;
    const interval = Math.max(0.2, MISSILE_IV[lv - 1] * player.rateMul);
    if (player.cd.missile > 0) return;
    player.cd.missile = interval;
    const n = [1, 2, 2, 3, 3][lv - 1];
    const speed = 250 + lv * 26;
    for (let i = 0; i < n; i++) {
      const spread = (i - (n - 1) / 2) * 0.28;
      const a = -Math.PI / 2 + spread;
      missiles.push({
        x: player.x + (i - (n - 1) / 2) * 8,
        y: player.y - 8,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        speed: speed,
        turn: 3.3 + lv * 0.75,
        dmg: (11 + lv * 3) * player.dmgMul,
        r: 4,
        life: 3.1,
        aoe: lv >= 5 ? 30 : 0,
      });
    }
    audio.missile();
  }

  function fireWave(dt) {
    const lv = player.weapons.wave;
    if (!lv) return;
    player.cd.wave -= dt;
    const interval = Math.max(0.22, WAVE_IV[lv - 1] * player.rateMul);
    if (player.cd.wave > 0) return;
    player.cd.wave = interval;
    const n = [1, 1, 2, 2, 3][lv - 1];
    for (let i = 0; i < n; i++) {
      waves.push({
        x: player.x,
        y: player.y - 18 - i * 20,
        r: 18 + lv * 8,
        vy: -190 - lv * 14,
        dmg: (8 + lv * 3) * player.dmgMul,
        life: 2.15,
        hit: new Set(),
      });
    }
    audio.wave();
  }

  function fireDrones(dt) {
    if (!player.drones) return;
    player.cd.drone -= dt;
    if (player.cd.drone > 0) return;
    player.cd.drone = Math.max(0.12, 0.36 * player.rateMul);
    for (let i = 0; i < player.drones; i++) {
      const ang = player.time * 2.4 + i * Math.PI;
      const x = player.x + Math.cos(ang) * 26;
      const y = player.y + Math.sin(ang) * 14 + 6;
      const target = nearestEnemy(x, y);
      let a = -Math.PI / 2;
      if (target) a = Math.atan2(target.y - y, target.x - x);
      pBullets.push({
        x: x, y: y,
        vx: Math.cos(a) * 440,
        vy: Math.sin(a) * 440,
        r: 2.5,
        dmg: 3.3 * player.droneDmg * player.dmgMul,
        pierce: 0,
        life: 1.25,
        hit: new Set(),
        tiny: true,
      });
    }
  }

  function updateProjectiles(dt) {
    for (let i = 0; i < eBullets.length; i++) {
      const b = eBullets[i];
      if (b.accel) {
        const sp = Math.hypot(b.vx, b.vy) + b.accel * dt;
        const ang = Math.atan2(b.vy, b.vx);
        b.vx = Math.cos(ang) * sp;
        b.vy = Math.sin(ang) * sp;
      }
      if (b.spin) {
        const ang = Math.atan2(b.vy, b.vx) + b.spin * dt;
        const sp = Math.hypot(b.vx, b.vy) || 1;
        b.vx = Math.cos(ang) * sp;
        b.vy = Math.sin(ang) * sp;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    }
    eBullets = eBullets.filter((b) => b.life > 0 && b.x > -36 && b.x < W + 36 && b.y > -36 && b.y < H + 48);

    for (let i = 0; i < pBullets.length; i++) {
      const b = pBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    }
    pBullets = pBullets.filter((b) => !b.dead && b.life > 0 && b.y > -30 && b.y < H + 20 && b.x > -20 && b.x < W + 20);

    for (let i = 0; i < missiles.length; i++) {
      const m = missiles[i];
      const target = nearestEnemy(m.x, m.y);
      let ang = Math.atan2(m.vy, m.vx);
      if (target) {
        const want = Math.atan2(target.y - m.y, target.x - m.x);
        let da = Math.atan2(Math.sin(want - ang), Math.cos(want - ang));
        const maxTurn = m.turn * dt;
        if (da > maxTurn) da = maxTurn;
        if (da < -maxTurn) da = -maxTurn;
        ang += da;
      }
      m.vx = Math.cos(ang) * m.speed;
      m.vy = Math.sin(ang) * m.speed;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.life -= dt;
    }
    missiles = missiles.filter((m) => !m.dead && m.life > 0 && m.y > -40 && m.y < H + 30 && m.x > -30 && m.x < W + 30);

    for (let i = 0; i < waves.length; i++) {
      const w = waves[i];
      w.y += w.vy * dt;
      w.life -= dt;
    }
    waves = waves.filter((w) => w.life > 0 && w.y > -50);
  }

  function hurt() {
    if (!player || !player.alive || player.invuln > 0 || state !== 'play') return;
    if (player.shield > 0) {
      player.shield -= 1;
      player.invuln = 1.05;
      audio.shield();
      addShake(6);
      flash = 0.32;
      spark(player.x, player.y, '#5ce1ff', 16, 150, 0.4);
      hudDirty = true;
      return;
    }
    lives -= 1;
    hudDirty = true;
    audio.hurt();
    addShake(12);
    flash = 0.55;
    spark(player.x, player.y, '#ff4fd8', 26, 210, 0.55);
    spark(player.x, player.y, '#ffe14a', 12, 160, 0.4);
    player.alive = false;
    if (lives <= 0) {
      state = 'dying';
      dyingT = 1.15;
      return;
    }
    player.respawnT = 0.62;
  }

  function doRespawn() {
    player.alive = true;
    player.x = W / 2;
    player.y = H - 100;
    player.invuln = 2.25;
    player.respawnT = 0;
    eBullets = eBullets.filter((b) => {
      const dx = b.x - player.x;
      const dy = b.y - player.y;
      return dx * dx + dy * dy > 110 * 110;
    });
    announce('復活', '短暫無敵', 1.05);
    hudDirty = true;
  }

  function collide() {
    if (player && player.alive && state === 'play' && player.invuln <= 0) {
      for (let i = 0; i < eBullets.length; i++) {
        const b = eBullets[i];
        const dx = b.x - player.x;
        const dy = b.y - player.y;
        const d2 = dx * dx + dy * dy;
        const hit = HIT_R + b.r;
        if (d2 < hit * hit) {
          hurt();
          break;
        } else if (!b.grazed && d2 < GRAZE_R * GRAZE_R) {
          b.grazed = true;
          const gain = Math.round(12 * (diff ? diff.scoreMul : 1));
          score += gain;
          if (diff && score > (hiscores[diff.id] || 0)) {
            hiscores[diff.id] = score;
            recordDirty = true;
          }
          if (!collide.grazeLock || clock - collide.grazeLock > 0.12) {
            collide.grazeLock = clock;
            floater(player.x, player.y - 16, '擦彈', '#5ce1ff');
          }
        }
      }
      if (player.alive && player.invuln <= 0) {
        eachTarget((e) => {
          if (!player.alive || player.invuln > 0) return;
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          const rr = e.hitR * 0.68 + HIT_R;
          if (dx * dx + dy * dy < rr * rr) hurt();
        });
      }
    }

    for (let i = 0; i < pBullets.length; i++) {
      const b = pBullets[i];
      if (b.dead) continue;
      eachTarget((e) => {
        if (b.dead || e.dead) return;
        if (b.hit.has(e.id)) return;
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        const rr = b.r + e.hitR;
        if (dx * dx + dy * dy < rr * rr) {
          damageTarget(e, b.dmg);
          b.hit.add(e.id);
          spark(b.x, b.y, '#ffe14a', 3, 70, 0.18);
          if (b.pierce <= 0) b.dead = true;
          else b.pierce -= 1;
        }
      });
    }

    for (let i = 0; i < missiles.length; i++) {
      const m = missiles[i];
      if (m.dead) continue;
      eachTarget((e) => {
        if (m.dead || e.dead) return;
        const dx = m.x - e.x;
        const dy = m.y - e.y;
        const rr = m.r + e.hitR;
        if (dx * dx + dy * dy < rr * rr) {
          damageTarget(e, m.dmg);
          if (m.aoe > 0) {
            eachTarget((o) => {
              if (o === e || o.dead) return;
              const ox = m.x - o.x;
              const oy = m.y - o.y;
              if (ox * ox + oy * oy < m.aoe * m.aoe) damageTarget(o, m.dmg * 0.55);
            });
          }
          m.dead = true;
          spark(m.x, m.y, '#ff7a3c', 8, 110, 0.25);
        }
      });
    }

    for (let i = 0; i < waves.length; i++) {
      const w = waves[i];
      eachTarget((e) => {
        if (e.dead || w.hit.has(e.id)) return;
        const dx = w.x - e.x;
        const dy = w.y - e.y;
        const rr = w.r + e.hitR * 0.8;
        if (dx * dx + dy * dy < rr * rr) {
          w.hit.add(e.id);
          damageTarget(e, w.dmg);
        }
      });
    }
    refreshBossPhase();
  }

  function updateGems(dt) {
    if (!player) return;
    for (let i = 0; i < gems.length; i++) {
      const g = gems[i];
      g.t += dt;
      const dx = player.x - g.x;
      const dy = player.y - g.y;
      const dist = Math.hypot(dx, dy) || 1;
      let sp = 62;
      if (player.alive && dist < player.magnet) sp = 520;
      else if (player.alive && dist < player.magnet + 70) sp = 170;
      g.x += (dx / dist) * sp * dt;
      g.y += (dy / dist) * sp * dt;
      if (player.alive && dist < 16) {
        g.dead = true;
        xp += g.xp;
        audio.pickup();
      } else if (g.t > 14) g.dead = true;
    }
    gems = gems.filter((g) => !g.dead);
  }

  function resolveXp() {
    while (xp >= xpNeed) {
      xp -= xpNeed;
      level += 1;
      xpNeed = xpToNext(level);
      pendingLevel += 1;
    }
    if (pendingLevel > 0 && state === 'play' && player && player.alive) openLevelUp();
  }

  function updateFx(dt) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);
    for (let i = 0; i < floaters.length; i++) {
      const f = floaters[i];
      f.y -= 28 * dt;
      f.life -= dt;
    }
    floaters = floaters.filter((f) => f.life > 0);
    shake = Math.max(0, shake - dt * 30);
    flash = Math.max(0, flash - dt * 1.5);
  }

  function updateStars(dt, speed) {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += (16 + s.z * 96) * speed * dt;
      if (s.y > H) {
        s.y = -2;
        s.x = Math.random() * W;
      }
    }
  }

  function updateNebula(dt, speed) {
    for (let i = 0; i < nebulas.length; i++) {
      nebulas[i].y += 14 * speed * dt;
      if (nebulas[i].y > H + 80) nebulas[i].y = -80;
    }
  }

  function updateMenu(dt) {
    updateStars(dt, 0.55);
    updateNebula(dt, 0.4);
    attractT -= dt;
    attractAng += dt * 0.9;
    if (attractT <= 0) {
      attractT = 0.26;
      for (let i = 0; i < 2; i++) {
        const a = attractAng + i * Math.PI;
        attractBullets.push({
          x: W / 2, y: H * 0.78,
          vx: Math.cos(a) * 64,
          vy: Math.sin(a) * 48 - 30,
          life: 2.6,
          color: i ? '#ff4fd8' : '#5ce1ff',
          r: 3,
        });
      }
    }
    for (let i = 0; i < attractBullets.length; i++) {
      const b = attractBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    }
    attractBullets = attractBullets.filter((b) => b.life > 0 && b.y > -20 && b.y < H + 20 && b.x > -20 && b.x < W + 20);
  }

  function beginStage(index) {
    const stage = STAGES[index];
    director.stage = index;
    director.time = 0;
    director.spawnT = 0.55;
    director.formT = 8;
    director.mode = 'banner';
    director.bannerT = 1.55;
    announce(stage.name, stage.sub, 1.55);
    audio.setStage(index);
    if (index === 0 && player) player.invuln = Math.max(player.invuln, 1.45);
  }

  function updateDirector(dt) {
    if (!director || !diff) return;
    const stage = STAGES[director.stage];
    if (!stage) return;
    if (director.mode === 'banner') {
      director.bannerT -= dt;
      if (director.bannerT <= 0) director.mode = 'spawn';
      return;
    }
    if (director.mode === 'spawn') {
      director.time += dt;
      director.spawnT -= dt;
      if (director.spawnT <= 0) {
        const ramp = 1 - Math.min(1, director.time / stage.duration) * 0.35;
        director.spawnT = stage.interval * diff.spawn * Math.max(0.5, ramp);
        spawnFromPool(stage);
      }
      director.formT -= dt;
      if (director.formT <= 0) {
        director.formT = diff.id === 'hard' ? 9 : 13;
        const teach = diff.id === 'hard' ? 6 : 10;
        if (director.time > teach && enemies.length < 8) spawnFormation();
      }
      if (director.time >= stage.duration) {
        director.mode = 'warn';
        director.bannerT = 2.15;
        announce('警告', '大型機體接近', 2.15);
        audio.alarm();
      }
      return;
    }
    if (director.mode === 'warn') {
      director.bannerT -= dt;
      if (director.bannerT <= 0) {
        director.mode = 'boss';
        startBoss(stage.boss);
      }
    }
  }

  function checkStageClear(dt) {
    if (state !== 'play' || !director) return;
    if (director.mode === 'boss' && !boss) {
      bossDefeatT -= dt;
      if (bossDefeatT <= 0) {
        director.mode = 'clear';
        director.bannerT = 1.7;
        announce('戰區清剿', STAGES[director.stage].clear, 1.7);
      }
      return;
    }
    if (director.mode === 'clear') {
      director.bannerT -= dt;
      if (director.bannerT <= 0) {
        const next = director.stage + 1;
        if (next >= STAGES.length) victory();
        else beginStage(next);
      }
    }
  }

  function updatePlayer(dt) {
    player.time += dt;
    if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt);
    focusState = !!(keys.shift || focusHeld);
    if (!player.alive) return;
    if (state !== 'play' && state !== 'countdown') return;
    const focusing = focusState;
    if (touch && touch.active) {
      const gx = clamp(touch.x + touch.ox, 14, W - 14);
      const gy = clamp(touch.y + touch.oy, 18, H - 18);
      if (focusing) {
        const k = Math.min(1, dt * 7);
        player.x += (gx - player.x) * k;
        player.y += (gy - player.y) * k;
      } else {
        player.x = gx;
        player.y = gy;
      }
      return;
    }
    if (inputMode === 'mouse' && mouseInside) {
      const gx = clamp(mousePos.x, 14, W - 14);
      const gy = clamp(mousePos.y - 20, 18, H - 18);
      if (focusing) {
        const k = Math.min(1, dt * 7);
        player.x += (gx - player.x) * k;
        player.y += (gy - player.y) * k;
      } else {
        player.x = gx;
        player.y = gy;
      }
      return;
    }
    let mx = 0;
    let my = 0;
    if (keys.arrowleft || keys.a) mx -= 1;
    if (keys.arrowright || keys.d) mx += 1;
    if (keys.arrowup || keys.w) my -= 1;
    if (keys.arrowdown || keys.s) my += 1;
    if (!mx && !my) return;
    const len = Math.hypot(mx, my);
    const spd = 280 * player.speedMul * (focusing ? 0.42 : 1);
    player.x = clamp(player.x + (mx / len) * spd * dt, 14, W - 14);
    player.y = clamp(player.y + (my / len) * spd * dt, 18, H - 18);
  }

  function updateCountdown(dt) {
    countdownT -= dt;
    let label = '1';
    let sub = '低速可微調走位';
    if (countdownT > 1.8) { label = '3'; sub = '移動就位'; }
    else if (countdownT > 0.9) { label = '2'; sub = '判定點在機體中央'; }
    if (label !== countdownLabel) {
      countdownLabel = label;
      announce(label, sub, 0.9);
      audio.ui();
    }
    if (countdownT <= 0) {
      state = 'play';
      beginStage(0);
    }
  }

  function updateActive(dt) {
    updateStars(dt, 1);
    updateNebula(dt, 1);
    if (announceT > 0) {
      announceT -= dt;
      if (announceT <= 0) announceEl.classList.add('hidden');
    }
    if (player) updatePlayer(dt);
    if (state === 'countdown') {
      updateCountdown(dt);
      syncHud();
      return;
    }
    if (state === 'play' && player && !player.alive && player.respawnT > 0) {
      player.respawnT -= dt;
      if (player.respawnT <= 0) doRespawn();
    }
    updateDirector(dt);
    updateEnemies(dt);
    updateBoss(dt);
    if (state === 'play' && player && player.alive) fireWeapons(dt);
    updateProjectiles(dt);
    collide();
    updateGems(dt);
    updateFx(dt);
    if (state === 'play') {
      if (comboT > 0) {
        comboT -= dt;
        if (comboT <= 0) combo = 0;
      }
      resolveXp();
      checkStageClear(dt);
      if (recordDirty) {
        recordSaveT -= dt;
        if (recordSaveT <= 0) {
          persistScores();
          recordDirty = false;
          recordSaveT = 2;
        }
      }
    }
    if (state === 'dying') {
      dyingT -= dt;
      if (dyingT <= 0) gameOver();
    }
    syncHud();
  }

  function update(dt) {
    clock += dt;
    if (audio) {
      audio.updateMix(state);
      audio.tick();
    }
    if (state === 'title' || state === 'help' || state === 'difficulty') {
      updateMenu(dt);
      return;
    }
    if (state === 'pause' || state === 'levelup' || state === 'gameover' || state === 'victory') {
      updateStars(dt, 0.15);
      return;
    }
    updateActive(dt);
  }

  function resize() {
    const rect = frame.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.round(rect.width * dpr));
    const h = Math.max(2, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    scaleX = canvas.width / W;
    scaleY = canvas.height / H;
  }

  function blit(img, x, y) {
    if (!img) return;
    ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2));
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#140a22');
    g.addColorStop(0.45, '#07060f');
    g.addColorStop(1, '#07101c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.22;
    for (let i = 0; i < nebulas.length; i++) {
      const n = nebulas[i];
      ctx.fillStyle = n.c;
      ctx.beginPath();
      ctx.ellipse(n.x, n.y, n.rx, n.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = s.c;
      ctx.globalAlpha = 0.35 + s.z * 0.65;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }

  function drawBulletSquare(b) {
    const s = Math.max(4, b.r * 2);
    ctx.fillStyle = '#140c22';
    ctx.fillRect(b.x - s / 2 - 1, b.y - s / 2 - 1, s + 2, s + 2);
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x - s / 2, b.y - s / 2, s, s);
    ctx.fillStyle = '#fff';
    ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
  }

  function drawMenuScene() {
    for (let i = 0; i < attractBullets.length; i++) drawBulletSquare(attractBullets[i]);
    const x = W / 2 + Math.sin(clock * 1.3) * 28;
    const y = H - 72;
    blit(sprites.normal.player, x, y);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 2, y - 2, 4, 4);
    ctx.fillStyle = '#5ce1ff';
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }

  function drawBoss(b) {
    const x = Math.round(b.x);
    const y = Math.round(b.y);
    const flashOn = b.flash > 0 && Math.floor(clock * 28) % 2 === 0;
    if (b.kind === 'comet') {
      ctx.fillStyle = flashOn ? '#fff' : '#6a1028';
      ctx.fillRect(x - 48, y - 10, 96, 22);
      ctx.fillStyle = flashOn ? '#fff' : '#ff3355';
      ctx.fillRect(x - 34, y - 18, 68, 30);
      ctx.fillStyle = flashOn ? '#fff' : '#ff7a3c';
      ctx.fillRect(x - 16, y - 24, 32, 18);
      ctx.fillStyle = '#ffe14a';
      ctx.fillRect(x - 5, y - 6, 10, 10);
      ctx.fillStyle = flashOn ? '#fff' : '#ff4fd8';
      ctx.fillRect(x - 44, y + 8, 10, 16);
      ctx.fillRect(x + 34, y + 8, 10, 16);
    } else if (b.kind === 'eclipse') {
      ctx.strokeStyle = flashOn ? '#fff' : '#c77dff';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(x, y, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#5ce1ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 32, b.t * 2, b.t * 2 + 1.5);
      ctx.stroke();
      ctx.fillStyle = '#140818';
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = flashOn ? '#fff' : '#ff4fd8';
      ctx.fillRect(x - 5, y - 5, 10, 10);
      ctx.fillStyle = flashOn ? '#fff' : '#8b5cff';
      ctx.fillRect(x - 56, y - 8, 16, 16);
      ctx.fillRect(x + 40, y - 8, 16, 16);
    } else {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(b.t * 0.7);
      ctx.fillStyle = flashOn ? '#fff' : '#241048';
      ctx.fillRect(-26, -26, 52, 52);
      ctx.rotate(-b.t * 1.4);
      ctx.strokeStyle = flashOn ? '#fff' : '#5ce1ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(-16, -16, 32, 32);
      ctx.restore();
      ctx.fillStyle = flashOn ? '#fff' : '#ff4fd8';
      ctx.fillRect(x - 6, y - 6, 12, 12);
      ctx.fillStyle = '#ffe14a';
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
  }

  function drawWorld() {
    for (let i = 0; i < gems.length; i++) {
      const gem = gems[i];
      ctx.save();
      ctx.translate(gem.x, gem.y);
      ctx.rotate(Math.PI / 4 + gem.t);
      ctx.fillStyle = '#3dff9a';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.fillStyle = '#eafff6';
      ctx.fillRect(-2, -2, 4, 4);
      ctx.restore();
    }
    for (let i = 0; i < eBullets.length; i++) drawBulletSquare(eBullets[i]);

    if (player && player.alive && player.weapons.laser) {
      const lv = player.weapons.laser;
      const half = LASER_HALF[lv - 1] * (0.86 + Math.sin(player.time * 36) * 0.14);
      ctx.fillStyle = 'rgba(92, 225, 255, 0.28)';
      ctx.fillRect(player.x - half, 0, half * 2, player.y - 8);
      ctx.fillStyle = '#f4f0ff';
      ctx.fillRect(player.x - Math.max(1, half * 0.28), 0, Math.max(2, half * 0.56), player.y - 8);
    }

    for (let i = 0; i < waves.length; i++) {
      const w = waves[i];
      ctx.strokeStyle = '#ff4fd8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(w.x, w.y, w.r, Math.max(8, w.r * 0.4), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#f4f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(w.x, w.y, w.r * 0.62, Math.max(5, w.r * 0.24), 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = 0; i < pBullets.length; i++) {
      const b = pBullets[i];
      const h = b.tiny ? 6 : 10;
      const ww = b.tiny ? 3 : 4;
      ctx.fillStyle = '#ffe14a';
      ctx.fillRect(b.x - ww / 2, b.y - h / 2, ww, h);
      ctx.fillStyle = '#fff6c2';
      ctx.fillRect(b.x - 1, b.y - h / 2, 2, 3);
    }

    for (let i = 0; i < missiles.length; i++) {
      const m = missiles[i];
      ctx.strokeStyle = '#ff7a3c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * 0.04, m.y - m.vy * 0.04);
      ctx.stroke();
      ctx.fillStyle = '#f4f0ff';
      ctx.fillRect(m.x - 2, m.y - 2, 4, 4);
    }

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.state === 'aim' && player) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 225, 74, 0.55)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(player.x, player.y);
        ctx.stroke();
        ctx.restore();
      }
      const img = e.flash > 0 ? sprites.white[e.type] : sprites.normal[e.type];
      blit(img, e.x, e.y);
      if (e.maxHp >= 80 && e.hp < e.maxHp) {
        const bw = 26;
        ctx.fillStyle = '#140c22';
        ctx.fillRect(e.x - bw / 2, e.y - e.r - 8, bw, 3);
        ctx.fillStyle = '#ff3355';
        ctx.fillRect(e.x - bw / 2, e.y - e.r - 8, bw * clamp(e.hp / e.maxHp, 0, 1), 3);
      }
    }

    if (boss) drawBoss(boss);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.sz, p.sz);
    }
    ctx.globalAlpha = 1;

    if (player && player.alive) {
      if (player.drones) {
        for (let i = 0; i < player.drones; i++) {
          const ang = player.time * 2.4 + i * Math.PI;
          blit(sprites.normal.drone, player.x + Math.cos(ang) * 26, player.y + Math.sin(ang) * 14 + 6);
        }
      }
      const blink = player.invuln > 0 && Math.floor(player.time * 14) % 2 === 0;
      if (player.shield > 0) {
        ctx.strokeStyle = 'rgba(92, 225, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 16, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = blink ? 0.35 : 1;
      blit(sprites.normal.player, player.x, player.y);
      ctx.globalAlpha = 1;
      ctx.fillStyle = Math.sin(player.time * 42) > 0 ? '#ff7a3c' : '#ffe14a';
      ctx.fillRect(player.x - 3, player.y + 12, 2, 5);
      ctx.fillRect(player.x + 1, player.y + 12, 2, 4);
      if (focusState) {
        ctx.strokeStyle = 'rgba(255, 225, 74, 0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(player.x - 7, player.y - 7, 14, 14);
      }
      ctx.fillStyle = '#140c22';
      ctx.fillRect(player.x - 3, player.y - 3, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(player.x - 2, player.y - 2, 4, 4);
      ctx.fillStyle = focusState ? '#ffe14a' : '#ff4fd8';
      ctx.fillRect(player.x - 1, player.y - 1, 2, 2);
    }

    ctx.font = 'bold 12px "PingFang TC","Microsoft JhengHei",sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < floaters.length; i++) {
      const f = floaters[i];
      ctx.globalAlpha = clamp(f.life / f.max, 0, 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    resize();
    const jx = shake ? (Math.random() - 0.5) * shake * scaleX : 0;
    const jy = shake ? (Math.random() - 0.5) * shake * scaleY : 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#07060f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scaleX, 0, 0, scaleY, jx, jy);
    ctx.imageSmoothingEnabled = false;
    drawBackground();
    if (state === 'title' || state === 'help' || state === 'difficulty') drawMenuScene();
    else drawWorld();
    if (flash > 0) {
      ctx.fillStyle = 'rgba(255, 70, 110,' + (flash * 0.45).toFixed(3) + ')';
      ctx.fillRect(-8, -8, W + 16, H + 16);
    }
  }

  function syncHud() {
    if (hud.classList.contains('hidden')) return;
    scoreEl.textContent = fmt(score);
    bestEl.textContent = fmt(diff ? hiscores[diff.id] : 0);
    levelEl.textContent = '等級 ' + level;
    diffEl.textContent = diff ? diff.name : '';
    comboEl.textContent = combo >= 2 ? '連擊 ' + combo : '';
    xpBar.style.width = (xpNeed ? clamp(xp / xpNeed, 0, 1) * 100 : 0) + '%';
    muteBtn.textContent = muteLabel();
    focusBtn.classList.toggle('held', !!focusState);
    if (hudDirty && player) {
      let livesHtml = '';
      for (let i = 0; i < 3; i++) livesHtml += '<i class="life' + (i < lives ? ' on' : '') + '"></i>';
      livesEl.innerHTML = livesHtml;
      shieldEl.textContent = player.shield ? '盾 ×' + player.shield : '';
      const names = { spread: '擴散', laser: '雷射', missile: '飛彈', wave: '波動' };
      let chips = '';
      Object.keys(names).forEach((id) => {
        const lv = player.weapons[id];
        if (lv) chips += '<span class="chip">' + names[id] + ' ' + lv + '</span>';
      });
      if (player.drones) chips += '<span class="chip">浮游 ' + player.drones + '</span>';
      weaponBar.innerHTML = chips;
      hudDirty = false;
    }
    if (boss) {
      bossBar.classList.remove('hidden');
      bossFill.style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + '%';
      bossNameEl.textContent = boss.name + '　第 ' + boss.phase + ' 形態';
    } else bossBar.classList.add('hidden');
  }

  function announce(main, sub, dur) {
    announceT = dur || 1.4;
    announceEl.classList.remove('hidden');
    announceEl.innerHTML = '<div class="a-main">' + esc(main) + '</div>' +
      (sub ? '<div class="a-sub">' + esc(sub) + '</div>' : '');
    announceEl.style.animation = 'none';
    void announceEl.offsetWidth;
    announceEl.style.animation = 'pop 0.22s ease-out';
  }

function openUi(html, center) {
  ui.classList.toggle('center', !!center);
  ui.classList.remove('hidden');
  ui.innerHTML = html;
  hud.classList.add('hidden');
  announceT = 0;
  announceEl.classList.add('hidden');
}

  function showPlayChrome() {
    ui.classList.add('hidden');
    ui.innerHTML = '';
    hud.classList.remove('hidden');
    hudDirty = true;
    syncHud();
  }

  function scoreTable() {
    return '<div class="scores">' +
      '<span>簡單</span><b>' + fmt(hiscores.easy) + '</b>' +
      '<span>中等</span><b>' + fmt(hiscores.normal) + '</b>' +
      '<span>困難</span><b>' + fmt(hiscores.hard) + '</b>' +
      '</div>';
  }

  function renderTitle() {
    state = 'title';
    openUi(
      '<div class="panel">' +
        '<p class="eyebrow">直向像素射擊</p>' +
        '<h1>星河彈幕</h1>' +
        '<p class="tagline">中央光點才是你。擦過彈幕，撐過三個戰區。</p>' +
        '<div class="col">' +
          '<button type="button" class="chunk" data-act="diff"><span class="nm">開始任務</span><span class="ds">選擇難度後出擊</span></button>' +
          '<button type="button" class="chunk alt" data-act="help"><span class="nm">操作說明</span><span class="ds">鍵盤、滑鼠與觸控</span></button>' +
        '</div>' +
        '<h3>最高紀錄</h3>' +
        scoreTable() +
        '<p class="small">音效會在按下按鈕後開始，可隨時靜音。紀錄存在這台裝置的瀏覽器。</p>' +
        '<button type="button" class="chunk alt" data-act="mute"><span class="nm">' + muteLabel() + '</span></button>' +
      '</div>',
      false
    );
  }

  function renderHelp() {
    state = 'help';
    openUi(
      '<div class="panel scroll">' +
        '<h2>操作說明</h2>' +
        '<h3>電腦</h3>' +
        '<ul>' +
          '<li>方向鍵或 W A S D 移動。</li>' +
          '<li>按住 Shift 進入低速，方便微調。</li>' +
          '<li>滑鼠在畫面裡會帶領戰機，游標在機體稍下方。</li>' +
          '<li>P 或 Esc 暫停。射擊全程自動。</li>' +
        '</ul>' +
        '<h3>手機與平板</h3>' +
        '<ul>' +
          '<li>按住拖曳。手指靠近戰機時，戰機會移到手指上方，避免擋住視線。</li>' +
          '<li>放開後戰機留在原地，並繼續自動射擊。</li>' +
          '<li>右下角「低速」按住可減速。右上角可暫停或切換音效。</li>' +
        '</ul>' +
        '<h3>規則</h3>' +
        '<ul>' +
          '<li>一共 3 條命，陣亡後可復活 2 次。復活後短暫無敵。</li>' +
          '<li>只有中央光點碰到彈幕或機體才會受傷。擦過彈幕可以得分。</li>' +
          '<li>擊破敵機會掉經驗。經驗滿了會暫停，從三個強化裡選一個。</li>' +
          '<li>護盾可以擋下一次傷害。武器可以並用，也能再升級。</li>' +
          '<li>每個難度各自保存最高分。</li>' +
        '</ul>' +
        '<button type="button" class="chunk" data-act="title"><span class="nm">知道了</span></button>' +
      '</div>',
      false
    );
  }

  function renderDiff() {
    state = 'difficulty';
    const order = ['easy', 'normal', 'hard'];
    const cls = { easy: 'ok', normal: 'warn', hard: 'danger' };
    let buttons = '';
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      const d = DIFFS[id];
      buttons += '<button type="button" class="chunk ' + cls[id] + '" data-act="start" data-diff="' + id + '">' +
        '<span class="nm">' + d.name + '</span>' +
        '<span class="ds">' + esc(d.blurb) + '</span>' +
        '<span class="meta">最高 ' + fmt(hiscores[id]) + '</span>' +
        '</button>';
    }
    openUi(
      '<div class="panel">' +
        '<h2>選擇難度</h2>' +
        '<p class="tagline">就算選簡單，彈幕也很密。困難幾乎不留容錯。</p>' +
        '<div class="col">' + buttons +
          '<button type="button" class="chunk alt" data-act="title"><span class="nm">返回</span></button>' +
        '</div>' +
      '</div>',
      false
    );
  }

  function renderLevelUp() {
    let cards = '';
    for (let i = 0; i < currentChoices.length; i++) {
      const c = currentChoices[i];
      cards += '<button type="button" class="chunk card" data-act="pick" data-i="' + i + '">' +
        '<span class="tag">' + esc(c.tag) + '　按 ' + (i + 1) + '</span>' +
        '<span class="nm">' + esc(c.name) + '</span>' +
        '<span class="ds">' + esc(c.desc) + '</span>' +
        '</button>';
    }
    openUi(
      '<div class="panel">' +
        '<p class="eyebrow">經驗滿載</p>' +
        '<h2>等級提升</h2>' +
        '<p class="tagline">現在是等級 ' + level + '。選一項強化。</p>' +
        '<div class="cards">' + cards + '</div>' +
      '</div>',
      true
    );
  }

  function renderPause() {
    openUi(
      '<div class="panel">' +
        '<h2>暫停</h2>' +
        '<p class="tagline">戰局先停著。準備好再繼續。</p>' +
        '<div class="col">' +
          '<button type="button" class="chunk" data-act="resume"><span class="nm">繼續遊戲</span></button>' +
          '<button type="button" class="chunk warn" data-act="retry"><span class="nm">重新開始</span></button>' +
          '<button type="button" class="chunk alt" data-act="title"><span class="nm">回標題</span></button>' +
        '</div>' +
      '</div>',
      true
    );
  }

  function renderEnd(victoryMode) {
    const fresh = score > bestAtStart && score > 0;
    openUi(
      '<div class="panel">' +
        (victoryMode
          ? '<p class="eyebrow">任務完成</p><h2>星河解放</h2><p class="tagline">虛空核心已經沉默。這段星河暫時恢復平靜。</p>'
          : '<p class="eyebrow">機體損毀</p><h2>任務失敗</h2><p class="tagline">彈幕還在。下一次換條航道。</p>') +
        (fresh ? '<p class="record">新紀錄！</p>' : '') +
        '<div class="scores"><span>這次分數</span><b>' + fmt(score) + '</b>' +
          '<span>最高紀錄</span><b>' + fmt(diff ? hiscores[diff.id] : 0) + '</b></div>' +
        '<div class="col" style="margin-top:10px">' +
          '<button type="button" class="chunk" data-act="retry"><span class="nm">再戰一次</span></button>' +
          '<button type="button" class="chunk alt" data-act="title"><span class="nm">回標題</span></button>' +
        '</div>' +
      '</div>',
      true
    );
  }

  function ownedCount() {
    let n = 0;
    if (player.weapons.spread) n += 1;
    if (player.weapons.laser) n += 1;
    if (player.weapons.missile) n += 1;
    if (player.weapons.wave) n += 1;
    return n;
  }

  function makeScoreChoice() {
    return {
      weight: 0.4,
      tag: '獎勵',
      name: '戰績加乘',
      desc: '立刻獲得 3000 分。',
      apply: () => { addScore(3000, false); },
    };
  }

  function takeWeighted(pool) {
    let total = 0;
    for (let i = 0; i < pool.length; i++) total += pool[i].weight;
    let r = Math.random() * (total || 1);
    let i = 0;
    for (; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r <= 0) break;
    }
    if (i >= pool.length) i = pool.length - 1;
    return pool.splice(i, 1)[0];
  }

  function makeChoices() {
    const pool = [];
    ['spread', 'laser', 'missile', 'wave'].forEach((id) => {
      const info = WEAPON_INFO[id];
      const lv = player.weapons[id] || 0;
      if (lv >= 5) return;
      pool.push({
        weight: lv === 0 ? 2.35 : 1.25,
        tag: lv === 0 ? '新武器' : ('第 ' + lv + ' 級 → 第 ' + (lv + 1) + ' 級'),
        name: info.name,
        desc: lv === 0 ? info.unlock : info.up[lv - 1],
        apply: () => { player.weapons[id] = lv + 1; },
      });
    });
    if (player.ranks.dmg < 8) {
      pool.push({
        weight: 1,
        tag: '目前 ' + player.ranks.dmg + '/8',
        name: '火力增強',
        desc: '所有武器傷害提高 20%。',
        apply: () => { player.ranks.dmg += 1; player.dmgMul += 0.2; },
      });
    }
    if (player.ranks.rate < 7) {
      pool.push({
        weight: 1,
        tag: '目前 ' + player.ranks.rate + '/7',
        name: '射速提升',
        desc: '射擊間隔縮短 12%。',
        apply: () => { player.ranks.rate += 1; player.rateMul *= 0.88; },
      });
    }
    if (player.ranks.speed < 6) {
      pool.push({
        weight: 0.95,
        tag: '目前 ' + player.ranks.speed + '/6',
        name: '推進強化',
        desc: '移動速度提高 10%。',
        apply: () => { player.ranks.speed += 1; player.speedMul *= 1.1; },
      });
    }
    if (player.ranks.drone < 4) {
      const summon = player.drones < 2;
      pool.push({
        weight: summon ? 1.35 : 0.85,
        tag: summon ? ('浮游砲 ' + player.drones + '/2') : '強化',
        name: '浮游砲',
        desc: summon ? '增加 1 座會自動瞄準射擊的浮游砲。' : '浮游砲傷害提高 25%。',
        apply: () => {
          player.ranks.drone += 1;
          if (player.drones < 2) player.drones += 1;
          else player.droneDmg *= 1.25;
        },
      });
    }
    if (player.shield < 3) {
      pool.push({
        weight: 0.9,
        tag: '持有 ' + player.shield + '/3',
        name: '能量護盾',
        desc: '獲得 1 層護盾，可抵擋一次傷害。最多同時 3 層。',
        apply: () => { player.shield = Math.min(3, player.shield + 1); },
      });
    }
    if (player.ranks.magnet < 5) {
      pool.push({
        weight: 0.8,
        tag: '目前 ' + player.ranks.magnet + '/5',
        name: '吸收磁場',
        desc: '經驗球會從更遠的地方高速飛向你。',
        apply: () => { player.ranks.magnet += 1; player.magnet += 42; },
      });
    }
    if (lives < 3) {
      pool.push({
        weight: 0.55,
        tag: '生命 ' + lives + '/3',
        name: '緊急修復',
        desc: '回復 1 條生命。',
        apply: () => { lives = Math.min(3, lives + 1); },
      });
    }
    if (pool.length < 3) pool.push(makeScoreChoice());
    const picks = [];
    if (ownedCount() < 3 && level <= 7) {
      const fresh = [];
      for (let i = 0; i < pool.length; i++) if (pool[i].tag === '新武器') fresh.push(i);
      if (fresh.length) {
        const idx = fresh[Math.floor(Math.random() * fresh.length)];
        picks.push(pool.splice(idx, 1)[0]);
      }
    }
    while (picks.length < 3 && pool.length) picks.push(takeWeighted(pool));
    for (let i = picks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = picks[i];
      picks[i] = picks[j];
      picks[j] = tmp;
    }
    return picks;
  }

  function openLevelUp() {
    if (state !== 'play') return;
    if (pendingLevel > 0) pendingLevel -= 1;
    currentChoices = makeChoices();
    state = 'levelup';
    audio.level();
    renderLevelUp();
  }

  function pickChoice(i) {
    if (state !== 'levelup') return;
    const c = currentChoices[i];
    if (!c) return;
    c.apply();
    hudDirty = true;
    audio.power();
    state = 'play';
    showPlayChrome();
    if (pendingLevel > 0) openLevelUp();
  }

  function startRun(diffId) {
    audio.unlock();
    diff = DIFFS[diffId] || DIFFS.normal;
    bestAtStart = hiscores[diff.id] || 0;
    clearActors();
    attractBullets = [];
    player = makePlayer();
    lives = 3;
    score = 0;
    level = 1;
    xp = 0;
    xpNeed = xpToNext(1);
    pendingLevel = 0;
    combo = 0;
    comboT = 0;
    bossDefeatT = 0;
    inputMode = 'key';
    touch = null;
    focusHeld = false;
    director = { stage: 0, time: 0, spawnT: 1, formT: 8, mode: 'idle', bannerT: 0 };
    state = 'countdown';
    countdownT = 2.7;
    countdownLabel = '3';
    hudDirty = true;
    showPlayChrome();
    announce('3', '移動就位', 0.9);
    audio.setStage(0);
  }

  function gameOver() {
    if (state === 'gameover' || state === 'victory') return;
    state = 'gameover';
    persistScores();
    audio.gameover();
    renderEnd(false);
  }

  function victory() {
    if (state !== 'play') return;
    state = 'victory';
    persistScores();
    audio.victory();
    renderEnd(true);
  }

  function goTitle() {
    persistScores();
    clearActors();
    player = null;
    diff = null;
    touch = null;
    renderTitle();
  }

  function togglePause() {
    if (audio) audio.unlock();
    if (state === 'play' || state === 'countdown') {
      resumeState = state;
      state = 'pause';
      if (audio) audio.ui();
      renderPause();
    } else if (state === 'pause') {
      state = resumeState || 'play';
      showPlayChrome();
    }
  }

  function toggleMute() {
    audio.unlock();
    audio.toggle();
    if (state === 'title') renderTitle();
    else if (state === 'help') renderHelp();
    else if (state === 'difficulty') renderDiff();
    else syncHud();
  }

  function onAction(act, node) {
    audio.unlock();
    audio.ui();
    if (act === 'diff') renderDiff();
    else if (act === 'help') renderHelp();
    else if (act === 'title') goTitle();
    else if (act === 'mute') toggleMute();
    else if (act === 'start') startRun(node.dataset.diff || 'normal');
    else if (act === 'resume') togglePause();
    else if (act === 'retry') startRun(diff ? diff.id : 'normal');
    else if (act === 'pick') pickChoice(Number(node.dataset.i));
  }

  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / Math.max(1, r.width)) * W,
      y: ((e.clientY - r.top) / Math.max(1, r.height)) * H,
    };
  }

  function bindInput() {
    ui.addEventListener('click', (ev) => {
      const node = ev.target.closest('[data-act]');
      if (!node || !ui.contains(node)) return;
      onAction(node.dataset.act, node);
    });
    pauseBtn.addEventListener('click', () => togglePause());
    muteBtn.addEventListener('click', () => toggleMute());

    focusBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      focusHeld = true;
      focusBtn.classList.add('held');
      try { focusBtn.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
    });
    const releaseFocus = () => {
      focusHeld = false;
      focusBtn.classList.remove('held');
    };
    focusBtn.addEventListener('pointerup', releaseFocus);
    focusBtn.addEventListener('pointercancel', releaseFocus);
    focusBtn.addEventListener('lostpointercapture', releaseFocus);

    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      if (!player || (state !== 'play' && state !== 'countdown')) return;
      e.preventDefault();
      const p = toGame(e);
      audio.unlock();
      const lift = 96;
      let ox = player.x - p.x;
      let oy = player.y - p.y;
      if (Math.hypot(ox, oy) < 120) {
        player.x = clamp(p.x, 14, W - 14);
        player.y = clamp(p.y - lift, 18, H - 18);
        ox = player.x - p.x;
        oy = player.y - p.y;
      }
      touch = { id: e.pointerId, ox: ox, oy: oy, x: p.x, y: p.y, active: true };
      inputMode = 'touch';
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
    }, { passive: false });

    canvas.addEventListener('pointermove', (e) => {
      const p = toGame(e);
      if (touch && touch.active && e.pointerId === touch.id && player) {
        touch.x = p.x;
        touch.y = p.y;
        return;
      }
      if (e.pointerType !== 'mouse') return;
      const moved = Math.hypot(p.x - mousePos.x, p.y - mousePos.y);
      mousePos = p;
      mouseInside = true;
      if (!touch && moved > 12) inputMode = 'mouse';
    });

    canvas.addEventListener('pointerup', (e) => {
      if (touch && e.pointerId === touch.id) touch = null;
    });
    canvas.addEventListener('pointercancel', (e) => {
      if (touch && e.pointerId === touch.id) touch = null;
    });
    canvas.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') mouseInside = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    frame.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      if (k === 'arrowleft' || k === 'arrowright' || k === 'arrowup' || k === 'arrowdown' || k === 'a' || k === 'd' || k === 'w' || k === 's') {
        inputMode = 'key';
      }
      const block = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '];
      if (block.indexOf(k) >= 0) e.preventDefault();
      if (e.repeat) return;
      if (k === 'p' || k === 'escape') {
        e.preventDefault();
        togglePause();
      }
      if (state === 'levelup' && (k === '1' || k === '2' || k === '3')) pickChoice(Number(k) - 1);
    });
    window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => {
      Object.keys(keys).forEach((k) => { keys[k] = false; });
      focusHeld = false;
      touch = null;
    });
    document.addEventListener('touchmove', (e) => {
      if (e.target.closest && e.target.closest('#ui')) return;
      e.preventDefault();
    }, { passive: false });
    document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 1) e.preventDefault();
    }, { passive: false });
    window.addEventListener('resize', resize);
    window.addEventListener('beforeunload', persistScores);
  }

  function showCrash(err) {
    ui.classList.remove('hidden');
    ui.classList.add('center');
    ui.textContent = '';
    const panel = document.createElement('div');
    panel.className = 'panel';
    const h = document.createElement('h2');
    h.textContent = '遊戲發生錯誤';
    const p = document.createElement('p');
    p.textContent = err && err.message ? err.message : String(err);
    panel.appendChild(h);
    panel.appendChild(p);
    ui.appendChild(panel);
  }

  function frameLoop(ts) {
    if (!frameLoop.last) frameLoop.last = ts;
    let dt = (ts - frameLoop.last) / 1000;
    frameLoop.last = ts;
    if (dt < 0) dt = 0;
    if (dt > 0.05) dt = 0.05;
    try {
      update(dt);
      draw();
    } catch (err) {
      if (!crashed) {
        crashed = true;
        console.error(err);
        showCrash(err);
      }
      return;
    }
    if (!crashed) requestAnimationFrame(frameLoop);
  }

  function boot() {
    loadScores();
    bakeAll();
    makeStars();
    bindInput();
    resize();
    renderTitle();
    window.__xinghe = {
      snapshot: () => ({
        state: state,
        score: score,
        level: level,
        lives: lives,
        xp: xp,
        xpNeed: xpNeed,
        diff: diff ? diff.id : null,
        x: player ? Math.round(player.x) : null,
        y: player ? Math.round(player.y) : null,
        alive: player ? player.alive : false,
        invuln: player ? player.invuln : 0,
        shield: player ? player.shield : 0,
        weapons: player ? Object.assign({}, player.weapons) : null,
        drones: player ? player.drones : 0,
        enemies: enemies.length,
        eBullets: eBullets.length,
        gems: gems.length,
        boss: boss ? { name: boss.name, hp: Math.round(boss.hp), phase: boss.phase, entering: boss.entering } : null,
        choices: state === 'levelup' ? currentChoices.map((c) => c.name) : null,
      }),
    };
    requestAnimationFrame(frameLoop);
  }

  boot();
})();
