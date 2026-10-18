/**
 * audioService.js - Web Audio API synthesizer + HTML5 Audio streaming with 3-Band EQ & DJ FX
 *
 * Audio Graph Topology:
 * MediaElementSourceNode -> BiquadFilter (Bass, 60Hz)
 *                        -> BiquadFilter (Mid, 1000Hz)
 *                        -> BiquadFilter (Treble, 8000Hz)
 *                        -> BiquadFilter (Lowpass FX, 400Hz / 20000Hz)
 *                        -> AnalyserNode (Live frequency data)
 *                        -> GainNode (Master volume)
 *                        -> Destination
 */

class SoundEngine {
  constructor() {
    this.audio = null;
    this.context = null;
    this.mediaSource = null;
    this.masterGain = null;
    this.analyser = null;

    // Filter nodes
    this.bassFilter = null;
    this.midFilter = null;
    this.trebleFilter = null;
    this.lowpassFilter = null;

    // EQ State
    this.eqGains = {
      bass: 0,
      mid: 0,
      treble: 0,
    };
    this.lowpassFXEnabled = false;
    this.lowpassFreq = 400;
    this.preset = "flat";

    // Playback state
    this.synthTimer = null;
    this.currentTrack = null;
    this.isPlaying = false;
    this.volume = 0.7;
    this.offset = 0;
    this.started = 0;

    // Listeners
    this.listeners = new Set();
    this.eqListeners = new Set();

    this.timer = setInterval(() => {
      if (this.isPlaying) {
        this.notify();
        if (!this.audio && this.seconds >= this.duration) {
          this.finish();
        }
      }
    }, 250);
  }

  get filters() {
    return {
      bass: this.bassFilter,
      mid: this.midFilter,
      treble: this.trebleFilter,
    };
  }

  get isFXActive() {
    return (
      Math.abs(this.eqGains.bass) > 0.1 ||
      Math.abs(this.eqGains.mid) > 0.1 ||
      Math.abs(this.eqGains.treble) > 0.1 ||
      this.lowpassFXEnabled
    );
  }

  get seconds() {
    if (this.audio && !isNaN(this.audio.currentTime)) {
      return this.audio.currentTime;
    }
    return this.offset + (this.isPlaying ? (performance.now() - this.started) / 1000 : 0);
  }

  get duration() {
    if (Number.isFinite(this.audio?.duration) && this.audio.duration > 0) {
      return this.audio.duration;
    }
    return Number(this.currentTrack?.duration_seconds) || 45;
  }

  /**
   * Инициализация Web Audio API графа и persistent Audio элемента.
   * crossOrigin="anonymous" обязателен для предотвращения CORS-блокировки Web Audio API.
   */
  initWebAudio() {
    if (this.context) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      this.context = new AudioCtx();

      // Создаем и настраиваем HTML5 Audio элемент
      if (!this.audio) {
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.preload = "auto";
        audio.addEventListener("ended", () => this.finish());
        audio.addEventListener("error", () => {
          if (this.isPlaying) {
            this.startSynth();
          }
        });
        this.audio = audio;
      }

      // Создаем MediaElementSourceNode один раз для audio элемента
      this.mediaSource = this.context.createMediaElementSource(this.audio);

      // 1. Bass filter (60 Hz, lowshelf)
      this.bassFilter = this.context.createBiquadFilter();
      this.bassFilter.type = "lowshelf";
      this.bassFilter.frequency.value = 60;
      this.bassFilter.gain.value = this.eqGains.bass;

      // 2. Mid filter (1000 Hz, peaking)
      this.midFilter = this.context.createBiquadFilter();
      this.midFilter.type = "peaking";
      this.midFilter.frequency.value = 1000;
      this.midFilter.Q.value = 1.0;
      this.midFilter.gain.value = this.eqGains.mid;

      // 3. Treble filter (8000 Hz, highshelf)
      this.trebleFilter = this.context.createBiquadFilter();
      this.trebleFilter.type = "highshelf";
      this.trebleFilter.frequency.value = 8000;
      this.trebleFilter.gain.value = this.eqGains.treble;

      // 4. Lowpass filter (DJ-эффект "за дверью", 400 Hz)
      this.lowpassFilter = this.context.createBiquadFilter();
      this.lowpassFilter.type = "lowpass";
      this.lowpassFilter.frequency.value = this.lowpassFXEnabled ? this.lowpassFreq : 20000;
      this.lowpassFilter.Q.value = 1.0;

      // 5. AnalyserNode для спектрограммы и анимированных столбиков
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      // 6. Master GainNode
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.volume;

      // Соединяем граф:
      // MediaElementSourceNode -> Bass -> Mid -> Treble -> Lowpass FX -> Analyser -> MasterGain -> Destination
      this.mediaSource.connect(this.bassFilter);
      this.bassFilter.connect(this.midFilter);
      this.midFilter.connect(this.trebleFilter);
      this.trebleFilter.connect(this.lowpassFilter);
      this.lowpassFilter.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
    } catch (e) {
      console.warn("Web Audio API initialization warning:", e);
    }
  }

  // ── Методы управления эквалайзером и эффектами ────────────────────────────

  /**
   * Регулировка усиления от -12 dB до +12 dB для полос bass, mid, treble с плавным переходом.
   */
  setBandGain(band, gainValue) {
    this.initWebAudio();
    const val = Math.max(-12, Math.min(12, Number(gainValue) || 0));
    this.eqGains[band] = val;

    const filter = this.filters[band];
    if (filter && this.context) {
      const at = this.context.currentTime;
      filter.gain.cancelScheduledValues(at);
      filter.gain.setTargetAtTime(val, at, 0.05);
    }
    this.preset = "custom";
    this.notifyEQ();
  }

  /**
   * Включение/выключение DJ-эффекта "звук из соседней комнаты" (Lowpass на 400Hz).
   */
  setLowpassFX(enabled, frequency = 400) {
    this.initWebAudio();
    this.lowpassFXEnabled = Boolean(enabled);
    this.lowpassFreq = frequency;

    if (this.lowpassFilter && this.context) {
      const at = this.context.currentTime;
      const targetFreq = this.lowpassFXEnabled ? this.lowpassFreq : 20000;
      this.lowpassFilter.frequency.cancelScheduledValues(at);
      this.lowpassFilter.frequency.setTargetAtTime(targetFreq, at, 0.08);
    }
    this.notifyEQ();
  }

  /**
   * Применение быстрых пресетов (flat, bass_boost, vocal, lofi).
   */
  applyPreset(presetName) {
    this.initWebAudio();
    const PRESETS = {
      flat: { bass: 0, mid: 0, treble: 0, lowpass: false },
      bass_boost: { bass: 9, mid: -1, treble: 2, lowpass: false },
      vocal: { bass: -3, mid: 6, treble: 3, lowpass: false },
      lofi: { bass: 5, mid: -2, treble: -7, lowpass: false },
    };

    const target = PRESETS[presetName] || PRESETS.flat;

    for (const band of ["bass", "mid", "treble"]) {
      const val = target[band];
      this.eqGains[band] = val;
      const filter = this.filters[band];
      if (filter && this.context) {
        const at = this.context.currentTime;
        filter.gain.cancelScheduledValues(at);
        filter.gain.setTargetAtTime(val, at, 0.05);
      }
    }

    this.setLowpassFX(target.lowpass);
    this.preset = presetName;
    this.notifyEQ();
  }

  /**
   * Сброс всех фильтров в 0 dB и выключение lowpass FX.
   */
  resetEQ() {
    this.applyPreset("flat");
  }

  /**
   * Получение байтовых данных спектрограммы для Canvas-визуализатора.
   */
  getFrequencyData() {
    if (!this.analyser) {
      return new Uint8Array(32);
    }
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(buffer);
    return buffer;
  }

  getEQState() {
    return {
      bass: this.eqGains.bass,
      mid: this.eqGains.mid,
      treble: this.eqGains.treble,
      lowpass: this.lowpassFXEnabled,
      preset: this.preset,
      isFXActive: this.isFXActive,
    };
  }

  subscribeEQ(listener) {
    this.eqListeners.add(listener);
    try {
      listener(this.getEQState());
    } catch {}
    return () => this.eqListeners.delete(listener);
  }

  notifyEQ() {
    const st = this.getEQState();
    for (const fn of this.eqListeners) {
      try {
        fn(st);
      } catch {}
    }
  }

  // ── Подписки на плеер ────────────────────────────────────────────────────

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const fn of this.listeners) {
      try {
        fn({
          track: this.currentTrack,
          isPlaying: this.isPlaying,
          seconds: this.seconds,
          duration: this.duration,
          progress: this.duration > 0 ? (this.seconds / this.duration) * 100 : 0,
        });
      } catch {}
    }
  }

  unlock() {
    this.initWebAudio();
    if (this.context && this.context.state === "suspended") {
      this.context.resume().catch(() => {});
    }
    if (this.audio && this.isPlaying && this.audio.paused) {
      this.audio.play().then(() => {
        this.stopSynth();
      }).catch(() => {});
    } else if (this.isPlaying && !this.audio && this.currentTrack) {
      this.play(this.currentTrack).catch(() => {});
    }
  }

  // ── Воспроизведение ──────────────────────────────────────────────────────

  async play(track, audioUrl = null) {
    if (!track) return;
    this.initWebAudio();

    if (this.context && this.context.state === "suspended") {
      await this.context.resume().catch(() => {});
    }

    // Если тот же трек на паузе — возобновляем
    if (this.currentTrack?.id === track.id && !this.isPlaying) {
      this.isPlaying = true;
      this.started = performance.now();
      if (this.audio && this.audio.src) {
        await this.audio.play();
      } else {
        this.startSynth();
      }
      this.notify();
      return;
    }

    // Новый трек
    this.stopSynth();
    this.currentTrack = track;
    this.offset = 0;
    this.isPlaying = true;
    this.started = performance.now();

    const fileMap = {
      bustin: "/audio/bustin_loose.mp3",
      funk90: "/audio/90_seconds_of_funk.mp3",
      cents5: "/audio/5_cents_back.mp3",
      fallingsky: "/audio/falling_sky.mp3",
    };
    const key = track.library_key || track.key;
    const directFile = fileMap[key];

    const streamUrl =
      directFile ||
      audioUrl ||
      track.audio_url ||
      (track.id && track.room_id && track.source_type === "upload"
        ? `/api/communities/${track.room_id}/tracks/${track.id}/audio`
        : null);

    if (streamUrl && this.audio) {
      try {
        this.audio.pause();
        this.audio.src = streamUrl;
        this.audio.currentTime = 0;
        await this.audio.play();
      } catch (err) {
        console.warn("Direct audio playback failed, falling back to synth:", err);
        this.startSynth();
      }
    } else {
      this.startSynth();
    }
    this.notify();
  }

  pause() {
    if (!this.isPlaying) return;
    this.offset = this.seconds;
    this.isPlaying = false;
    if (this.audio) {
      this.audio.pause();
    }
    this.stopSynth();
    this.notify();
  }

  stop() {
    this.pause();
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.stopSynth();
    this.offset = 0;
    this.currentTrack = null;
    this.notify();
  }

  seek(seconds) {
    const val = Math.min(this.duration, Math.max(0, Number(seconds)));
    if (this.audio) {
      this.audio.currentTime = val;
    } else {
      this.offset = val;
      this.started = performance.now();
    }
    this.notify();
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, Number(val)));
    if (this.masterGain && this.context) {
      const now = this.context.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this.volume, now, 0.03);
    } else if (this.audio) {
      this.audio.volume = this.volume;
    }
    this.notify();
  }

  finish() {
    this.pause();
    this.offset = this.duration;
    this.notify();
    if (this.onEnded) this.onEnded(this.currentTrack);
  }

  stopSynth() {
    if (this.synthTimer) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
  }

  startSynth() {
    this.stopSynth();
    this.initWebAudio();
    if (!this.context) return;

    if (this.context.state === "suspended") {
      this.context.resume().catch(() => {});
    }

    const key = this.currentTrack?.library_key || "dawn";
    const noteMap = {
      dawn: [261.63, 329.63, 392.0, 523.25], // C4, E4, G4, C5
      city: [220.0, 261.63, 329.63, 392.0],  // A3, C4, E4, G4
      orbit: [293.66, 369.99, 440.0, 587.33], // D4, F#4, A4, D5
      rain: [196.0, 246.94, 293.66, 392.0],   // G3, B3, D4, G4
      night: [164.81, 196.0, 246.94, 329.63], // E3, G3, B3, E4
      sea: [174.61, 220.0, 261.63, 349.23],   // F3, A3, C4, F4
    };

    const notes = noteMap[key] || [220, 277.18, 329.63, 440];

    // Синтезатор подключается на вход эквалайзера (bassFilter),
    // чтобы эквалайзер и анализатор спектра работали и для синтезированных треков!
    const synthMaster = this.context.createGain();
    synthMaster.gain.value = 0.25;

    if (this.bassFilter) {
      synthMaster.connect(this.bassFilter);
    } else if (this.masterGain) {
      synthMaster.connect(this.masterGain);
    } else {
      synthMaster.connect(this.context.destination);
    }

    let beat = Math.floor(this.offset / 0.32);
    const tick = () => {
      if (!this.context || this.context.state === "closed" || !this.isPlaying) return;
      const at = this.context.currentTime + 0.02;

      // Мелодический тон
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = key === "night" ? "sawtooth" : "sine";
      const freq = notes[beat % notes.length] * (beat % 8 === 7 ? 2 : 1);
      osc.frequency.setValueAtTime(freq, at);

      gain.gain.setValueAtTime(0.001, at);
      gain.gain.exponentialRampToValueAtTime(0.65, at + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.29);

      osc.connect(gain);
      gain.connect(synthMaster);
      osc.start(at);
      osc.stop(at + 0.31);

      // Басовая партия на сильную долю
      if (beat % 4 === 0) {
        const bass = this.context.createOscillator();
        const bg = this.context.createGain();
        bass.type = "triangle";
        bass.frequency.setValueAtTime(notes[0] / 2, at);
        bg.gain.setValueAtTime(0.001, at);
        bg.gain.exponentialRampToValueAtTime(0.5, at + 0.08);
        bg.gain.exponentialRampToValueAtTime(0.001, at + 0.55);

        bass.connect(bg);
        bg.connect(synthMaster);
        bass.start(at);
        bass.stop(at + 0.57);
      }

      beat++;
    };

    tick();
    this.synthTimer = setInterval(tick, 320);
  }
}

export const audioService = new SoundEngine();
export default audioService;
