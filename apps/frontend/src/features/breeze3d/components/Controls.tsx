import React, { useState } from 'react';
import { FanSpeed } from '@/features/breeze3d/types';
import { Wind, RotateCw, Power, Leaf, Clock, ChevronDown } from 'lucide-react';

interface ControlsProps {
  speed: FanSpeed;
  isOscillating: boolean;
  natureMode: boolean;
  timerLeft: number | null;
  onSpeedChange: (speed: FanSpeed) => void;
  onOscillationToggle: () => void;
  onNatureModeToggle: () => void;
  onSetTimer: (minutes: number | null) => void;
}

const getSpeedLabel = (level: number) => {
  switch (level) {
    case 0: return '關閉';
    case 1: return '微風';
    case 2: return '弱風';
    case 3: return '強風';
    case 4: return '超強';
    default: return '';
  }
};

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
  const [showTimerOptions, setShowTimerOptions] = useState(false);
  const timerOptions = [null, 10, 30, 60, 120];

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl shadow-2xl w-[90%] max-w-lg z-50">
      <div className="flex flex-col gap-6">

        {/* Header Display */}
        <div className="flex justify-between items-center px-2">
          <div>
            <h2 className="text-white font-bold text-lg italic tracking-tight">BREEZE MASTER <span className="text-blue-500">3000</span></h2>
            <p className="text-gray-400 text-xs uppercase tracking-wider">
              狀態: <span className={speed > 0 ? "text-green-400" : "text-red-400"}>{speed > 0 ? `運行中 (${natureMode ? '自然' : '恆定'})` : '待機中'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {natureMode && <Leaf className="w-5 h-5 text-green-400 animate-bounce" />}
            <Wind className={`w-6 h-6 ${speed > 0 ? 'text-blue-400 animate-pulse' : 'text-gray-600'}`} />
          </div>
        </div>

        {/* Speed Controls */}
        <div className="grid grid-cols-5 gap-2 bg-black/20 p-1.5 rounded-xl">
          {[0, 1, 2, 3, 4].map((lvl) => {
            const isActive = speed === lvl;
            return (
              <button
                key={lvl}
                onClick={() => onSpeedChange(lvl as FanSpeed)}
                className={`
                  relative group overflow-hidden rounded-lg py-3 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-105 font-bold'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}
                `}
              >
                {lvl === 0 ? <Power size={18} /> : <span className="text-lg">{lvl}</span>}
                <span className="text-[10px] mt-1 opacity-70">
                  {getSpeedLabel(lvl)}
                </span>
                {isActive && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_5px_#4ade80]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Function Toggles */}
        <div className="grid grid-cols-3 gap-2">
          {/* Oscillation */}
          <button
            onClick={onOscillationToggle}
            className={`
               rounded-xl py-3 flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer border
               ${isOscillating
                ? 'bg-purple-600/20 text-purple-400 border-purple-500/50 shadow-[0_0_10px_rgba(147,51,234,0.2)]'
                : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white'}
            `}
          >
            <RotateCw size={18} className={`${isOscillating ? 'animate-spin-slow' : ''}`} />
            <span className="text-xs font-medium">擺頭轉向</span>
          </button>

          {/* Nature Mode */}
          <button
            onClick={onNatureModeToggle}
            className={`
               rounded-xl py-3 flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer border
               ${natureMode
                ? 'bg-green-600/20 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white'}
            `}
          >
            <Leaf size={18} />
            <span className="text-xs font-medium">自然微風</span>
          </button>

          {/* Timer */}
          <div className="relative">
            <button
              onClick={() => setShowTimerOptions(!showTimerOptions)}
              className={`
                w-full h-full rounded-xl py-3 flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer border
                ${timerLeft !== null
                  ? 'bg-orange-600/20 text-orange-400 border-orange-500/50'
                  : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white'}
              `}
            >
              <Clock size={18} />
              <span className="text-xs font-medium">{timerLeft ? `${timerLeft}s` : '預約定時'}</span>
              <ChevronDown size={14} className={`transition-transform ${showTimerOptions ? 'rotate-180' : ''}`} />
            </button>

            {showTimerOptions && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[60] animate-in slide-in-from-bottom-2 fade-in">
                {timerOptions.map((opt) => (
                  <button
                    key={opt === null ? 'off' : opt}
                    onClick={() => {
                      onSetTimer(opt);
                      setShowTimerOptions(false);
                    }}
                    className="w-full py-2.5 text-xs text-gray-300 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                  >
                    {opt === null ? '取消定時' : `${opt} 秒`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
