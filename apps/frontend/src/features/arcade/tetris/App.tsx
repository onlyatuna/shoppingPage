import React, { useEffect, useRef } from 'react';
import { useTetris } from './hooks/useTetris';
import GameBoard from './components/GameBoard';
import { ScoreBoard, NextHoldPanel } from './components/StatPanel';
import Controls from './components/Controls';
import { Play, Pause, RefreshCw, Gamepad2 } from 'lucide-react';

const App: React.FC = () => {
  const {
    score,
    highScore,
    level,
    lines,
    nextQueue,
    holdPiece,
    gameOver,
    paused,
    setPaused,
    startGame,
    move,
    rotate,
    hardDrop,
    hold,
    canvasRef,
    onKeyDown,
    onKeyUp,
  } = useTetris();

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'Enter') {
          if (gameOver) startGame();
          return;
      }
      onKeyDown(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
       onKeyUp(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onKeyDown, onKeyUp, gameOver, startGame]);

  // Touch Gesture Logic
  const touchStartRef = useRef<{x: number, y: number, time: number} | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const start = touchStartRef.current;
      const end = e.changedTouches[0];
      const dx = end.clientX - start.x;
      const dy = end.clientY - start.y;
      const dt = Date.now() - start.time;

      // Swipe thresholds
      const SWIPE_DIST = 50;
      const TAP_TIME = 200;

      if (dt < TAP_TIME && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
          // Tap
          const width = window.innerWidth;
          const x = end.clientX;
          
          if (x < width * 0.35) {
              move(-1, 0); // Tap Left Zone
          } else if (x > width * 0.65) {
              move(1, 0); // Tap Right Zone
          } else {
              rotate(); // Tap Center Zone
          }
      } else {
          // Swipe
          if (Math.abs(dy) > Math.abs(dx)) {
              // Vertical
              if (dy > SWIPE_DIST) {
                  hardDrop(); // Swipe Down
              } else if (dy < -SWIPE_DIST) {
                  hold(); // Swipe Up
              }
          }
      }
      touchStartRef.current = null;
  };

  // Logic for Reset Button (Select)
  const handleReset = () => {
    // Only allow reset if game is paused or over to prevent accidental resets
    if (paused || gameOver) {
        startGame();
    }
  };

  return (
    <div 
      className="h-[100dvh] bg-slate-900 flex flex-col items-center p-2 md:p-4 font-sans text-slate-100 overflow-hidden select-none relative"
    >
      {/* Mobile Background Header (Subtle) */}
      <header className="flex justify-center items-center gap-2 z-0 opacity-80 md:opacity-100 mb-1 md:mb-4 shrink-0">
        <Gamepad2 className="w-5 h-5 md:w-8 md:h-8 text-cyan-400" />
        <h1 className="text-lg md:text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent tracking-tight">
          NEON TETRIS
        </h1>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl min-h-0 flex flex-col md:flex-row items-center md:items-start justify-center gap-0 md:gap-12 relative">
        
        {/* Desktop Left Column */}
        <div className="hidden md:flex flex-col gap-6 w-40 items-end pt-8">
          <NextHoldPanel nextQueue={nextQueue} holdPiece={holdPiece} />
          <div className="mt-8 text-xs text-slate-500 text-right space-y-2">
             <p className="flex justify-end gap-2"><span>Move</span> <b className="text-cyan-500">Arrows</b></p>
             <p className="flex justify-end gap-2"><span>Rotate</span> <b className="text-cyan-500">Up</b></p>
             <p className="flex justify-end gap-2"><span>Drop</span> <b className="text-cyan-500">Space</b></p>
             <p className="flex justify-end gap-2"><span>Hold</span> <b className="text-cyan-500">C</b></p>
          </div>
        </div>

        {/* Mobile Stats Row (Replaces absolute positioning to fix overlap) */}
        <div className="flex md:hidden w-full justify-between items-start px-2 gap-2 shrink-0 z-20 mb-2">
            <div className="origin-top-left scale-90">
               {/* Vertical layout for ScoreBoard to be compact on left */}
               <ScoreBoard score={score} highScore={highScore} level={level} lines={lines} vertical={true} />
            </div>
            <div className="origin-top-right scale-90">
               {/* Vertical layout for Next/Hold (Hold top, Next bottom) */}
               <NextHoldPanel nextQueue={nextQueue} holdPiece={holdPiece} vertical={true} />
            </div>
        </div>

        {/* Center Column: Game Board */}
        {/* Changed h-[72vh] to flex-1 min-h-0 to adapt to available space */}
        <div className="relative flex-1 min-h-0 aspect-[10/20] shadow-2xl border-x-2 md:border-x-4 border-slate-800 bg-black/30 rounded-md z-10">
          <GameBoard canvasRef={canvasRef} className="w-full h-full" />
          
          {/* Gesture Overlay */}
          <div 
             className="absolute inset-0 z-30 touch-manipulation md:hidden"
             onTouchStart={handleTouchStart}
             onTouchEnd={handleTouchEnd}
          />

          {/* Overlays */}
          {gameOver && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-40 animate-in fade-in zoom-in duration-300">
              <h2 className="text-4xl md:text-6xl font-black text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] tracking-tight">GAME OVER</h2>
              <div className="text-center mb-10 space-y-2">
                <p className="text-slate-400 uppercase text-xs tracking-[0.2em] mb-1">Final Score</p>
                <p className="text-5xl font-mono text-white font-bold">{score.toLocaleString()}</p>
                <div className="inline-block px-3 py-1 bg-slate-800 rounded-full mt-2 border border-slate-700">
                   <p className="text-cyan-400 text-sm font-mono">Best: {highScore.toLocaleString()}</p>
                </div>
              </div>
              <button 
                onClick={startGame}
                className="group relative px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full transition-all shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_30px_rgba(8,145,178,0.6)] flex items-center gap-3 overflow-hidden transform hover:-translate-y-1"
              >
                <span className="relative z-10 flex items-center gap-2 text-lg"><RefreshCw size={24} /> Play Again</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          )}

          {/* Pause Overlay */}
          {paused && !gameOver && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-40">
              <h2 className="text-4xl font-black text-yellow-400 mb-8 tracking-[0.2em] drop-shadow-xl">PAUSED</h2>
              <button 
                onClick={() => setPaused()}
                className="px-10 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-full border border-slate-600 transition-all shadow-xl flex items-center gap-3 hover:scale-105"
              >
                <Play size={24} /> Resume
              </button>
            </div>
          )}
        </div>

        {/* Desktop Right Column */}
        <div className="hidden md:flex flex-col gap-6 w-48 pt-8">
           <ScoreBoard score={score} highScore={highScore} level={level} lines={lines} />
        </div>

      </div>

      {/* Mobile Controls */}
      <div className="md:hidden flex-none w-full pb-6 z-20 mt-2">
        <Controls 
          onMove={move} 
          onRotate={rotate} 
          onHardDrop={hardDrop} 
          onHold={hold}
          onPause={() => setPaused()}
          onReset={handleReset}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
        />
      </div>

    </div>
  );
};

export default App;