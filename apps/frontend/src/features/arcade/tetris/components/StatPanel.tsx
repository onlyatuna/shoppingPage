import React from 'react';
import { Tetromino } from '../types';

interface NextHoldPanelProps {
  nextQueue: Tetromino[];
  holdPiece: Tetromino | null;
  vertical?: boolean;
}

interface ScoreBoardProps {
  score: number;
  highScore: number;
  level: number;
  lines: number;
  vertical?: boolean;
}

const MiniGrid: React.FC<{ piece: Tetromino | null; label: string }> = ({ piece, label }) => {
  return (
    <div className="bg-slate-800/80 md:bg-slate-800 p-2 md:p-3 rounded-lg md:rounded-xl border border-slate-700/50 md:border-2 md:border-slate-700 flex flex-col items-center justify-center aspect-square w-14 md:w-32 shadow-lg backdrop-blur-sm">
      <span className="text-[9px] md:text-sm text-slate-400 uppercase font-bold mb-1 md:mb-2 tracking-widest">{label}</span>
      {piece ? (
        <div 
          className="grid gap-0.5 md:gap-1" 
          style={{ 
            gridTemplateColumns: `repeat(${piece.shape[0].length}, 1fr)`,
          }}
        >
          {piece.shape.map((row, y) =>
            row.map((val, x) => (
              val ? (
                <div
                  key={`${x}-${y}`}
                  className="w-2.5 h-2.5 md:w-6 md:h-6 rounded-[1px] md:rounded-sm"
                  style={{ 
                    backgroundColor: piece.color, 
                    boxShadow: `0 0 8px ${piece.color}80`
                  }}
                />
              ) : <div key={`${x}-${y}`} className="w-2.5 h-2.5 md:w-6 md:h-6" />
            ))
          )}
        </div>
      ) : (
        <div className="text-slate-600 text-[8px] md:text-sm italic font-medium h-10 md:h-24 flex items-center">Empty</div>
      )}
    </div>
  );
};

export const NextHoldPanel: React.FC<NextHoldPanelProps> = ({ nextQueue, holdPiece, vertical = false }) => {
  return (
    <div className={`flex ${vertical ? 'flex-col' : 'flex-row md:flex-col'} gap-2 md:gap-6`}>
      <MiniGrid piece={holdPiece} label="Hold" />
      <MiniGrid piece={nextQueue[0]} label="Next" />
    </div>
  );
};

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ score, highScore, level, lines, vertical = false }) => {
  return (
    <div className={`bg-slate-800/80 md:bg-slate-800 p-2 md:p-5 rounded-lg md:rounded-xl border-l-2 md:border-l-4 border-cyan-500 shadow-xl backdrop-blur-sm min-w-[80px] md:min-w-[180px]`}>
      <div className={`flex ${vertical ? 'flex-col text-right' : 'flex-row md:flex-col justify-between md:justify-start'} gap-2 md:gap-4`}>
          <div className="flex flex-col gap-0.5 md:gap-2">
              <div>
                <h3 className="text-slate-500 md:text-slate-400 text-[8px] md:text-xs font-bold uppercase tracking-widest">Score</h3>
                <p className="text-sm md:text-3xl font-mono text-white drop-shadow-md leading-tight">{score.toLocaleString()}</p>
              </div>
              <div className="hidden md:block">
                <h3 className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Best</h3>
                <p className="text-sm md:text-xl font-mono text-cyan-200">{highScore.toLocaleString()}</p>
              </div>
          </div>
          
          <div className={`w-full h-px bg-slate-700/50 my-0.5 md:my-2 ${vertical ? 'block' : 'hidden md:block'}`} />
          
          <div className="flex flex-col gap-0.5 md:gap-2">
              <div>
                <h3 className="text-slate-500 md:text-slate-400 text-[8px] md:text-xs font-bold uppercase tracking-widest">Level</h3>
                <p className="text-xs md:text-2xl font-mono text-yellow-400 leading-tight">{level}</p>
              </div>
              <div>
                <h3 className="text-slate-500 md:text-slate-400 text-[8px] md:text-xs font-bold uppercase tracking-widest">Lines</h3>
                <p className="text-xs md:text-2xl font-mono text-green-400 leading-tight">{lines}</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default { NextHoldPanel, ScoreBoard };
