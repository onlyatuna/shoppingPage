import React from 'react';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../constants';

// We don't need Grid/ActivePiece props anymore as the engine handles drawing directly to canvas
interface GameBoardProps {
  canvasRef: React.Ref<HTMLCanvasElement>;
  className?: string;
  grid?: any; // Kept for interface compatibility but unused
  activePiece?: any; // Kept for interface compatibility but unused
}

const CELL_SIZE = 24; 

const GameBoard: React.FC<GameBoardProps> = ({ canvasRef, className }) => {
  return (
    <div className={`relative border-4 border-slate-700 rounded-lg shadow-2xl bg-slate-800 ${className}`}>
      <canvas
        ref={canvasRef}
        width={BOARD_WIDTH * CELL_SIZE}
        height={BOARD_HEIGHT * CELL_SIZE}
        className="block w-full h-full"
        style={{
            imageRendering: 'pixelated'
        }}
      />
    </div>
  );
};

export default GameBoard;