/* 星河彈幕 — WebAudio 芯片風音效與簡單循環配樂。不需要任何音檔。 */
(() => {
  'use strict';

  const MUTE_KEY = 'xinghe-danmaku-mute';

  function AudioBus() {
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.disabled = false;
    this.muted = false;
    this.started = false;
    this.step = 0;
    this.next = 0;
    this.stage = 0;
    this._mix = -1;
    this._last = {};
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch (err) {
      this.muted = false;
    }
  }

  AudioBus.prototype.unlock = function () {
    if (this.disabled) return;
    try {
      if (!this.ctx) this._init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    } catch (err) {
      this.disabled = true;
    }
  };

  AudioBus.prototype._init = function () {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      this.disabled = true;
      return;
    }
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.2;
    this.master.connect(this.ctx.destination);
    const len = Math.floor(this.ctx.sampleRate * 0.5);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buf;
    this.next = this.ctx.currentTime + 0.05;
    this.started = true;
  };

  AudioBus.prototype.toggle = function () {
    this.muted = !this.muted;
    try {
      localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    } catch (err) { /* 隱私模式可能無法寫入 */ }
    this._mix = -1;
    return this.muted;
  };

  AudioBus.prototype.setStage = function (n) {
    this.stage = n | 0;
  };

  AudioBus.prototype.updateMix = function (state) {
    if (!this.ctx || !this.master) return;
    const quiet = state === 'pause' || state === 'levelup' || state === 'gameover' ||
      state === 'victory' || state === 'title' || state === 'help' || state === 'difficulty';
    const target = this.muted ? 0 : quiet ? 0.09 : 0.22;
    if (this._mix === target) return;
    this._mix = target;
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.06);
  };

  AudioBus.prototype.tick = function () {
    if (!this.ctx || !this.started) return;
    if (this.next < this.ctx.currentTime - 0.02) this.next = this.ctx.currentTime + 0.02;
    const eighth = 60 / 136 / 2;
    while (this.next < this.ctx.currentTime + 0.22) {
      this._step(this.step, this.next);
      this.step = (this.step + 1) % 32;
      this.next += eighth;
    }
  };

  AudioBus.prototype._freq = function (index, octave) {
    if (index < 0) return 0;
    const scale = [0, 3, 5, 7, 10];
    const semi = scale[index % 5] + 12 * (octave + Math.floor(index / 5));
    return 110 * Math.pow(2, semi / 12);
  };

  AudioBus.prototype._step = function (step, time) {
    const leadPat = [0, 2, 4, 2, 3, 2, 4, 2, 0, 4, 3, 2, 1, 2, 0, -1, 4, 3, 2, 0, 2, 4, 3, -1, 0, 2, 1, 0, 4, 2, 0, -1];
    const bassPat = [0, -1, 0, -1, 3, -1, 2, -1, 0, -1, 4, -1, 2, -1, 0, -1, 3, -1, 2, -1, 0, -1, 1, -1, 0, -1, 0, 4, 2, -1, 0, -1];
    const shift = this.stage === 2 ? 1 : 0;
    const lf = this._freq(leadPat[step], 2 + shift);
    const bf = this._freq(bassPat[step], 0);
    const wave = this.stage === 1 ? 'triangle' : this.stage === 2 ? 'sawtooth' : 'square';
    if (lf) this.beep({ freq: lf, dur: 0.11, type: wave, gain: 0.035, when: time, slide: lf * 1.01 });
    if (bf) this.beep({ freq: bf, dur: 0.16, type: 'square', gain: 0.05, when: time });
    if (step % 8 === 0) this._noise(time, 0.09, 180, 0.05);
    else if (step % 4 === 2) this._noise(time, 0.03, 2400, 0.02);
  };

  AudioBus.prototype.beep = function (opts) {
    if (!this.ctx || this.disabled) return;
    const t = opts.when != null ? opts.when : this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = opts.type || 'square';
    const freq = Math.max(40, opts.freq || 440);
    o.frequency.setValueAtTime(freq, t);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, opts.slide), t + opts.dur);
    const peak = opts.gain == null ? 0.06 : opts.gain;
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.03, opts.dur));
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + opts.dur + 0.02);
  };

  AudioBus.prototype._noise = function (time, dur, freq, gain) {
    if (!this.ctx || !this.noise) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq, time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.4), time + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(time);
    src.stop(time + dur + 0.02);
  };

  AudioBus.prototype._throttle = function (name, gap) {
    if (!this.ctx) return false;
    const now = this.ctx.currentTime;
    if (this._last[name] && now - this._last[name] < gap) return false;
    this._last[name] = now;
    return true;
  };

  AudioBus.prototype.ui = function () {
    this.unlock();
    this.beep({ freq: 660, dur: 0.05, type: 'square', gain: 0.05 });
  };

  AudioBus.prototype.shoot = function () {
    if (!this._throttle('shoot', 0.09)) return;
    this.beep({ freq: 880, dur: 0.035, type: 'square', gain: 0.03, slide: 1320 });
  };

  AudioBus.prototype.missile = function () {
    if (!this._throttle('missile', 0.12)) return;
    this.beep({ freq: 240, dur: 0.12, type: 'sawtooth', gain: 0.04, slide: 90 });
  };

  AudioBus.prototype.wave = function () {
    if (!this._throttle('wave', 0.12)) return;
    this.beep({ freq: 180, dur: 0.16, type: 'triangle', gain: 0.05, slide: 520 });
  };

  AudioBus.prototype.explode = function (big) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this._noise(t, big ? 0.38 : 0.16, big ? 900 : 1400, big ? 0.12 : 0.06);
    this.beep({ freq: big ? 160 : 220, dur: big ? 0.28 : 0.1, type: 'square', gain: big ? 0.07 : 0.04, slide: 50 });
  };

  AudioBus.prototype.hurt = function () {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this._noise(t, 0.22, 600, 0.09);
    this.beep({ freq: 140, dur: 0.22, type: 'sawtooth', gain: 0.07, slide: 48 });
  };

  AudioBus.prototype.shield = function () {
    this.beep({ freq: 520, dur: 0.08, type: 'square', gain: 0.06, slide: 880 });
    this.beep({ freq: 880, dur: 0.1, type: 'triangle', gain: 0.04, when: this.ctx ? this.ctx.currentTime + 0.06 : 0 });
  };

  AudioBus.prototype.pickup = function () {
    if (!this._throttle('pickup', 0.07)) return;
    this.beep({ freq: 740, dur: 0.05, type: 'square', gain: 0.04 });
    if (this.ctx) this.beep({ freq: 1100, dur: 0.06, type: 'square', gain: 0.03, when: this.ctx.currentTime + 0.04 });
  };

  AudioBus.prototype.level = function () {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1046].forEach((f, i) => {
      this.beep({ freq: f, dur: 0.1, type: 'square', gain: 0.06, when: t + i * 0.07 });
    });
  };

  AudioBus.prototype.power = function () {
    if (!this.ctx) return;
    this.beep({ freq: 440, dur: 0.08, type: 'square', gain: 0.05, slide: 880 });
  };

  AudioBus.prototype.alarm = function () {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.beep({ freq: 523, dur: 0.16, type: 'square', gain: 0.07, slide: 262, when: t });
    this.beep({ freq: 523, dur: 0.16, type: 'square', gain: 0.07, slide: 262, when: t + 0.2 });
    this.beep({ freq: 196, dur: 0.32, type: 'sawtooth', gain: 0.06, slide: 90, when: t + 0.38 });
  };

  AudioBus.prototype.phase = function () {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.beep({ freq: 330, dur: 0.12, type: 'square', gain: 0.06, when: t });
    this.beep({ freq: 494, dur: 0.14, type: 'square', gain: 0.06, when: t + 0.1 });
  };

  AudioBus.prototype.gameover = function () {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [392, 349, 311, 262].forEach((f, i) => {
      this.beep({ freq: f, dur: 0.18, type: 'square', gain: 0.06, when: t + i * 0.14 });
    });
  };

  AudioBus.prototype.victory = function () {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1046, 784, 1046].forEach((f, i) => {
      this.beep({ freq: f, dur: 0.14, type: 'square', gain: 0.06, when: t + i * 0.1 });
    });
  };

  window.XingheAudio = new AudioBus();
})();
