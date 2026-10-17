import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sliders,
  RotateCcw,
  Sparkles,
  DoorClosed,
  Zap,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { audioService } from "@/lib/audioService";

const PRESETS = [
  { id: "flat", label: "Обычный (Flat)", icon: "🎧" },
  { id: "bass_boost", label: "💥 Bass Boost", icon: "💥" },
  { id: "vocal", label: "🎤 Вокал", icon: "🎤" },
  { id: "lofi", label: "📻 Lo-Fi", icon: "📻" },
];

const BANDS = [
  { id: "bass", label: "BASS", freq: "60 Hz", color: "from-lime-500 to-emerald-400" },
  { id: "mid", label: "MID", freq: "1 kHz", color: "from-amber-400 to-yellow-300" },
  { id: "treble", label: "TREBLE", freq: "8 kHz", color: "from-violet-400 to-purple-400" },
];

function VerticalSlider({ band, value, onChange, onReset }) {
  const trackRef = useRef(null);
  const isDragging = useRef(false);

  // Compute position: -12 dB is 0% (bottom), 0 dB is 50%, +12 dB is 100% (top)
  const percent = ((value - -12) / 24) * 100;

  const handlePointerDown = (e) => {
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    updateFromPointer(e);
  };

  const handlePointerUp = (e) => {
    isDragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const updateFromPointer = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    // Invert because top is 100% (+12dB), bottom is 0% (-12dB)
    const ratio = Math.max(0, Math.min(1, (rect.bottom - e.clientY) / rect.height));
    const rawVal = -12 + ratio * 24;
    // Round to nearest 0.5 dB
    const stepped = Math.round(rawVal * 2) / 2;
    onChange(stepped);
  };

  const formatDb = (v) => {
    if (v > 0) return `+${v.toFixed(1)} dB`;
    if (v === 0) return "0.0 dB";
    return `${v.toFixed(1)} dB`;
  };

  return (
    <div className="flex flex-col items-center select-none flex-1">
      {/* Метка полосы */}
      <div className="text-center mb-2">
        <p className="text-xs font-black tracking-wider text-white">{band.label}</p>
        <p className="text-[10px] text-neutral-500 font-mono">{band.freq}</p>
      </div>

      {/* Интерактивный вертикальный слайдер */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={onReset}
        title="Перетащите для регулировки, двойной клик для сброса в 0 dB"
        className="relative w-12 h-44 py-3 flex items-center justify-center cursor-ns-resize group touch-none"
      >
        {/* Фоновый желоб */}
        <div className="relative w-2.5 h-full rounded-full bg-[#141414] border border-[#2a2a2a] overflow-hidden flex flex-col justify-end">
          {/* Центральная риска (0 dB) */}
          <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-neutral-600 z-10 pointer-events-none" />

          {/* Заполнение полосы */}
          {value >= 0 ? (
            <div
              className="absolute left-0 right-0 bg-[#a3e635]/80 transition-[height,bottom] duration-75 shadow-[0_0_8px_rgba(163,230,53,0.5)]"
              style={{
                bottom: "50%",
                height: `${((value) / 12) * 50}%`,
              }}
            />
          ) : (
            <div
              className="absolute left-0 right-0 bg-red-500/70 transition-[height,top] duration-75 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
              style={{
                top: "50%",
                height: `${(Math.abs(value) / 12) * 50}%`,
              }}
            />
          )}
        </div>

        {/* Бегунок / Thumb */}
        <div
          className={cn(
            "absolute w-7 h-5 rounded-lg border flex items-center justify-center transition-transform pointer-events-none shadow-lg",
            value !== 0
              ? "bg-[#1c231d] border-[#a3e635] text-[#a3e635] shadow-[0_0_10px_rgba(163,230,53,0.3)]"
              : "bg-[#222] border-[#3a3a3a] text-neutral-400 group-hover:border-neutral-500"
          )}
          style={{
            bottom: `calc(${percent}% - 10px)`,
          }}
        >
          <div className="w-3 h-[2px] bg-current rounded-full" />
        </div>
      </div>

      {/* Значение в dB */}
      <div className="mt-2 text-center">
        <span
          className={cn(
            "text-xs font-mono font-bold px-2 py-0.5 rounded-md tabular-nums inline-block transition-colors",
            value > 0
              ? "text-[#a3e635] bg-[#1c231d] border border-[#2e402d]"
              : value < 0
              ? "text-red-400 bg-red-950/40 border border-red-900/40"
              : "text-neutral-400 bg-[#171717] border border-[#242424]"
          )}
        >
          {formatDb(value)}
        </span>
      </div>
    </div>
  );
}

export function EqualizerModal({ open, onOpenChange }) {
  const [eqState, setEqState] = useState(audioService.getEQState());
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Синхронизация с audioService
  useEffect(() => {
    const unsub = audioService.subscribeEQ((st) => {
      setEqState({ ...st });
    });
    return () => unsub();
  }, []);

  // Live Canvas Visualizer (18 neon bars)
  useEffect(() => {
    if (!open) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;
    const barCount = 18;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const freqData = audioService.getFrequencyData();
      const isAudioPlaying = audioService.isPlaying;

      const gap = 3;
      const totalGaps = (barCount - 1) * gap;
      const barWidth = Math.max(4, (width - totalGaps) / barCount);

      for (let i = 0; i < barCount; i++) {
        // Sample frequency bins smoothly across spectrum
        const binIndex = Math.min(freqData.length - 1, Math.floor((i / barCount) * (freqData.length * 0.85)));
        const rawValue = freqData[binIndex] || 0;

        let normalized = rawValue / 255;
        if (!isAudioPlaying) {
          // Idle ambient pulse
          normalized = 0.05 + Math.sin(Date.now() / 400 + i * 0.4) * 0.03;
        }

        const barHeight = Math.max(3, normalized * (height - 4));
        const x = i * (barWidth + gap);
        const y = height - barHeight;

        // Gradient: Lime to Purple
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, "#a3e635");
        grad.addColorStop(0.65, "#84cc16");
        grad.addColorStop(1, "#c084fc");

        ctx.fillStyle = grad;

        // Rounded bar
        ctx.beginPath();
        const radius = Math.min(barWidth / 2, 3);
        ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 1, 1]);
        ctx.fill();

        // Neon Glow on top cap
        if (normalized > 0.3) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x + 1, y, Math.max(1, barWidth - 2), 2);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [open]);

  const handleBandChange = (band, val) => {
    audioService.setBandGain(band, val);
  };

  const handleBandReset = (band) => {
    audioService.setBandGain(band, 0);
  };

  const handlePreset = (presetId) => {
    audioService.applyPreset(presetId);
  };

  const handleToggleLowpass = () => {
    audioService.setLowpassFX(!eqState.lowpass);
  };

  const handleResetAll = () => {
    audioService.resetEQ();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-[#121212] border-[#262626] text-white p-6 rounded-3xl shadow-2xl">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1c231d] border border-[#2e402d] text-[#a3e635] flex items-center justify-center shadow-[0_0_12px_rgba(163,230,53,0.15)]">
              <Sliders size={20} />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-white m-0 tracking-tight flex items-center gap-2">
                DJ Эквалайзер
                {eqState.isFXActive && (
                  <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-pulse" />
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400 m-0">
                Web Audio 3-полосный тон и пространственные эффекты
              </DialogDescription>
            </div>
          </div>

          <button
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 text-xs font-semibold transition-all cursor-pointer active:scale-95"
            title="Сбросить все настройки в 0 dB"
          >
            <RotateCcw size={13} />
            Сброс
          </button>
        </div>

        {/* ═══ LIVE VISUALIZER CANVAS ═════════════════════════════════════════ */}
        <div className="mb-5 p-3 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] shadow-inner relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1">
              <Zap size={10} className="text-[#a3e635]" />
              Спектрограмма (AnalyserNode)
            </span>
            <span className="text-[10px] font-mono text-[#a3e635]">
              {audioService.isPlaying ? "LIVE" : "IDLE"}
            </span>
          </div>

          <canvas
            ref={canvasRef}
            width={400}
            height={60}
            className="w-full h-14 rounded-lg block"
          />
        </div>

        {/* ═══ БЫСТРЫЕ ПРЕСЕТЫ ═════════════════════════════════════════════════ */}
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
            Быстрые пресеты
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map((p) => {
              const isActive = eqState.preset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePreset(p.id)}
                  className={cn(
                    "py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95",
                    isActive
                      ? "bg-[#1c231d] border border-[#a3e635]/60 text-[#a3e635] shadow-[0_0_12px_rgba(163,230,53,0.18)]"
                      : "bg-[#171717] border border-[#262626] text-neutral-300 hover:border-neutral-500 hover:text-white"
                  )}
                >
                  <span className="text-sm">{p.icon}</span>
                  <span className="truncate">{p.label.replace(/^[^\s]+\s*/, "")}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ 3 ВЕРТИКАЛЬНЫХ СЛАЙДЕРА (BASS, MID, TREBLE) ═════════════════════ */}
        <div className="mb-5 p-4 rounded-2xl bg-[#171717] border border-[#242424]">
          <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono px-2 mb-2">
            <span>+12 dB</span>
            <span className="text-neutral-400 font-bold">0 dB</span>
            <span>-12 dB</span>
          </div>

          <div className="flex items-center justify-around gap-2">
            {BANDS.map((band) => (
              <VerticalSlider
                key={band.id}
                band={band}
                value={eqState[band.id] ?? 0}
                onChange={(v) => handleBandChange(band.id, v)}
                onReset={() => handleBandReset(band.id)}
              />
            ))}
          </div>
        </div>

        {/* ═══ DJ-ТУМБЛЕР «🚪 ЗВУК ЗА ДВЕРЬЮ» (LOWPASS 400Hz) ═══════════════════ */}
        <div
          onClick={handleToggleLowpass}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none active:scale-98",
            eqState.lowpass
              ? "bg-gradient-to-r from-amber-950/40 to-orange-950/30 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              : "bg-[#171717] border-[#262626] hover:border-[#383838]"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                eqState.lowpass
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-[#202020] text-neutral-400"
              )}
            >
              <DoorClosed size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white">🚪 Звук за дверью</p>
                {eqState.lowpass && (
                  <span className="text-[10px] font-black text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
                    ON · 400 Hz
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                DJ Lowpass фильтр: эффект музыки из соседней комнаты
              </p>
            </div>
          </div>

          {/* Toggle pill */}
          <div
            className={cn(
              "w-12 h-6 rounded-full transition-colors relative shrink-0 p-0.5",
              eqState.lowpass ? "bg-amber-500" : "bg-[#282828]"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200",
                eqState.lowpass ? "translate-x-6" : "translate-x-0"
              )}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EqualizerModal;
