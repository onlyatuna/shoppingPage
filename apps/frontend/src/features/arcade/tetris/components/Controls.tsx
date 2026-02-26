import React from 'react';

interface ControlsProps {
  onMove: (dx: number, dy: number) => void;
  onRotate: () => void;
  onHardDrop: () => void;
  onHold: () => void;
  onPause: () => void;
  onReset: () => void;
  onKeyDown: (key: string) => void;
  onKeyUp: (key: string) => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  onMove, onRotate, onHardDrop, onHold, onPause, onReset, onKeyDown, onKeyUp 
}) => {
  
  // Use pointer events for immediate response and preventing ghost clicks
  // Removed 'action' callback to prevent double firing (once via onKeyDown, once via action)
  const bindBtn = (key: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onKeyDown(key);
    },
    onPointerUp: (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onKeyUp(key);
    },
    onPointerLeave: (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onKeyUp(key);
    },
    onPointerCancel: (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onKeyUp(key);
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  return (
    <div className="w-full h-full px-2 md:px-4 pb-2 md:pb-8 max-w-2xl mx-auto select-none relative">
       
       {/* Main Layout Container */}
       <div className="flex justify-between items-end h-full pt-4">
           
           {/* Left Side: D-PAD */}
           <div className="relative w-40 h-40 shrink-0 mb-2">
               {/* D-Pad Base Cross (Visual) */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-12 bg-zinc-800 rounded-sm shadow-[2px_2px_5px_rgba(0,0,0,0.5)] z-0" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-full bg-zinc-800 rounded-sm shadow-[2px_2px_5px_rgba(0,0,0,0.5)] z-0" />
               {/* Center Pivot Depression */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-full z-10 opacity-80" />

               {/* UP (Rotate) */}
               <button
                    {...bindBtn('ArrowUp')}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-14 z-20 flex justify-center pt-2 active:brightness-75 group touch-manipulation"
                    aria-label="Rotate"
                >
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-zinc-600/50 group-active:border-b-zinc-400" />
                </button>

                {/* DOWN (Soft Drop) */}
                <button
                    {...bindBtn('ArrowDown')}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-14 z-20 flex justify-center items-end pb-2 active:brightness-75 group touch-manipulation"
                    aria-label="Soft Drop"
                >
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-zinc-600/50 group-active:border-t-zinc-400" />
                </button>

                {/* LEFT (Move) */}
                <button
                    {...bindBtn('ArrowLeft')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-14 h-12 z-20 flex items-center justify-start pl-2 active:brightness-75 group touch-manipulation"
                    aria-label="Left"
                >
                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-zinc-600/50 group-active:border-r-zinc-400" />
                </button>

                {/* RIGHT (Move) */}
                <button
                    {...bindBtn('ArrowRight')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-14 h-12 z-20 flex items-center justify-end pr-2 active:brightness-75 group touch-manipulation"
                    aria-label="Right"
                >
                     <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-zinc-600/50 group-active:border-l-zinc-400" />
                </button>
           </div>

           {/* Center: Start/Select */}
           <div className="flex gap-3 mb-6 items-end justify-center px-1">
                {/* Select (Reset for now, common mapping in emulators for utility) */}
                <div className="flex flex-col items-center gap-1 transform rotate-[-20deg] translate-y-2">
                    <button 
                        onClick={onReset}
                        className="w-12 h-3.5 bg-slate-700 rounded-full shadow-[0_2px_0_rgba(0,0,0,0.5)] active:translate-y-[2px] active:shadow-none border border-slate-600 touch-manipulation"
                    />
                    <span className="text-[8px] font-bold text-slate-500 tracking-widest font-mono">SELECT</span>
                </div>
                {/* Start (Pause) */}
                <div className="flex flex-col items-center gap-1 transform rotate-[-20deg] translate-y-2">
                    <button 
                        onClick={onPause}
                        className="w-12 h-3.5 bg-slate-700 rounded-full shadow-[0_2px_0_rgba(0,0,0,0.5)] active:translate-y-[2px] active:shadow-none border border-slate-600 touch-manipulation"
                    />
                    <span className="text-[8px] font-bold text-slate-500 tracking-widest font-mono">START</span>
                </div>
           </div>

           {/* Right Side: A/B Buttons */}
           <div className="relative w-40 h-40 shrink-0 mb-4">
                <div className="w-full h-full relative">
                    {/* B Button (Hold) - Lower Left */}
                    <div className="absolute bottom-2 left-0 flex flex-col items-center gap-1 group">
                        <button
                            {...bindBtn('c')}
                            className="w-16 h-16 rounded-full bg-red-700 shadow-[0_4px_0_#7f1d1d,0_5px_5px_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-1 border-t border-red-500 flex items-center justify-center touch-manipulation relative overflow-hidden"
                            aria-label="Hold"
                        >
                           <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20 pointer-events-none" />
                        </button>
                        <span className="font-bold text-slate-600 text-sm font-mono">B</span>
                    </div>

                    {/* A Button (Hard Drop) - Upper Right */}
                    <div className="absolute top-2 right-0 flex flex-col items-center gap-1 group">
                        <button
                           {...bindBtn(' ')}
                           className="w-16 h-16 rounded-full bg-red-700 shadow-[0_4px_0_#7f1d1d,0_5px_5px_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-1 border-t border-red-500 flex items-center justify-center touch-manipulation relative overflow-hidden"
                           aria-label="Hard Drop"
                        >
                           <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20 pointer-events-none" />
                        </button>
                         <span className="font-bold text-slate-600 text-sm font-mono">A</span>
                    </div>
                </div>
           </div>
       </div>

       {/* Aesthetics: Speakers & Text */}
       <div className="absolute bottom-1 right-2 w-16 h-8 flex flex-col gap-1.5 opacity-30 pointer-events-none">
           <div className="w-full h-1 bg-black rounded-full rotate-[-10deg]" />
           <div className="w-full h-1 bg-black rounded-full rotate-[-10deg]" />
           <div className="w-full h-1 bg-black rounded-full rotate-[-10deg]" />
           <div className="w-full h-1 bg-black rounded-full rotate-[-10deg]" />
       </div>
       
       <div className="absolute bottom-2 left-4 opacity-40 pointer-events-none">
           <span className="text-[9px] font-mono border border-slate-600 px-1.5 py-0.5 rounded text-slate-500">PHONES</span>
       </div>

    </div>
  );
};

export default Controls;