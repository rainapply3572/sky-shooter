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
    charger: [
      '..r..',
      '.rrr.',
      'rrrrr',
      '.ryr.',
      '..r..',
      '..r..',
    ],
    miner: [
      '.ooo.',
      'ooooo',
      'oyoyo',
      'ooooo',
      '.o.o.',
    ],
    orbiter: [
      '.ccc.',
      'c...c',
      'c.w.c',
      'c...c',
      '.ccc.',
    ],
    splitter: [
      'm...m',
      '.mmm.',
      'mmwmm',
      '.mmm.',
      'm...m',
    ],
  };

  const ENEMY_STATS = {
    scout: { r: 11, hitR: 9, hp: 16, score: 100, xp: 6, maxAge: 12 },
    waver: { r: 12, hitR: 10, hp: 20, score: 140, xp: 7, maxAge: 14 },
    turret: { r: 14, hitR: 12, hp: 46, score: 260, xp: 10, maxAge: 16 },
    sniper: { r: 12, hitR: 10, hp: 36, score: 280, xp: 10, maxAge: 14 },
    danmaku: { r: 15, hitR: 12, hp: 78, score: 420, xp: 14, maxAge: 13 },
    elite: { r: 18, hitR: 15, hp: 150, score: 900, xp: 24, maxAge: 16 },
    charger: { r: 12, hitR: 10, hp: 28, score: 220, xp: 9, maxAge: 10 },
    miner: { r: 13, hitR: 11, hp: 40, score: 260, xp: 11, maxAge: 14 },
    orbiter: { r: 13, hitR: 11, hp: 34, score: 300, xp: 12, maxAge: 13 },
    splitter: { r: 14, hitR: 11, hp: 32, score: 240, xp: 10, maxAge: 12 },
  };

  /* 九個戰區。event 決定地形與事件，mid 是中途精英，boss 是該區唯一頭目。 */
  const STAGES = [
    {
      name: '第 1 戰區', sub: '外環塵域', clear: '赤彗已擊破', duration: 22, interval: 1.02,
      boss: 'comet', theme: 'dust', event: 'combat',
      pool: [{ type: 'scout', w: 5 }, { type: 'waver', w: 3 }, { type: 'turret', w: 1.2 }],
    },
    {
      name: '第 2 戰區', sub: '流星帶', clear: '碎星獸已粉碎', duration: 22, interval: 0.92,
      boss: 'meteor', mid: 'midrock', theme: 'rock', event: 'asteroid',
      pool: [{ type: 'scout', w: 3 }, { type: 'charger', w: 3 }, { type: 'miner', w: 2 }, { type: 'waver', w: 2 }],
    },
    {
      name: '第 3 戰區', sub: '月蝕星環', clear: '母艦已擊破', duration: 22, interval: 0.86,
      boss: 'eclipse', theme: 'eclipse', event: 'combat',
      pool: [{ type: 'turret', w: 3 }, { type: 'sniper', w: 2.4 }, { type: 'orbiter', w: 2 }, { type: 'waver', w: 2 }],
    },
    {
      name: '第 4 戰區', sub: '雷雲走廊', clear: '雷鳴已消散', duration: 22, interval: 0.82,
      boss: 'storm', mid: 'midstorm', theme: 'storm', event: 'storm',
      pool: [{ type: 'sniper', w: 3 }, { type: 'charger', w: 2.5 }, { type: 'waver', w: 2 }, { type: 'orbiter', w: 1.5 }],
    },
    {
      name: '第 5 戰區', sub: '熔核航道', clear: '巨像冷卻了', duration: 22, interval: 0.8,
      boss: 'magma', mid: 'midmagma', theme: 'magma', event: 'terrain',
      pool: [{ type: 'elite', w: 2 }, { type: 'miner', w: 3 }, { type: 'danmaku', w: 2 }, { type: 'splitter', w: 2 }],
    },
    {
      name: '第 6 戰區', sub: '賞金航道', clear: '寶庫已清空', duration: 15, interval: 0.7,
      boss: 'vault', theme: 'vault', event: 'bonus',
      pool: [{ type: 'scout', w: 4 }, { type: 'waver', w: 3 }, { type: 'splitter', w: 1.4 }],
    },
    {
      name: '第 7 戰區', sub: '虛空深境', clear: '核心已沉默', duration: 24, interval: 0.74,
      boss: 'void', theme: 'void', event: 'combat',
      pool: [{ type: 'danmaku', w: 3 }, { type: 'orbiter', w: 2 }, { type: 'elite', w: 2.2 }, { type: 'splitter', w: 2 }],
    },
    {
      name: '第 8 戰區', sub: '蟲巢深淵', clear: '母艦崩解', duration: 24, interval: 0.64,
      boss: 'hive', mid: 'midhive', theme: 'hive', event: 'survival',
      pool: [{ type: 'splitter', w: 3 }, { type: 'scout', w: 2 }, { type: 'charger', w: 2 }, { type: 'elite', w: 2.4 }],
    },
    {
      name: '第 9 戰區', sub: '終焉星門', clear: '星門關閉了', duration: 24, interval: 0.66,
      boss: 'gate', theme: 'gate', event: 'finale',
      pool: [{ type: 'danmaku', w: 2 }, { type: 'elite', w: 2.5 }, { type: 'sniper', w: 2 }, { type: 'orbiter', w: 2 }, { type: 'miner', w: 1.5 }],
    },
  ];

  const THEMES = {
    dust: { top: '#140a22', mid: '#07060f', bot: '#07101c', neb: '#3a1468', id: 'dust' },
    rock: { top: '#1c140c', mid: '#0c0a08', bot: '#1a1008', neb: '#5a3818', id: 'rock' },
    eclipse: { top: '#16081c', mid: '#07060f', bot: '#120818', neb: '#4a1868', id: 'eclipse' },
    storm: { top: '#0a1624', mid: '#070c14', bot: '#0a1422', neb: '#1a4870', id: 'storm' },
    magma: { top: '#240c08', mid: '#140806', bot: '#3a1408', neb: '#8a2810', id: 'magma' },
    vault: { top: '#10180c', mid: '#080e08', bot: '#142414', neb: '#2a5820', id: 'vault' },
    void: { top: '#0c0618', mid: '#05040c', bot: '#0a0618', neb: '#301868', id: 'void' },
    hive: { top: '#14180a', mid: '#0c0e08', bot: '#181c0c', neb: '#4a5018', id: 'hive' },
    gate: { top: '#1c0814', mid: '#10060e', bot: '#1a0810', neb: '#701848', id: 'gate' },
  };

  function phaseSteps(list) { return list; }

  const BOSSES = {
    comet: {
      name: '赤彗哨戒艦', hp: 2200, score: 9000, xp: 80, hitR: 34, look: 'comet', move: 'sine',
      phases: [
        { at: 1, amp: 96, freq: 0.85, steps: phaseSteps([
          { t: 0.82, k: 'aim', n: 3, sp: 170, c: '#ff4fd8', spr: 0.16 },
          { t: 1.6, k: 'ring', n: 12, sp: 116, c: '#ff7a3c', gap: 0.55 },
        ]) },
        { at: 0.5, amp: 124, freq: 1.3, steps: phaseSteps([
          { t: 0.1, k: 'spiral', n: 2, sp: 148, c: '#ff3355', c2: '#ffe14a' },
          { t: 1.05, k: 'aim', n: 4, sp: 200, c: '#ff4fd8', spr: 0.12 },
          { t: 4.2, k: 'summon', type: 'scout', n: 2 },
        ]) },
      ],
    },
    midrock: {
      name: '碎星幼體', hp: 900, score: 2800, xp: 36, hitR: 26, look: 'rock', move: 'sine',
      phases: [{ at: 1, amp: 70, freq: 1.1, steps: [
        { t: 0.9, k: 'lob', n: 5, sp: 120, c: '#c8a070', accel: 70 },
        { t: 1.5, k: 'ring', n: 8, sp: 100, c: '#ff7a3c', gap: 0.7 },
      ] }],
    },
    meteor: {
      name: '碎星獸', hp: 2800, score: 11000, xp: 90, hitR: 36, look: 'rock', move: 'drift',
      phases: [
        { at: 1, amp: 80, freq: 0.7, steps: [
          { t: 0.85, k: 'lob', n: 6, sp: 110, c: '#d2b48c', accel: 90 },
          { t: 1.7, k: 'summon', type: 'miner', n: 1 },
        ] },
        { at: 0.55, amp: 110, freq: 1, steps: [
          { t: 0.7, k: 'ring', n: 14, sp: 130, c: '#ff7a3c', gap: 0.42 },
          { t: 1.15, k: 'lob', n: 4, sp: 140, c: '#ffe14a', accel: 110 },
          { t: 3.2, k: 'summon', type: 'charger', n: 2 },
        ] },
      ],
    },
    eclipse: {
      name: '月蝕母艦', hp: 3200, score: 14000, xp: 100, hitR: 38, look: 'eclipse', move: 'sine',
      phases: [
        { at: 1, amp: 100, freq: 0.7, steps: [
          { t: 0.14, k: 'wall', sp: 126, c: '#c77dff', gapW: 46 },
        ] },
        { at: 0.66, amp: 110, freq: 0.9, steps: [
          { t: 0.08, k: 'spiral', n: 3, sp: 146, c: '#ff4fd8', c2: '#7af0ff' },
          { t: 1.25, k: 'aim', n: 4, sp: 190, c: '#ffe14a', spr: 0.2 },
        ] },
        { at: 0.33, amp: 130, freq: 1.15, steps: [
          { t: 0.7, k: 'ring', n: 16, sp: 96, c: '#b388ff', gap: 0.4, accel: 26 },
          { t: 1.15, k: 'ring', n: 12, sp: 200, c: '#ff4fd8' },
          { t: 1.35, k: 'aim', n: 5, sp: 220, c: '#ffe14a', spr: 0.1 },
        ] },
      ],
    },
    midstorm: {
      name: '雷雲尖兵', hp: 980, score: 3000, xp: 40, hitR: 24, look: 'storm', move: 'sine',
      phases: [{ at: 1, amp: 100, freq: 1.2, steps: [
        { t: 1.1, k: 'bolt' },
        { t: 0.8, k: 'aim', n: 3, sp: 200, c: '#7af0ff', spr: 0.2 },
      ] }],
    },
    storm: {
      name: '雷鳴巡洋艦', hp: 3600, score: 16000, xp: 110, hitR: 34, look: 'storm', move: 'figure',
      phases: [
        { at: 1, amp: 110, freq: 0.85, steps: [
          { t: 1.35, k: 'bolt' },
          { t: 0.7, k: 'aim', n: 2, sp: 230, c: '#9ad7ff', spr: 0.08 },
        ] },
        { at: 0.5, amp: 120, freq: 1.15, steps: [
          { t: 0.95, k: 'bolt' },
          { t: 0.12, k: 'spiral', n: 2, sp: 160, c: '#5ce1ff', c2: '#ffe14a', curve: 0.8 },
          { t: 1.6, k: 'ring', n: 18, sp: 140, c: '#7af0ff', gap: 0.36 },
        ] },
      ],
    },
    midmagma: {
      name: '熔岩哨衛', hp: 1100, score: 3200, xp: 42, hitR: 26, look: 'magma', move: 'drift',
      phases: [{ at: 1, amp: 60, freq: 0.8, steps: [
        { t: 0.9, k: 'ring', n: 10, sp: 110, c: '#ff7a3c', gap: 0.6 },
        { t: 1.3, k: 'lob', n: 4, sp: 100, c: '#ff3355', accel: 80 },
      ] }],
    },
    magma: {
      name: '熔核巨像', hp: 4000, score: 18000, xp: 120, hitR: 40, look: 'magma', move: 'drift',
      phases: [
        { at: 1, amp: 70, freq: 0.55, bob: 8, steps: [
          { t: 1.1, k: 'ring', n: 10, sp: 90, c: '#ff7a3c', gap: 0.7, accel: 40 },
          { t: 1.4, k: 'summon', type: 'miner', n: 1 },
        ] },
        { at: 0.6, amp: 90, freq: 0.8, steps: [
          { t: 0.55, k: 'wall', sp: 100, c: '#ff3355', gapW: 54 },
          { t: 1.2, k: 'aim', n: 5, sp: 180, c: '#ffe14a', spr: 0.18 },
        ] },
        { at: 0.3, amp: 120, freq: 1.05, steps: [
          { t: 0.4, k: 'lob', n: 7, sp: 130, c: '#ff7a3c', accel: 120 },
          { t: 0.9, k: 'ring', n: 20, sp: 150, c: '#ff3355', gap: 0.28 },
        ] },
      ],
    },
    vault: {
      name: '寶庫哨兵', hp: 1600, score: 8000, xp: 140, hitR: 30, look: 'vault', move: 'sine',
      phases: [
        { at: 1, amp: 80, freq: 0.6, steps: [
          { t: 1.1, k: 'ring', n: 10, sp: 90, c: '#ffe14a', gap: 0.85 },
          { t: 1.6, k: 'aim', n: 1, sp: 150, c: '#fff6c2' },
        ] },
        { at: 0.45, amp: 100, freq: 0.9, steps: [
          { t: 0.8, k: 'ring', n: 14, sp: 120, c: '#3dff9a', gap: 0.55 },
          { t: 2.2, k: 'summon', type: 'scout', n: 3 },
        ] },
      ],
    },
    void: {
      name: '虛空核心', hp: 4800, score: 22000, xp: 130, hitR: 32, look: 'void', move: 'figure',
      phases: [
        { at: 1, amp: 100, freq: 0.8, steps: [
          { t: 0.95, k: 'ring', n: 16, sp: 118, c: '#5ce1ff' },
          { t: 0.95, k: 'ring', n: 10, sp: 78, c: '#ff4fd8', accel: 22 },
          { t: 1.5, k: 'aim', n: 3, sp: 176, c: '#ffe14a', spr: 0.22 },
        ] },
        { at: 0.62, amp: 118, freq: 1, steps: [
          { t: 0.1, k: 'spiral', n: 3, sp: 148, c: '#5ce1ff', c2: '#ff4fd8', curve: 1.2 },
          { t: 1.7, k: 'ring', n: 18, sp: 110, c: '#b388ff', gap: 0.4 },
        ] },
        { at: 0.32, amp: 120, freq: 1.2, steps: [
          { t: 0.08, k: 'spiral', n: 2, sp: 156, c: '#ff3355', c2: '#5ce1ff' },
          { t: 0.85, k: 'aim', n: 5, sp: 210, c: '#ffe14a', spr: 0.11 },
          { t: 1.3, k: 'ring', n: 20, sp: 132, c: '#ff4fd8', gap: 0.32 },
        ] },
      ],
    },
    midhive: {
      name: '蟲群先鋒', hp: 1200, score: 3400, xp: 44, hitR: 24, look: 'hive', move: 'sine',
      phases: [{ at: 1, amp: 130, freq: 1.3, steps: [
        { t: 0.55, k: 'aim', n: 4, sp: 170, c: '#c6e05a', spr: 0.25 },
        { t: 2.4, k: 'summon', type: 'splitter', n: 2 },
      ] }],
    },
    hive: {
      name: '蟲巢母艦', hp: 5200, score: 24000, xp: 140, hitR: 40, look: 'hive', move: 'drift',
      phases: [
        { at: 1, amp: 90, freq: 0.6, steps: [
          { t: 2.1, k: 'summon', type: 'splitter', n: 2 },
          { t: 0.9, k: 'ring', n: 12, sp: 120, c: '#d6e35a', gap: 0.5 },
        ] },
        { at: 0.55, amp: 120, freq: 0.95, steps: [
          { t: 1.4, k: 'summon', type: 'charger', n: 2 },
          { t: 0.16, k: 'spiral', n: 4, sp: 140, c: '#e6ff6a', c2: '#ff7a3c' },
          { t: 1.1, k: 'aim', n: 6, sp: 190, c: '#ffe14a', spr: 0.16 },
        ] },
      ],
    },
    gate: {
      name: '星門守護者', hp: 6400, score: 30000, xp: 160, hitR: 36, look: 'gate', move: 'figure',
      phases: [
        { at: 1, amp: 100, freq: 0.75, steps: [
          { t: 1.05, k: 'ring', n: 18, sp: 120, c: '#ff4fd8', gap: 0.48 },
          { t: 0.9, k: 'aim', n: 3, sp: 180, c: '#ffe14a', spr: 0.16 },
        ] },
        { at: 0.66, amp: 120, freq: 1, steps: [
          { t: 0.16, k: 'wall', sp: 140, c: '#c77dff', gapW: 40 },
          { t: 0.1, k: 'spiral', n: 3, sp: 150, c: '#5ce1ff', c2: '#ff4fd8', curve: 0.6 },
        ] },
        { at: 0.33, amp: 130, freq: 1.25, steps: [
          { t: 0.85, k: 'bolt' },
          { t: 0.7, k: 'aim', n: 6, sp: 230, c: '#ffe14a', spr: 0.1 },
          { t: 1.05, k: 'ring', n: 22, sp: 150, c: '#ff3355', gap: 0.26 },
          { t: 3.5, k: 'summon', type: 'elite', n: 1 },
        ] },
      ],
    },
  };

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
      unlock: '向前方射出三發窄扇形彈。',
      up: [
        '變成五發寬扇形，兩側能掃到偏離航道的敵機。',
        '扇形再加兩發向後的尾彈，貼身敵機也會吃到。',
        '七發主砲，中央兩發可以貫穿。',
        '主砲貫穿，並在左右鎖定最近的敵機補一發。',
      ],
    },
    laser: {
      name: '貫穿雷射',
      unlock: '射出貫穿所有敵機的細雷射，要站在正下方。',
      up: [
        '光束變粗，掃到的範圍變寬。',
        '主光束兩側多出兩道細火花，稍微偏一點也打得到。',
        '光束會脈衝縮放，尖峰時傷害更高。',
        '分成左右兩道主光束，覆蓋一條帶狀航道。',
      ],
    },
    missile: {
      name: '追蹤飛彈',
      unlock: '發射一枚會轉彎追向敵機的飛彈。',
      up: [
        '一次兩枚，左右分開去追不同目標。',
        '轉彎大幅變快，蛇行的敵機也甩不掉。',
        '一次三枚。',
        '命中後爆開，波及旁邊的敵機。',
      ],
    },
    wave: {
      name: '穿透波動',
      unlock: '發射一道緩慢、寬大、可貫穿的能量波。',
      up: [
        '波動變大，比較不容易打偏。',
        '一次兩道波動，前後交錯。',
        '波動會在途中再放出一圈小火花。',
        '三道大波動，並且每道都會再炸一次。',
      ],
    },
    orbit: {
      name: '環刃',
      unlock: '兩把短刃繞著機體轉，碰到敵機就切。',
      up: [
        '增加成三把刃。',
        '短刃開始朝外噴射小彈。',
        '四把刃，轉得更快、圈也更大。',
        '刃會短暫追向附近敵機再回到軌道。',
      ],
    },
    rail: {
      name: '穿甲彈',
      unlock: '發射一發又慢又粗、可貫穿整列敵機的穿甲彈。',
      up: [
        '穿甲彈變快。',
        '命中時會小爆炸，打到旁邊的敵機。',
        '一次兩發，左右錯開。',
        '穿甲彈留下一條短暫的高傷軌跡。',
      ],
    },
  };

  const EVOLUTIONS = [
    { id: 'spread', need: 'dmg', rank: 3, name: '星爆彈', desc: '擴散彈與火力共鳴：每次射擊額外炸出一圈星光。' },
    { id: 'laser', need: 'rate', rank: 3, name: '折光雷', desc: '貫穿雷射會折出一道追蹤副光束。' },
    { id: 'missile', need: 'drone', rank: 1, name: '蜂群飛彈', desc: '需要浮游砲。追蹤飛彈分裂成一小群。' },
    { id: 'wave', need: 'magnet', rank: 2, name: '引力波', desc: '穿透波動會把經驗結晶吸過來，並加重傷害。' },
    { id: 'orbit', need: 'speed', rank: 2, name: '劍陣', desc: '環刃加速擴張，刃數變多，幾乎圍住機體。' },
    { id: 'rail', need: 'dmg', rank: 4, name: '殲滅砲', desc: '火力夠高時，穿甲彈會留下一道毀滅軌跡。' },
  ];

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
  const bombBtn = document.getElementById('btn-bomb');

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
  let pickups = [];
  let hazards = [];
  let zones = [];
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
  function dmgNow() { return player.dmgMul * (player.buffs && player.buffs.power > 0 ? 1.65 : 1); }
  function rateNow() { return player.rateMul * (player.buffs && player.buffs.rapid > 0 ? 0.62 : 1); }
  function currentStage() {
    return director && STAGES[director.stage] ? STAGES[director.stage] : null;
  }
  function currentTheme() {
    const stage = (state === 'title' || state === 'help' || state === 'difficulty') ? null : currentStage();
    return (stage && THEMES[stage.theme]) || THEMES.dust;
  }
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
    pickups = [];
    hazards = [];
    zones = [];
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
      weapons: { spread: 1, laser: 0, missile: 0, wave: 0, orbit: 0, rail: 0 },
      evolved: { spread: false, laser: false, missile: false, wave: false, orbit: false, rail: false },
      cd: { spread: 0.1, laser: 0, missile: 0.3, wave: 0.4, drone: 0.2, orbit: 0.2, rail: 0.4 },
      ranks: { dmg: 0, rate: 0, speed: 0, drone: 0, magnet: 0, crit: 0, xp: 0, graze: 0, iframe: 0 },
      bombs: 1,
      bombMax: 3,
      buffs: { rapid: 0, power: 0, magnet: 0 },
      xpMul: 1,
      crit: 0,
      grazeXp: 0,
      iframeBonus: 0,
      bladeAng: 0,
      blades: [],
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
    const stage = currentStage();
    const type = !stage || director.stage === 0 ? 'scout' : (stage.event === 'hive' || stage.event === 'survival' ? 'splitter' : 'waver');
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
      case 'charger':
        if (e.state === 'enter') {
          e.y += 70 * dt;
          if (e.y > 80) { e.state = 'wind'; e.aimT = 0; }
        } else if (e.state === 'wind') {
          e.aimT += dt;
          if (e.aimT > 0.42) {
            const ang = Math.atan2(player.y - e.y, player.x - e.x);
            e.dashVx = Math.cos(ang) * 280;
            e.dashVy = Math.sin(ang) * 280;
            e.state = 'dash';
            e.aimT = 0.5;
          }
        } else if (e.state === 'dash') {
          e.x += e.dashVx * dt;
          e.y += e.dashVy * dt;
          e.aimT -= dt;
          if (e.aimT <= 0) e.state = 'leave';
        }
        if (e.y > H + 20 || e.x < -30 || e.x > W + 30) e.dead = true;
        break;
      case 'miner':
        e.y += 52 * dt;
        e.x = clamp(e.originX + Math.sin(e.t * 1.4) * 36, 20, W - 20);
        if (e.y > H + 20) e.dead = true;
        e.shootT -= dt;
        if (e.shootT <= 0 && e.y > 30 && e.y < H - 60) {
          e.shootT = iv(1.35);
          hazards.push({ kind: 'mine', x: e.x, y: e.y + 8, t: 0, warn: 0.75, r: 8 });
        }
        break;
      case 'orbiter':
        if (e.y < e.ty) e.y += 80 * dt;
        e.angle += dt * 1.8;
        e.x = clamp(e.originX + Math.cos(e.angle) * 54, 24, W - 24);
        e.shootT -= dt;
        if (e.shootT <= 0 && e.y > 24) {
          e.shootT = iv(0.42);
          const tang = e.angle + Math.PI / 2;
          shootDir(e.x, e.y, tang, bSpeed(150), '#5ce1ff', 3.1);
          if (diff.id !== 'easy') shootDir(e.x, e.y, tang + Math.PI, bSpeed(130), '#7af0ff', 3);
        }
        if (e.age > e.maxAge) e.state = 'leave';
        break;
      case 'splitter':
        e.y += 96 * dt;
        e.x = clamp(e.x + Math.sin(e.t * 3 + e.id) * 36 * dt, 16, W - 16);
        if (e.y > H + 24) e.dead = true;
        e.shootT -= dt;
        if (e.shootT <= 0 && e.y > 16 && e.y < H - 70) {
          e.shootT = iv(1.15);
          aimedFan(e.x, e.y, diff.id === 'hard' ? 3 : 2, 0.22, bSpeed(160), '#ff4fd8', 3.2);
        }
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
    enemies = enemies.filter((e) => e && !e.dead && e.x > -70 && e.x < W + 70 && e.y > -120 && e.y < H + 80);
  }

  function phaseIndexOf(def, ratio) {
    let idx = 0;
    const ps = def.phases;
    for (let i = 0; i < ps.length; i++) if (ratio <= ps[i].at) idx = i;
    return idx;
  }

  function startBoss(kind, mini) {
    const def = BOSSES[kind];
    if (!def) return;
    if (!mini) enemies.length = 0;
    const hp = def.hp * diff.hp * (mini ? 0.4 : 1);
    boss = {
      id: 'boss',
      isBoss: true,
      mini: !!mini,
      kind: kind,
      name: def.name,
      look: def.look,
      def: def,
      x: W / 2,
      y: -54,
      homeY: mini ? 156 : 112,
      hitR: mini ? Math.round(def.hitR * 0.75) : def.hitR,
      r: def.hitR,
      hp: hp,
      maxHp: hp,
      score: Math.round(def.score * (mini ? 0.35 : 1)),
      xp: Math.round(def.xp * (mini ? 0.45 : 1)),
      phase: 1,
      t: 0,
      angle: Math.random() * Math.PI * 2,
      entering: true,
      grace: 0,
      flash: 0,
      dead: false,
      timers: {},
    };
    if (mini) announce('精英接近', def.name, 1.15);
  }

  function updateBoss(dt) {
    if (!boss || boss.dead) return;
    const b = boss;
    b.t += dt;
    if (b.flash > 0) b.flash -= dt;
    if (b.entering) {
      b.y += 78 * dt;
      if (b.y >= b.homeY) {
        b.y = b.homeY;
        b.entering = false;
        if (!b.mini) eBullets.length = 0;
      }
      return;
    }
    const ph = b.def.phases[Math.max(0, b.phase - 1)] || b.def.phases[0];
    const freq = ph.freq || 0.8;
    const amp = ph.amp || 90;
    if (b.def.move === 'figure') {
      b.x = W / 2 + Math.sin(b.t * freq) * amp;
      b.y = b.homeY + Math.sin(b.t * freq * 2) * 26;
    } else if (b.def.move === 'drift') {
      b.x = W / 2 + Math.sin(b.t * freq * 0.65) * (amp + 16);
      b.y = b.homeY + Math.cos(b.t * 0.7) * 16;
    } else {
      b.x = W / 2 + Math.sin(b.t * freq) * amp;
      b.y = b.homeY + Math.sin(b.t * 1.3) * (ph.bob || 12);
    }
    b.x = clamp(b.x, 46, W - 46);
    if (b.grace > 0) {
      b.grace -= dt;
      return;
    }
    const steps = ph.steps || [];
    for (let i = 0; i < steps.length; i++) runBossStep(b, steps[i], i, dt);
  }

  function runBossStep(b, step, i, dt) {
    every(b.timers, 's' + b.phase + '_' + i, iv(step.t || 1), dt, () => {
      const col = step.c || '#ff4fd8';
      const sp = bSpeed(step.sp || 140);
      const n = scaledCount(step.n || 1);
      if (step.k === 'aim') {
        aimedFan(b.x, b.y + 12, Math.max(1, n), step.spr || 0.14, sp, col, step.r || 3.3);
      } else if (step.k === 'ring') {
        const extra = step.gap ? gapAtPlayer(b.x, b.y, step.gap, step.gapChance == null ? 0.8 : step.gapChance) : {};
        if (step.accel) extra.accel = step.accel;
        ring(b.x, b.y, Math.max(1, n), sp, b.angle, col, step.r || 3.3, extra);
        b.angle += step.spin || 0.35;
      } else if (step.k === 'spiral') {
        const count = step.n || 2;
        for (let k = 0; k < count; k++) {
          shootDir(b.x, b.y, b.angle + (k * Math.PI * 2) / count, sp, k % 2 ? (step.c2 || col) : col, 3.2, { spin: step.curve || 0 });
        }
        b.angle += 0.42;
      } else if (step.k === 'wall') {
        const gapW = diff.id === 'hard' ? (step.gapW || 34) : diff.id === 'easy' ? (step.gapW || 46) + 18 : (step.gapW || 44);
        const gapX = W / 2 + Math.sin(b.t * 0.85) * 100;
        const spacing = diff.id === 'hard' ? 16 : diff.id === 'easy' ? 26 : 20;
        for (let x = 14; x < W; x += spacing) {
          if (Math.abs(x - gapX) < gapW) continue;
          shootDir(x, b.y + 24, Math.PI / 2, sp, col, 3.2);
        }
      } else if (step.k === 'bolt') {
        hazards.push({
          kind: 'bolt',
          x: clamp((player ? player.x : W / 2) + rand(-46, 46), 24, W - 24),
          warn: 0.62,
          life: 0.42,
          w: diff.id === 'hard' ? 26 : 16,
          active: false,
          t: 0,
        });
      } else if (step.k === 'summon') {
        const cnt = step.n || 2;
        for (let k = 0; k < cnt; k++) spawnEnemy(step.type || 'scout', b.x + (k - (cnt - 1) / 2) * 34, b.y + 12);
      } else if (step.k === 'lob') {
        const cnt = Math.max(2, n);
        for (let k = 0; k < cnt; k++) {
          const a = Math.PI * 0.15 + (k / (cnt - 1)) * Math.PI * 0.7;
          shootDir(b.x, b.y + 8, a, sp * 0.55, col, 4.4, { accel: step.accel || 80, life: 6.2 });
        }
      }
    });
  }

  function refreshBossPhase() {
    if (!boss || boss.dead || !boss.def) return;
    const next = phaseIndexOf(boss.def, boss.hp / boss.maxHp) + 1;
    if (next === boss.phase) return;
    boss.phase = next;
    boss.grace = boss.mini ? 0.35 : 1.0;
    boss.timers = {};
    addShake(8);
    audio.phase();
    spark(boss.x, boss.y, '#ffe14a', 22, 170, 0.45);
    if (!boss.mini && next > 1) announce('第 ' + next + ' 形態', boss.name, 1.2);
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
    const bonus = currentStage() && currentStage().event === 'bonus' ? 2 : 1;
    for (let i = 0; i < n; i++) {
      gems.push({
        x: e.x + rand(-10, 10),
        y: e.y + rand(-8, 8),
        xp: Math.max(1, Math.round(e.xp * bonus / n)),
        t: Math.random() * 0.4,
        dead: false,
        bob: Math.random() * Math.PI * 2,
      });
    }
    if (e.type === 'splitter') {
      spawnEnemy('scout', e.x - 14, e.y);
      spawnEnemy('scout', e.x + 14, e.y);
    }
    maybeDrop(e.x, e.y, e.type === 'elite' || e.type === 'danmaku');
  }

  function maybeDrop(x, y, juicy) {
    const stage = currentStage();
    const bonus = stage && stage.event === 'bonus';
    const chance = juicy ? 0.42 : bonus ? 0.28 : 0.08;
    if (Math.random() > chance) return;
    const kinds = ['bomb', 'rapid', 'power', 'magnet'];
    pickups.push({
      kind: kinds[Math.floor(Math.random() * kinds.length)],
      x: x, y: y, t: 0, vy: 26,
    });
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
    announce(b.mini ? '精英擊破' : '擊破', b.name, 1.15);
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

  function shotDmg(base) {
    let d = base * dmgNow();
    if (player.crit > 0 && Math.random() < player.crit) d *= 2;
    return d;
  }

  function pushPellet(x, y, a, spd, dmg, pierce, tiny) {
    pBullets.push({
      x: x, y: y,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      r: tiny ? 2.4 : 3.2,
      dmg: dmg,
      pierce: pierce || 0,
      life: 1.4,
      hit: new Set(),
      tiny: !!tiny,
    });
  }

  function fireWeapons(dt) {
    fireSpread(dt);
    fireLaser(dt);
    fireMissile(dt);
    fireWave(dt);
    fireOrbit(dt);
    fireRail(dt);
    fireDrones(dt);
    if (player.buffs.rapid > 0) player.buffs.rapid -= dt;
    if (player.buffs.power > 0) player.buffs.power -= dt;
    if (player.buffs.magnet > 0) player.buffs.magnet -= dt;
  }

  function fireSpread(dt) {
    const lv = player.weapons.spread;
    if (!lv) return;
    player.cd.spread -= dt;
    const interval = Math.max(0.05, SPREAD_IV[lv - 1] * rateNow());
    if (player.cd.spread > 0) return;
    player.cd.spread = interval;
    const patterns = [
      { n: 3, arc: 0.28, back: 0 },
      { n: 5, arc: 0.5, back: 0 },
      { n: 5, arc: 0.55, back: 2 },
      { n: 7, arc: 0.7, back: 2 },
      { n: 5, arc: 0.48, back: 0 },
    ];
    const pat = patterns[lv - 1];
    const dmg = shotDmg(SPREAD_DMG[lv - 1]);
    const spd = SPREAD_SPD[lv - 1];
    const pierce = lv >= 4 ? 1 : 0;
    for (let i = 0; i < pat.n; i++) {
      const a = -Math.PI / 2 + (i - (pat.n - 1) / 2) * (pat.arc / (pat.n - 1));
      pushPellet(player.x, player.y - 14, a, spd, dmg, pierce, false);
    }
    for (let i = 0; i < pat.back; i++) {
      const a = Math.PI / 2 + (i - (pat.back - 1) / 2) * 0.5;
      pushPellet(player.x, player.y + 8, a, spd * 0.75, dmg * 0.6, 0, true);
    }
    if (lv >= 5) {
      const target = nearestEnemy(player.x, player.y);
      if (target) {
        const a = Math.atan2(target.y - player.y, target.x - player.x);
        pushPellet(player.x - 10, player.y, a, spd, dmg, 0, true);
        pushPellet(player.x + 10, player.y, a, spd, dmg, 0, true);
      }
    }
    if (player.evolved.spread) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        pushPellet(player.x, player.y, a, 280, dmg * 0.45, 0, true);
      }
    }
    audio.shoot();
  }

  function laserBeams() {
    const lv = player.weapons.laser;
    const half = LASER_HALF[Math.max(0, lv - 1)] * (player.evolved.laser ? 0.8 : 1);
    const pulse = lv >= 4 ? (0.75 + (Math.sin(player.time * 18) * 0.5 + 0.5) * 0.55) : 1;
    if (player.evolved.laser || lv >= 5) {
      return [
        { x: player.x - 10, half: half * 0.85 * pulse },
        { x: player.x + 10, half: half * 0.85 * pulse },
      ];
    }
    if (lv >= 3) {
      return [
        { x: player.x, half: half * pulse },
        { x: player.x - 18, half: 2.2 },
        { x: player.x + 18, half: 2.2 },
      ];
    }
    return [{ x: player.x, half: half * pulse }];
  }

  function fireLaser(dt) {
    const lv = player.weapons.laser;
    if (!lv) return;
    const dps = LASER_DPS[lv - 1] * dmgNow() / rateNow() * (lv >= 4 ? (0.85 + (Math.sin(player.time * 18) * 0.5 + 0.5) * 0.5) : 1);
    const beams = laserBeams();
    eachTarget((e) => {
      for (let i = 0; i < beams.length; i++) {
        const beam = beams[i];
        if (Math.abs(e.x - beam.x) < beam.half + e.hitR && e.y < player.y - 6) {
          damageTarget(e, dps * dt);
          break;
        }
      }
    });
    if (player.evolved.laser) {
      player.cd.laser -= dt;
      if (player.cd.laser <= 0) {
        player.cd.laser = 0.28;
        const target = nearestEnemy(player.x, player.y - 40);
        if (target) {
          const a = Math.atan2(target.y - (player.y - 20), target.x - player.x);
          pushPellet(player.x, player.y - 20, a, 520, shotDmg(6), 1, true);
        }
      }
    }
  }

  function fireMissile(dt) {
    const lv = player.weapons.missile;
    if (!lv) return;
    player.cd.missile -= dt;
    const interval = Math.max(0.18, MISSILE_IV[lv - 1] * rateNow());
    if (player.cd.missile > 0) return;
    player.cd.missile = interval;
    let n = [1, 2, 2, 3, 3][lv - 1];
    if (player.evolved.missile) n += 3;
    const speed = 250 + lv * 26 + (player.evolved.missile ? 40 : 0);
    const turn = (lv >= 3 ? 5.2 : 3.3) + lv * 0.35;
    for (let i = 0; i < n; i++) {
      const spread = (i - (n - 1) / 2) * (player.evolved.missile ? 0.18 : 0.28);
      const a = -Math.PI / 2 + spread;
      missiles.push({
        x: player.x + (i - (n - 1) / 2) * 7,
        y: player.y - 8,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        speed: speed,
        turn: turn,
        dmg: shotDmg(player.evolved.missile ? 8 + lv * 2 : 11 + lv * 3),
        r: player.evolved.missile ? 3 : 4,
        life: 3.1,
        aoe: lv >= 5 || player.evolved.missile ? 28 : 0,
      });
    }
    audio.missile();
  }

  function fireWave(dt) {
    const lv = player.weapons.wave;
    if (!lv) return;
    player.cd.wave -= dt;
    const interval = Math.max(0.22, WAVE_IV[lv - 1] * rateNow());
    if (player.cd.wave > 0) return;
    player.cd.wave = interval;
    const n = player.evolved.wave ? 3 : [1, 1, 2, 2, 3][lv - 1];
    for (let i = 0; i < n; i++) {
      waves.push({
        x: player.x,
        y: player.y - 18 - i * 20,
        r: (player.evolved.wave ? 26 : 18) + lv * 8,
        vy: -190 - lv * 14,
        dmg: shotDmg((player.evolved.wave ? 12 : 8) + lv * 3),
        life: 2.15,
        hit: new Set(),
        spark: lv >= 4,
        pull: !!player.evolved.wave,
      });
    }
    audio.wave();
  }

  function fireOrbit(dt) {
    const lv = player.weapons.orbit;
    player.blades = [];
    if (!lv) return;
    const evolved = player.evolved.orbit;
    const n = evolved ? 6 : [2, 3, 3, 4, 4][lv - 1];
    const rad = (evolved ? 40 : 26) + lv * 3;
    player.bladeAng += ((evolved ? 3.3 : 2.1) + lv * 0.12) * dt;
    const dmg = shotDmg(7 + lv * 2) * dt * 8;
    for (let i = 0; i < n; i++) {
      let a = player.bladeAng + (i / n) * Math.PI * 2;
      if (lv >= 5 && !evolved) {
        const target = nearestEnemy(player.x, player.y);
        if (target) {
          const want = Math.atan2(target.y - player.y, target.x - player.x);
          const da = Math.atan2(Math.sin(want - a), Math.cos(want - a));
          a += clamp(da, -0.8, 0.8) * 0.35;
        }
      }
      const x = player.x + Math.cos(a) * rad;
      const y = player.y + Math.sin(a) * rad * 0.7;
      player.blades.push({ x: x, y: y });
      eachTarget((e) => {
        const dx = e.x - x;
        const dy = e.y - y;
        if (dx * dx + dy * dy < (e.hitR + 7) * (e.hitR + 7)) damageTarget(e, dmg);
      });
    }
    if (lv >= 3) {
      player.cd.orbit -= dt;
      if (player.cd.orbit <= 0) {
        player.cd.orbit = Math.max(0.18, 0.48 * rateNow());
        for (let i = 0; i < player.blades.length; i++) {
          const blade = player.blades[i];
          const a = Math.atan2(blade.y - player.y, blade.x - player.x);
          pushPellet(blade.x, blade.y, a, 360, shotDmg(3.5), 0, true);
        }
      }
    }
  }

  function fireRail(dt) {
    const lv = player.weapons.rail;
    if (!lv) return;
    player.cd.rail -= dt;
    const interval = Math.max(0.28, (0.85 - lv * 0.08) * rateNow());
    if (player.cd.rail > 0) return;
    player.cd.rail = interval;
    const n = lv >= 4 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const ox = (i - (n - 1) / 2) * 12;
      pBullets.push({
        x: player.x + ox,
        y: player.y - 12,
        vx: ox * 2,
        vy: -340 - lv * 30,
        r: 5.2,
        dmg: shotDmg(14 + lv * 4),
        pierce: lv >= 5 || player.evolved.rail ? 12 : 6,
        life: 1.35,
        hit: new Set(),
        rail: true,
        boom: lv >= 3,
      });
    }
    if (player.evolved.rail || lv >= 5) {
      zones.push({
        x: player.x,
        life: player.evolved.rail ? 0.55 : 0.32,
        max: player.evolved.rail ? 0.55 : 0.32,
        dmg: shotDmg(18),
        hit: new Set(),
      });
    }
    audio.wave();
  }

  function fireDrones(dt) {
    if (!player.drones) return;
    player.cd.drone -= dt;
    if (player.cd.drone > 0) return;
    player.cd.drone = Math.max(0.12, 0.36 * rateNow());
    for (let i = 0; i < player.drones; i++) {
      const ang = player.time * 2.4 + i * Math.PI;
      const x = player.x + Math.cos(ang) * 26;
      const y = player.y + Math.sin(ang) * 14 + 6;
      const target = nearestEnemy(x, y);
      let a = -Math.PI / 2;
      if (target) a = Math.atan2(target.y - y, target.x - x);
      pushPellet(x, y, a, 440, shotDmg(3.3 * player.droneDmg), 0, true);
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
      if (w.spark && !w.sparked && w.life < 1.15) {
        w.sparked = true;
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          pushPellet(w.x, w.y, a, 160, w.dmg * 0.35, 0, true);
        }
      }
      if (w.pull) {
        for (let g = 0; g < gems.length; g++) {
          const gem = gems[g];
          const dx = w.x - gem.x;
          const dy = w.y - gem.y;
          if (dx * dx + dy * dy < (w.r + 30) * (w.r + 30)) gem.t += 0;
          const pd = Math.hypot(player.x - gem.x, player.y - gem.y) || 1;
          if (dx * dx + dy * dy < (w.r + 40) * (w.r + 40)) {
            gem.x += (player.x - gem.x) / pd * 220 * dt;
            gem.y += (player.y - gem.y) / pd * 220 * dt;
          }
        }
      }
    }
    waves = waves.filter((w) => w.life > 0 && w.y > -50);
    for (let i = 0; i < zones.length; i++) zones[i].life -= dt;
    zones = zones.filter((z) => z.life > 0);
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
    player.invuln = 2.25 + (player.iframeBonus || 0);
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
          if (player.grazeXp) xp += player.grazeXp;
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
          if (b.boom) {
            eachTarget((o) => {
              if (!o || o.dead || o === e) return;
              const ox = b.x - o.x;
              const oy = b.y - o.y;
              if (ox * ox + oy * oy < 34 * 34) damageTarget(o, b.dmg * 0.4);
            });
          }
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
    for (let i = 0; i < zones.length; i++) {
      const z = zones[i];
      eachTarget((e) => {
        if (e.dead || z.hit.has(e.id)) return;
        if (Math.abs(e.x - z.x) < 16 + e.hitR && e.y < player.y + 8) {
          z.hit.add(e.id);
          damageTarget(e, z.dmg);
        }
      });
    }
    for (let i = 0; i < pBullets.length; i++) {
      const b = pBullets[i];
      if (b.dead) continue;
      for (let h = 0; h < hazards.length; h++) {
        const rock = hazards[h];
        if (rock.kind !== 'rock' || rock.hp <= 0) continue;
        const dx = b.x - rock.x;
        const dy = b.y - rock.y;
        const rr = b.r + rock.r;
        if (dx * dx + dy * dy < rr * rr) {
          rock.hp -= b.dmg;
          spark(b.x, b.y, '#d2b48c', 3, 60, 0.2);
          if (rock.hp <= 0) {
            rock.dead = true;
            gems.push({ x: rock.x, y: rock.y, xp: 3, t: 0, dead: false, bob: 0 });
          }
          if (b.pierce <= 0) b.dead = true;
          else b.pierce -= 1;
          break;
        }
      }
    }
    hurtHazards();
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
      const magnet = player.magnet + (player.buffs && player.buffs.magnet > 0 ? 200 : 0);
      let sp = 48;
      g.y += Math.sin((g.bob || 0) + g.t * 5) * 10 * dt;
      if (player.alive && dist < magnet) sp = 540;
      else if (player.alive && dist < magnet + 80) sp = 190;
      g.x += (dx / dist) * sp * dt;
      g.y += (dy / dist) * sp * dt;
      if (Math.random() < 0.08) spark(g.x, g.y, '#fff6c8', 1, 24, 0.28);
      if (player.alive && dist < 18) {
        g.dead = true;
        xp += Math.max(1, Math.round(g.xp * (player.xpMul || 1)));
        audio.pickup();
        spark(player.x, player.y, '#fff6c8', 6, 70, 0.25);
      } else if (g.t > 14) g.dead = true;
    }
    gems = gems.filter((g) => !g.dead);
  }

  function updatePickups(dt) {
    if (!player) return;
    for (let i = 0; i < pickups.length; i++) {
      const p = pickups[i];
      p.t += dt;
      p.y += (p.vy || 20) * dt;
      const dx = player.x - p.x;
      const dy = player.y - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (player.alive && dist < 100) {
        p.x += (dx / dist) * 240 * dt;
        p.y += (dy / dist) * 240 * dt;
      }
      if (player.alive && dist < 16) {
        p.dead = true;
        applyPickup(p.kind);
      } else if (p.t > 11 || p.y > H + 24) p.dead = true;
    }
    pickups = pickups.filter((p) => !p.dead);
  }

  function applyPickup(kind) {
    audio.pickup();
    if (kind === 'bomb') {
      player.bombs = Math.min(player.bombMax, player.bombs + 1);
      floater(player.x, player.y - 20, '炸彈 +1', '#ffe14a');
    } else if (kind === 'rapid') {
      player.buffs.rapid = 8;
      floater(player.x, player.y - 20, '急速射擊', '#5ce1ff');
    } else if (kind === 'power') {
      player.buffs.power = 6.5;
      floater(player.x, player.y - 20, '強襲', '#ff4fd8');
    } else {
      player.buffs.magnet = 5;
      floater(player.x, player.y - 20, '磁場', '#fff6c8');
    }
    hudDirty = true;
  }

  function useBomb() {
    if (state !== 'play' || !player || !player.alive || player.bombs <= 0) return;
    player.bombs -= 1;
    hudDirty = true;
    const victims = enemies.slice();
    if (boss && !boss.dead) victims.push(boss);
    eBullets.length = 0;
    for (let i = 0; i < victims.length; i++) {
      const e = victims[i];
      if (!e || e.dead) continue;
      damageTarget(e, e.isBoss ? 420 * dmgNow() : e.hp + 50);
    }
    hazards = hazards.filter((h) => h.kind === 'pillar' && false);
    flash = 0.6;
    addShake(12);
    audio.explode(true);
    spark(player.x, player.y, '#ffe14a', 30, 220, 0.45);
    floater(player.x, player.y - 28, '炸彈', '#ffe14a');
  }

  function updateHazards(dt) {
    const stage = currentStage();
    if (stage && director && (director.mode === 'spawn' || director.mode === 'boss')) {
      if (stage.event === 'asteroid' || stage.event === 'finale') {
        director.rockT -= dt;
        if (director.rockT <= 0) {
          director.rockT = iv(stage.event === 'finale' ? 1.15 : 0.7);
          hazards.push({
            kind: 'rock',
            x: rand(18, W - 18),
            y: -16,
            vy: bSpeed(78 + Math.random() * 80),
            vx: rand(-24, 24),
            r: 9 + Math.random() * 7,
            hp: 16 * diff.hp,
            hitR: 12,
          });
        }
      }
      if (stage.event === 'terrain') {
        director.pillarT -= dt;
        if (director.pillarT <= 0) {
          director.pillarT = diff.id === 'hard' ? 1.2 : 1.65;
          const gap = diff.id === 'hard' ? 76 : diff.id === 'easy' ? 130 : 102;
          const gapX = rand(56, W - 56);
          hazards.push({ kind: 'pillar', x: 0, y: -20, w: Math.max(10, gapX - gap / 2), h: 20, vy: 76 });
          const right = gapX + gap / 2;
          hazards.push({ kind: 'pillar', x: right, y: -20, w: Math.max(10, W - right), h: 20, vy: 76 });
        }
      }
      if (stage.event === 'storm' || (stage.event === 'finale' && director.time > 6)) {
        director.boltT -= dt;
        if (director.boltT <= 0) {
          director.boltT = iv(stage.event === 'finale' ? 2.2 : 1.5);
          hazards.push({
            kind: 'bolt',
            x: clamp((player ? player.x : W / 2) + rand(-36, 36), 22, W - 22),
            warn: 0.7,
            life: 0.36,
            w: diff.id === 'hard' ? 24 : 16,
            active: false,
            t: 0,
          });
        }
      }
      if (stage.event === 'bonus' && director.mode === 'spawn') {
        director.gemT -= dt;
        if (director.gemT <= 0) {
          director.gemT = 0.8;
          gems.push({ x: rand(28, W - 28), y: -8, xp: 4, t: 0, dead: false, bob: Math.random() * 6 });
        }
      }
    }
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      if (h.kind === 'rock') {
        h.y += h.vy * dt;
        h.x += h.vx * dt;
        if (h.y > H + 24 || h.hp <= 0) h.dead = true;
      } else if (h.kind === 'pillar') {
        h.y += h.vy * dt;
        if (h.y > H + 16) h.dead = true;
      } else if (h.kind === 'bolt') {
        h.t += dt;
        if (!h.active && h.t >= h.warn) h.active = true;
        if (h.active) {
          h.life -= dt;
          if (h.life <= 0) h.dead = true;
        }
      } else if (h.kind === 'mine') {
        h.t += dt;
        if (!h.blew && h.t >= h.warn) {
          h.blew = true;
          h.dead = true;
          ring(h.x, h.y, scaledCount(diff.id === 'easy' ? 8 : 11), bSpeed(118), Math.random() * 3, '#ff7a3c', 3.2);
          spark(h.x, h.y, '#ff7a3c', 8, 90, 0.25);
        }
      }
    }
    hazards = hazards.filter((h) => !h.dead);
  }

  function hurtHazards() {
    if (!player || !player.alive || player.invuln > 0 || state !== 'play') return;
    const stage = currentStage();
    if (stage && (stage.event === 'terrain' || stage.theme === 'magma') && player.y > H - 32) hurt();
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      if (!player.alive || player.invuln > 0) return;
      if (h.kind === 'rock') {
        const dx = h.x - player.x;
        const dy = h.y - player.y;
        if (dx * dx + dy * dy < (h.hitR + HIT_R) * (h.hitR + HIT_R)) hurt();
      } else if (h.kind === 'pillar') {
        if (player.x > h.x && player.x < h.x + h.w && Math.abs(player.y - (h.y + h.h * 0.5)) < h.h * 0.7 + 4) hurt();
      } else if (h.kind === 'bolt' && h.active && Math.abs(player.x - h.x) < h.w * 0.5 + HIT_R) hurt();
    }
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
    director.midDone = false;
    director.rockT = 0.6;
    director.pillarT = 1.1;
    director.boltT = 1.3;
    director.gemT = 0.8;
    hazards = hazards.filter(() => false);
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
        let interval = stage.interval * diff.spawn * Math.max(0.48, ramp);
        if (stage.event === 'survival') interval *= Math.max(0.42, 1 - (director.time / stage.duration) * 0.55);
        director.spawnT = interval;
        spawnFromPool(stage);
      }
      if (stage.mid && !director.midDone && director.time > stage.duration * 0.42 && !boss) {
        director.midDone = true;
        startBoss(stage.mid, true);
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
    updateHazards(dt);
    if (state === 'play' && player && player.alive) fireWeapons(dt);
    updateProjectiles(dt);
    collide();
    updateGems(dt);
    updatePickups(dt);
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
    const theme = currentTheme();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, theme.top);
    g.addColorStop(0.5, theme.mid);
    g.addColorStop(1, theme.bot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = theme.neb;
    for (let i = 0; i < nebulas.length; i++) {
      const n = nebulas[i];
      ctx.beginPath();
      ctx.ellipse(n.x, n.y, n.rx, n.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (theme.id === 'rock' || theme.id === 'gate') {
      ctx.fillStyle = theme.id === 'gate' ? '#3a1028' : '#2a2118';
      for (let i = 0; i < 5; i++) {
        const y = ((clock * (18 + i * 7) + i * 90) % (H + 40)) - 20;
        const x = 30 + ((i * 67) % (W - 60));
        ctx.fillRect(x, y, 14 + (i % 3) * 6, 8 + (i % 2) * 4);
      }
    }
    if (theme.id === 'magma') {
      ctx.fillStyle = 'rgba(255, 90, 20, 0.45)';
      ctx.fillRect(0, H - 26, W, 26);
      ctx.fillStyle = '#ffd56a';
      ctx.fillRect(0, H - 26, W, 3);
    }
    if (theme.id === 'storm' && Math.sin(clock * 9) > 0.93) {
      ctx.fillStyle = 'rgba(170, 220, 255, 0.16)';
      ctx.fillRect(0, 0, W, H);
    }
    if (theme.id === 'vault') {
      ctx.fillStyle = 'rgba(255, 225, 120, 0.35)';
      for (let i = 0; i < 6; i++) {
        const y = ((clock * 40 + i * 70) % (H + 20)) - 10;
        ctx.fillRect(20 + i * 54, y, 2, 18);
      }
    }
    if (theme.id === 'hive') {
      ctx.strokeStyle = 'rgba(210, 220, 80, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        ctx.strokeRect(16 + i * 80, ((clock * 20 + i * 40) % H), 36, 24);
      }
    }
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = theme.id === 'vault' ? '#fff2c4' : theme.id === 'storm' ? '#d7f3ff' : s.c;
      ctx.globalAlpha = 0.35 + s.z * 0.65;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }

  function drawCrystal(x, y, t) {
    const bob = Math.sin(t * 6) * 2;
    const pulse = 1 + Math.sin(t * 8) * 0.12;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(t * 1.6);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#fff6c8';
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(4, -3);
    ctx.lineTo(11, 0);
    ctx.lineTo(4, 3);
    ctx.lineTo(0, 11);
    ctx.lineTo(-4, 3);
    ctx.lineTo(-11, 0);
    ctx.lineTo(-4, -3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7ef0ff';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -6, 2, 2);
    ctx.restore();
    const s1 = t * 5;
    ctx.fillStyle = '#fff6c8';
    ctx.fillRect(x + Math.cos(s1) * 14 - 1, y + Math.sin(s1) * 14 - 1, 2, 2);
    ctx.fillRect(x + Math.cos(s1 + 2) * 12 - 1, y + Math.sin(s1 + 2) * 12 - 1, 2, 2);
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
    const look = b.look || b.kind;
    if (look === 'comet') {
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
    } else if (look === 'rock') {
      ctx.fillStyle = flashOn ? '#fff' : '#6a5344';
      ctx.beginPath();
      ctx.arc(x, y, b.mini ? 18 : 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d2b48c';
      ctx.fillRect(x - 10, y - 6, 8, 6);
      ctx.fillRect(x + 4, y + 2, 7, 5);
      ctx.fillStyle = '#ff7a3c';
      ctx.fillRect(x - 4, y - 4, 8, 8);
    } else if (look === 'eclipse') {
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
    } else if (look === 'storm') {
      ctx.fillStyle = flashOn ? '#fff' : '#16324a';
      ctx.fillRect(x - 40, y - 10, 80, 20);
      ctx.fillStyle = '#7af0ff';
      ctx.fillRect(x - 6, y - 22, 4, 36);
      ctx.fillRect(x + 8, y - 16, 3, 28);
      ctx.fillStyle = '#ffe14a';
      ctx.fillRect(x - 3, y - 3, 6, 6);
    } else if (look === 'magma') {
      ctx.fillStyle = flashOn ? '#fff' : '#5a140c';
      ctx.fillRect(x - 36, y - 16, 72, 32);
      ctx.fillStyle = '#ff7a3c';
      ctx.fillRect(x - 20, y - 8, 40, 14);
      ctx.fillStyle = '#ffe14a';
      ctx.fillRect(x - 6, y - 4, 12, 8);
    } else if (look === 'vault') {
      ctx.fillStyle = flashOn ? '#fff' : '#3a3414';
      ctx.fillRect(x - 22, y - 22, 44, 44);
      ctx.fillStyle = '#ffe14a';
      ctx.fillRect(x - 8, y - 8, 16, 16);
      ctx.fillStyle = '#fff6c8';
      ctx.fillRect(x - 3, y - 3, 6, 6);
    } else if (look === 'hive') {
      ctx.fillStyle = flashOn ? '#fff' : '#3a4010';
      ctx.beginPath();
      ctx.moveTo(x, y - 28);
      ctx.lineTo(x + 26, y - 8);
      ctx.lineTo(x + 16, y + 22);
      ctx.lineTo(x - 16, y + 22);
      ctx.lineTo(x - 26, y - 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e6ff6a';
      ctx.fillRect(x - 5, y - 4, 10, 10);
    } else if (look === 'gate') {
      ctx.strokeStyle = flashOn ? '#fff' : '#ff4fd8';
      ctx.lineWidth = 6;
      ctx.strokeRect(x - 30, y - 34, 60, 68);
      ctx.strokeStyle = '#5ce1ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 16, y - 18, 32, 36);
      ctx.fillStyle = '#ffe14a';
      ctx.fillRect(x - 4, y - 4, 8, 8);
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
    for (let i = 0; i < gems.length; i++) drawCrystal(gems[i].x, gems[i].y, gems[i].t + (gems[i].bob || 0));
    for (let i = 0; i < pickups.length; i++) {
      const p = pickups[i];
      const col = p.kind === 'bomb' ? '#ffe14a' : p.kind === 'rapid' ? '#5ce1ff' : p.kind === 'power' ? '#ff4fd8' : '#fff6c8';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      if (h.kind === 'rock') {
        ctx.fillStyle = '#6a5344';
        ctx.fillRect(h.x - h.r, h.y - h.r * 0.7, h.r * 2, h.r * 1.4);
        ctx.fillStyle = '#d2b48c';
        ctx.fillRect(h.x - 3, h.y - 2, 4, 3);
      } else if (h.kind === 'pillar') {
        ctx.fillStyle = '#8a2a14';
        ctx.fillRect(h.x, h.y, h.w, h.h);
        ctx.fillStyle = '#ff7a3c';
        ctx.fillRect(h.x, h.y, h.w, 3);
      } else if (h.kind === 'bolt') {
        ctx.fillStyle = h.active ? 'rgba(180, 230, 255, 0.85)' : 'rgba(120, 190, 255, 0.28)';
        ctx.fillRect(h.x - h.w / 2, 0, h.w, H);
      } else if (h.kind === 'mine') {
        ctx.fillStyle = Math.floor(h.t * 8) % 2 ? '#ff3355' : '#ffe14a';
        ctx.fillRect(h.x - 4, h.y - 4, 8, 8);
      }
    }
    for (let i = 0; i < eBullets.length; i++) drawBulletSquare(eBullets[i]);

    if (player && player.alive && player.weapons.laser) {
      const beams = laserBeams();
      for (let i = 0; i < beams.length; i++) {
        const beam = beams[i];
        ctx.fillStyle = 'rgba(92, 225, 255, 0.28)';
        ctx.fillRect(beam.x - beam.half, 0, beam.half * 2, player.y - 8);
        ctx.fillStyle = '#f4f0ff';
        ctx.fillRect(beam.x - Math.max(1, beam.half * 0.28), 0, Math.max(2, beam.half * 0.56), player.y - 8);
      }
    }
    for (let i = 0; i < zones.length; i++) {
      const z = zones[i];
      ctx.globalAlpha = clamp(z.life / z.max, 0, 0.7);
      ctx.fillStyle = '#ffe14a';
      ctx.fillRect(z.x - 6, 0, 12, player ? player.y : H);
      ctx.globalAlpha = 1;
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
      if (player.blades) {
        for (let i = 0; i < player.blades.length; i++) {
          const blade = player.blades[i];
          ctx.save();
          ctx.translate(blade.x, blade.y);
          ctx.rotate(player.bladeAng + i);
          ctx.fillStyle = player.evolved.orbit ? '#fff6c8' : '#5ce1ff';
          ctx.fillRect(-2, -7, 4, 14);
          ctx.restore();
        }
      }
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
      const names = { spread: '擴散', laser: '雷射', missile: '飛彈', wave: '波動', orbit: '環刃', rail: '穿甲' };
      const evoNames = { spread: '星爆', laser: '折光', missile: '蜂群', wave: '引力', orbit: '劍陣', rail: '殲滅' };
      let chips = '';
      Object.keys(names).forEach((id) => {
        const lv = player.weapons[id];
        if (!lv) return;
        const label = player.evolved[id] ? evoNames[id] : (names[id] + ' ' + lv);
        chips += '<span class="chip' + (player.evolved[id] ? ' evo' : '') + '">' + label + '</span>';
      });
      shieldEl.textContent = (player.shield ? '盾 ×' + player.shield + '  ' : '') + '炸彈 ×' + player.bombs;
      if (bombBtn) bombBtn.textContent = '炸 ' + player.bombs;
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
        '<p class="tagline">中央光點才是你。金色結晶是經驗，方塊彈幕才危險。撐過九個戰區。</p>' +
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
          '<li>擊破敵機會掉金色星星結晶。那是經驗，不是方塊彈幕。</li>' +
          '<li>經驗滿了會暫停，三張卡有普通、稀有、史詩、傳說。滿級武器可以進化。</li>' +
          '<li>電腦按 X、手機按「炸」會清掉彈幕並重創敵機，炸彈數量有限。</li>' +
          '<li>九個戰區各有地形：流星、雷擊、熔岩柱、賞金關和生存關。</li>' +
          '<li>護盾可以擋下一次傷害。每個難度各自保存最高分。</li>' +
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
      cards += '<button type="button" class="chunk card rarity-' + (c.rarity || 'common') + '" data-act="pick" data-i="' + i + '">' +
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
    return ['spread', 'laser', 'missile', 'wave', 'orbit', 'rail'].reduce((n, id) => n + ((player.weapons[id] || 0) > 0 ? 1 : 0), 0);
  }

  function card(rarity, tag, name, desc, weight, apply) {
    const label = { common: '普通', rare: '稀有', epic: '史詩', legend: '傳說' }[rarity] || '普通';
    return { rarity: rarity, weight: weight, tag: label + ' · ' + tag, name: name, desc: desc, apply: apply };
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
    ['spread', 'laser', 'missile', 'wave', 'orbit', 'rail'].forEach((id) => {
      const info = WEAPON_INFO[id];
      const lv = player.weapons[id] || 0;
      if (player.evolved[id] || lv >= 5) return;
      const fresh = lv === 0;
      pool.push(card(
        fresh ? 'rare' : (lv >= 3 ? 'epic' : 'rare'),
        fresh ? '新武器' : ('第 ' + lv + ' 級 → 第 ' + (lv + 1) + ' 級'),
        info.name,
        fresh ? info.unlock : info.up[lv - 1],
        fresh ? 2.5 : 1.35,
        () => { player.weapons[id] = lv + 1; }
      ));
    });
    EVOLUTIONS.forEach((evo) => {
      const lv = player.weapons[evo.id] || 0;
      if (lv < 5 || player.evolved[evo.id]) return;
      if ((player.ranks[evo.need] || 0) < evo.rank) return;
      pool.push(card('legend', '進化', evo.name, evo.desc, 3.4, () => { player.evolved[evo.id] = true; }));
    });
    if (player.ranks.dmg < 8) {
      pool.push(card('common', '目前 ' + player.ranks.dmg + '/8', '火力增強', '所有武器傷害提高 20%。和滿級武器共鳴後可能進化。', 0.85, () => {
        player.ranks.dmg += 1; player.dmgMul += 0.2;
      }));
    }
    if (player.ranks.rate < 7) {
      pool.push(card('common', '目前 ' + player.ranks.rate + '/7', '射速提升', '射擊間隔縮短 12%。', 0.85, () => {
        player.ranks.rate += 1; player.rateMul *= 0.88;
      }));
    }
    if (player.ranks.speed < 6) {
      pool.push(card('common', '目前 ' + player.ranks.speed + '/6', '推進強化', '移動速度提高 10%。', 0.8, () => {
        player.ranks.speed += 1; player.speedMul *= 1.1;
      }));
    }
    if (player.ranks.drone < 4) {
      const summon = player.drones < 2;
      pool.push(card(summon ? 'rare' : 'epic', summon ? ('浮游砲 ' + player.drones + '/2') : '強化', '浮游砲', summon ? '增加 1 座會自動瞄準射擊的浮游砲。' : '浮游砲傷害提高 25%。', summon ? 1.3 : 0.8, () => {
        player.ranks.drone += 1;
        if (player.drones < 2) player.drones += 1;
        else player.droneDmg *= 1.25;
      }));
    }
    if (player.shield < 3) {
      pool.push(card('rare', '持有 ' + player.shield + '/3', '能量護盾', '獲得 1 層護盾，可抵擋一次傷害。最多同時 3 層。', 0.9, () => {
        player.shield = Math.min(3, player.shield + 1);
      }));
    }
    if (player.ranks.magnet < 5) {
      pool.push(card('rare', '目前 ' + player.ranks.magnet + '/5', '吸收磁場', '經驗結晶會從更遠的地方高速飛向你。', 0.75, () => {
        player.ranks.magnet += 1; player.magnet += 42;
      }));
    }
    if (player.ranks.crit < 4) {
      pool.push(card('epic', '目前 ' + player.ranks.crit + '/4', '暴擊電路', '一部分射擊會打出兩倍傷害。', 0.7, () => {
        player.ranks.crit += 1; player.crit += 0.07;
      }));
    }
    if (player.ranks.xp < 4) {
      pool.push(card('rare', '目前 ' + player.ranks.xp + '/4', '經驗增幅', '撿到的經驗結晶多給 12%。', 0.65, () => {
        player.ranks.xp += 1; player.xpMul += 0.12;
      }));
    }
    if (player.ranks.graze < 3) {
      pool.push(card('rare', '目前 ' + player.ranks.graze + '/3', '擦彈熟練', '擦過彈幕時額外獲得一點經驗。', 0.55, () => {
        player.ranks.graze += 1; player.grazeXp += 1;
      }));
    }
    if (player.ranks.iframe < 3) {
      pool.push(card('epic', '目前 ' + player.ranks.iframe + '/3', '殘影迴避', '復活後的無敵時間變長。', 0.6, () => {
        player.ranks.iframe += 1; player.iframeBonus += 0.35;
      }));
    }
    if (player.bombs < player.bombMax) {
      pool.push(card('rare', '持有 ' + player.bombs + '/' + player.bombMax, '炸彈補給', '獲得 1 顆清屏炸彈。按 X 或右下角的炸彈鈕。', 0.7, () => {
        player.bombs = Math.min(player.bombMax, player.bombs + 1);
      }));
    }
    if (lives < 3) {
      pool.push(card('epic', '生命 ' + lives + '/3', '緊急修復', '回復 1 條生命。', 0.55, () => {
        lives = Math.min(3, lives + 1);
      }));
    }
    if (pool.length < 3) pool.push(card('common', '獎勵', '戰績加乘', '立刻獲得 3000 分。', 0.4, () => { addScore(3000, false); }));
    const picks = [];
    const takeTag = (pred) => {
      const idxs = [];
      for (let i = 0; i < pool.length; i++) if (pred(pool[i])) idxs.push(i);
      if (!idxs.length) return;
      const idx = idxs[Math.floor(Math.random() * idxs.length)];
      picks.push(pool.splice(idx, 1)[0]);
    };
    takeTag((c) => c.rarity === 'legend');
    if (ownedCount() < 4 && level <= 8) takeTag((c) => c.tag.indexOf('新武器') >= 0);
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

    bombBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      useBomb();
    });
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
      if ((k === 'x' || k === 'z') && !e.repeat) useBomb();
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
        boss: boss ? { name: boss.name, hp: Math.round(boss.hp), phase: boss.phase, entering: boss.entering, x: Math.round(boss.x), y: Math.round(boss.y) } : null,
        choices: state === 'levelup' ? currentChoices.map((c) => ({ name: c.name, rarity: c.rarity, tag: c.tag })) : null,
        stage: currentStage() ? currentStage().name : null,
        theme: currentTheme().id,
        bombs: player ? player.bombs : 0,
        gemsOnScreen: gems.length,
      }),
    };
    requestAnimationFrame(frameLoop);
  }

  boot();
})();
