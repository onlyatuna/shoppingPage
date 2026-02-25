import React from 'react';
import { Power, RotateCw, Timer, Leaf } from 'lucide-react';
import { FanSpeed } from '@/features/breeze3d/types';

interface ControlsProps {
  speed: FanSpeed;
  isOscillating: boolean;
  natureMode: boolean;
  timerLeft: number | null;
  onSpeedChange: (speed: FanSpeed) => void;
  onOscillationToggle: () => void;
  onNatureModeToggle: () => void;
  onSetTimer: (seconds: number | null) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  speed,
  isOscillating,
  natureMode,
  timerLeft,
  onSpeedChange,
  onOscillationToggle,
  onNatureModeToggle,
  onSetTimer
}) => {
  return (
    <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 w-[95%] sm:w-auto max-w-md animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xl flex flex-col gap-3 sm:gap-6">

        {/* Speed Controls */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-4">
          <button
            onClick={() => onSpeedChange(0)}
            className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl transition-all ${speed === 0
              ? 'bg-red-500/20 text-red-500 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
              : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
          >
            <Power size={18} className="sm:w-6 sm:h-6" />
          </button>

          {[1, 2, 3, 4].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s as FanSpeed)}
              className={`flex-1 py-2 sm:py-3 px-2 sm:px-6 rounded-xl sm:rounded-2xl font-black transition-all flex flex-col items-center gap-0.5 sm:gap-1 ${speed === s
                ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-105'
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
            >
              <span className="text-[10px] sm:text-xs tracking-tighter opacity-70">
                {s === 1 ? '微' : s === 2 ? '弱' : s === 3 ? '強' : '猛'}
              </span>
              <span className="text-sm sm:text-xl">{s}</span>
            </button>
          ))}
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
          <button
            onClick={onOscillationToggle}
            className={`flex flex-col items-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl sm:rounded-2xl transition-all ${isOscillating
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
          >
            <RotateCw size={16} className={`sm:w-5 sm:h-5 ${isOscillating ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            <span className="text-[10px] sm:text-xs font-bold">{window.innerWidth < 640 ? '擺頭' : '擺頭轉向'}</span>
          </button>

          <button
            onClick={onNatureModeToggle}
            className={`flex flex-col items-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl sm:rounded-2xl transition-all ${natureMode
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
              : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
          >
            <Leaf size={16} className={`sm:w-5 sm:h-5 ${natureMode ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] sm:text-xs font-bold">{window.innerWidth < 640 ? '自然風' : '自然微風'}</span>
          </button>

          <button
            onClick={() => onSetTimer(timerLeft ? null : 30)}
            className={`flex flex-col items-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl sm:rounded-2xl transition-all ${timerLeft
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
          >
            <Timer size={16} className="sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-bold">{window.innerWidth < 640 ? '定時' : '預約定時'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
