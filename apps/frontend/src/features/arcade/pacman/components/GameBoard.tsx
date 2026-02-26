
import React from 'react';
import { MAP_LAYOUT, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, FRIGHTENED_DURATION } from '../constants';
import { Pacman, Ghost } from '../types';

interface GameBoardProps {
  dots: boolean[][];
  powerPellets: { x: number; y: number }[];
  pacman: Pacman;
  ghosts: Ghost[];
  frightenedMode: boolean;
  frightenedTimer: number;
}

const PacmanCharacter: React.FC<{ pacman: Pacman }> = ({ pacman }) => {
  const rotation = {
    right: 'rotate-0',
    down: 'rotate-90',
    left: 'rotate-180',
    up: 'rotate-[270deg]',
  };
  
  const mouthOpen = pacman.animationFrame < 2;

  return (
    <div
      className="absolute transition-all duration-100 ease-linear"
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        left: pacman.x * TILE_SIZE,
        top: pacman.y * TILE_SIZE,
        transform: rotation[pacman.dir],
      }}
    >
      <div className="relative w-full h-full">
         <div className={`w-full h-full bg-yellow-400 rounded-full ${mouthOpen ? 'clip-pacman-open' : ''}`}></div>
      </div>
       <style>{`
        .clip-pacman-open {
          clip-path: polygon(50% 50%, 100% 0, 100% 100%, 50% 50%, 0 75%, 0 25%);
        }
      `}</style>
    </div>
  );
};

const GhostCharacter: React.FC<{ ghost: Ghost; frightenedMode: boolean; frightenedTimer: number }> = ({ ghost, frightenedMode, frightenedTimer }) => {
  const isFrightened = ghost.isFrightened && !ghost.isEaten;
  const isBlinking = isFrightened && frightenedTimer < 3000 && frightenedTimer % 1000 > 500;

  let bgColor = ghost.color;
  if (isFrightened) {
    bgColor = isBlinking ? 'bg-white' : 'bg-blue-600';
  }
  
  if (ghost.isEaten) {
    return (
        <div
        className="absolute transition-all duration-100 ease-linear"
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          left: ghost.x * TILE_SIZE,
          top: ghost.y * TILE_SIZE,
          zIndex: 5,
        }}
        >
        <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-4 h-2 bg-white rounded-full"></div>
            <div className="w-4 h-2 bg-white rounded-full -ml-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute transition-all duration-100 ease-linear"
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        left: ghost.x * TILE_SIZE,
        top: ghost.y * TILE_SIZE,
        zIndex: 5,
      }}
    >
      <div className={`relative w-full h-full ${bgColor} rounded-t-full`}>
        <div className="absolute bottom-0 w-full h-4 overflow-hidden">
            <div className={`absolute bottom-0 w-1/3 h-4 ${bgColor} rounded-b-full left-0`}></div>
            <div className={`absolute bottom-0 w-1/3 h-4 ${bgColor} rounded-b-full left-1/3`}></div>
            <div className={`absolute bottom-0 w-1/3 h-4 ${bgColor} rounded-b-full left-2/3`}></div>
        </div>

        <div className="absolute w-full flex justify-center top-1/4">
            <div className={`w-1/3 h-1/3 ${isFrightened ? 'bg-red-500' : 'bg-white'} rounded-full`}></div>
            <div className={`w-1/3 h-1/3 ${isFrightened ? 'bg-red-500' : 'bg-white'} rounded-full ml-1`}></div>
        </div>
      </div>
    </div>
  );
};

const GameBoard: React.FC<GameBoardProps> = ({ dots, powerPellets, pacman, ghosts, frightenedMode, frightenedTimer }) => {
  return (
    <div className="bg-black border-2 border-blue-600 relative overflow-hidden" 
         style={{ width: MAP_WIDTH * TILE_SIZE, height: MAP_HEIGHT * TILE_SIZE }}>
      {MAP_LAYOUT.map((row, y) =>
        row.map((tile, x) => {
          if (tile === 1) {
            return (
              <div
                key={`${x}-${y}`}
                className="bg-blue-600"
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  position: 'absolute',
                  left: x * TILE_SIZE,
                  top: y * TILE_SIZE,
                }}
              />
            );
          }
          if (dots[y]?.[x]) {
            return (
              <div
                key={`dot-${x}-${y}`}
                className="flex items-center justify-center"
                 style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  position: 'absolute',
                  left: x * TILE_SIZE,
                  top: y * TILE_SIZE,
                }}
              >
                  <div className="w-1 h-1 bg-yellow-200 rounded-full"></div>
              </div>
            )
          }
          if (powerPellets.some(p => p.x === x && p.y === y)) {
            return (
              <div
                key={`pellet-${x}-${y}`}
                className="flex items-center justify-center"
                 style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  position: 'absolute',
                  left: x * TILE_SIZE,
                  top: y * TILE_SIZE,
                }}
              >
                  <div className="w-2 h-2 bg-yellow-200 rounded-full animate-pulse"></div>
              </div>
            )
          }
          return null;
        })
      )}
      <PacmanCharacter pacman={pacman} />
      {ghosts.map(ghost => (
        <GhostCharacter key={ghost.name} ghost={ghost} frightenedMode={frightenedMode} frightenedTimer={frightenedTimer} />
      ))}
    </div>
  );
};

export default GameBoard;
