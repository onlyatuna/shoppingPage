
import React, { useState, useEffect, useCallback } from 'react';
import GameBoard from './components/GameBoard';
import Scoreboard from './components/Scoreboard';
import {
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  INITIAL_PACMAN_POS,
  INITIAL_GHOSTS_POS,
  MAP_LAYOUT,
  GHOST_NAMES,
  DOT_SCORE,
  POWER_PELLET_SCORE,
  GHOST_SCORE,
  FRIGHTENED_DURATION,
  GHOST_RELEASE_DOT_COUNT
} from './constants';
import { GameState, Pacman, Ghost } from './types';
import { isWall, getOppositeDirection, getDistance } from './utils';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Ready);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [pacman, setPacman] = useState<Pacman>({ ...INITIAL_PACMAN_POS, dir: 'left', nextDir: 'left', isAnimating: false, animationFrame: 0 });
  const [ghosts, setGhosts] = useState<Ghost[]>(INITIAL_GHOSTS_POS);
  const [dots, setDots] = useState<boolean[][]>([]);
  const [powerPellets, setPowerPellets] = useState<{ x: number; y: number }[]>([]);
  const [dotCount, setDotCount] = useState(0);
  const [initialDotCount, setInitialDotCount] = useState(0);

  const [frightenedMode, setFrightenedMode] = useState(false);
  const [frightenedTimer, setFrightenedTimer] = useState(0);
  const [ghostsEaten, setGhostsEaten] = useState(0);

  const resetLevel = useCallback(() => {
    setPacman({ ...INITIAL_PACMAN_POS, dir: 'left', nextDir: 'left', isAnimating: false, animationFrame: 0 });
    setGhosts(INITIAL_GHOSTS_POS.map(g => ({...g, x: g.startX, y: g.startY, isFrightened: false, isEaten: false, isReleased: false})));
    setFrightenedMode(false);
    setFrightenedTimer(0);
    setGhostsEaten(0);
  }, []);

  const initializeMap = useCallback(() => {
    let newDotCount = 0;
    const newPowerPellets: { x: number; y: number }[] = [];
    const newDots = MAP_LAYOUT.map((row, y) =>
      row.map((tile, x) => {
        if (tile === 2) {
          newDotCount++;
          return true;
        }
        if (tile === 3) {
          newPowerPellets.push({ x, y });
        }
        return false;
      })
    );
    setDots(newDots);
    setPowerPellets(newPowerPellets);
    setDotCount(newDotCount);
    setInitialDotCount(newDotCount);
  }, []);

  const newGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setLevel(1);
    initializeMap();
    resetLevel();
    setGameState(GameState.Playing);
  }, [initializeMap, resetLevel]);

  useEffect(() => {
    initializeMap();
    setGameState(GameState.Ready);
  }, [initializeMap]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState === GameState.Playing) {
        let nextDir = pacman.nextDir;
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
            nextDir = 'up';
            break;
          case 'ArrowDown':
          case 's':
            nextDir = 'down';
            break;
          case 'ArrowLeft':
          case 'a':
            nextDir = 'left';
            break;
          case 'ArrowRight':
          case 'd':
            nextDir = 'right';
            break;
        }
        setPacman(p => ({ ...p, nextDir }));
    } else if (gameState === GameState.Ready || gameState === GameState.GameOver) {
      newGame();
    }
  }, [pacman.nextDir, gameState, newGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const movePacman = useCallback(() => {
    setPacman(p => {
        let { x, y, dir, nextDir } = p;
        let newX = x;
        let newY = y;
        let canMoveInNextDir = false;
        
        // Try to move in the next direction
        if (nextDir === 'left' && !isWall(x - 1, y)) canMoveInNextDir = true;
        if (nextDir === 'right' && !isWall(x + 1, y)) canMoveInNextDir = true;
        if (nextDir === 'up' && !isWall(x, y - 1)) canMoveInNextDir = true;
        if (nextDir === 'down' && !isWall(x, y + 1)) canMoveInNextDir = true;

        if (canMoveInNextDir) {
            dir = nextDir;
        }

        if (dir === 'left') newX--;
        if (dir === 'right') newX++;
        if (dir === 'up') newY--;
        if (dir === 'down') newY++;
        
        // Tunnel
        if (newX < 0) newX = MAP_WIDTH -1;
        if (newX >= MAP_WIDTH) newX = 0;

        if (!isWall(newX, newY)) {
            x = newX;
            y = newY;
        }

        return { ...p, x, y, dir, animationFrame: (p.animationFrame + 1) % 4};
    });
  }, []);

  const getGhostTarget = (ghost: Ghost, pacman: Pacman): { x: number; y: number } => {
    if (ghost.isEaten) {
      return ghost.scatterTarget; // Target ghost house
    }
    if (ghost.isFrightened) { // Random target
      return { x: Math.floor(Math.random() * MAP_WIDTH), y: Math.floor(Math.random() * MAP_HEIGHT) };
    }

    switch (ghost.name) {
      case 'Blinky': // Red: Targets Pac-Man directly
        return { x: pacman.x, y: pacman.y };
      case 'Pinky': // Pink: Targets 4 tiles ahead of Pac-Man
        let pTarget = { x: pacman.x, y: pacman.y };
        if (pacman.dir === 'up') pTarget.y -= 4;
        if (pacman.dir === 'down') pTarget.y += 4;
        if (pacman.dir === 'left') pTarget.x -= 4;
        if (pacman.dir === 'right') pTarget.x += 4;
        return pTarget;
      case 'Inky': // Cyan: Complex targeting
        return { x: pacman.x, y: pacman.y }; // Simplified for now
      case 'Clyde': // Orange: Targets Pac-Man if far, scatters if close
        if (getDistance({x: ghost.x, y: ghost.y}, {x: pacman.x, y: pacman.y}) > 8) {
          return { x: pacman.x, y: pacman.y };
        } else {
          return ghost.scatterTarget;
        }
      default:
        return { x: pacman.x, y: pacman.y };
    }
  };

  const moveGhosts = useCallback(() => {
    setGhosts(currentGhosts => currentGhosts.map(ghost => {
      let { x, y, dir, isReleased, name } = ghost;
      
      const eatenDots = initialDotCount - dotCount;
      if (!isReleased) {
        if (name === 'Blinky' || eatenDots > GHOST_RELEASE_DOT_COUNT[name]) {
            isReleased = true;
        } else {
            return {...ghost};
        }
      }
      
      const possibleMoves = [];
      const oppositeDir = getOppositeDirection(dir);

      if (dir !== 'down' && !isWall(x, y - 1)) possibleMoves.push('up');
      if (dir !== 'up' && !isWall(x, y + 1)) possibleMoves.push('down');
      if (dir !== 'right' && !isWall(x - 1, y)) possibleMoves.push('left');
      if (dir !== 'left' && !isWall(x + 1, y)) possibleMoves.push('right');

      let bestMove = dir;
      if (possibleMoves.length > 1 || !possibleMoves.includes(dir)) {
          let minDistance = Infinity;
          const target = getGhostTarget(ghost, pacman);

          for (const move of possibleMoves) {
              if (move === oppositeDir) continue;
              let nextX = x, nextY = y;
              if (move === 'left') nextX--;
              if (move === 'right') nextX++;
              if (move === 'up') nextY--;
              if (move === 'down') nextY++;
              const distance = getDistance({ x: nextX, y: nextY }, target);
              if (distance < minDistance) {
                  minDistance = distance;
                  bestMove = move;
              }
          }
      } else if (possibleMoves.length === 0) {
        bestMove = oppositeDir;
      }
      
      dir = bestMove;
      if (dir === 'left') x--;
      if (dir === 'right') x++;
      if (dir === 'up') y--;
      if (dir === 'down') y++;
      
      if (x < 0) x = MAP_WIDTH - 1;
      if (x >= MAP_WIDTH) x = 0;

      // Check if ghost reached home
      if (ghost.isEaten && x === ghost.startX && y === ghost.startY) {
        return { ...ghost, x, y, dir, isEaten: false, isFrightened: false };
      }

      return { ...ghost, x, y, dir, isReleased };
    }));
  }, [pacman, dotCount, initialDotCount]);

  const checkCollisions = useCallback(() => {
    // Ghosts
    ghosts.forEach((ghost, index) => {
      if (ghost.x === pacman.x && ghost.y === pacman.y) {
        if (ghost.isFrightened) {
          // Eat ghost
          const scoreGained = GHOST_SCORE * Math.pow(2, ghostsEaten);
          setScore(s => s + scoreGained);
          setGhostsEaten(g => g + 1);
          setGhosts(g => g.map((gh, i) => i === index ? { ...gh, isEaten: true, isFrightened: false } : gh));
        } else if (!ghost.isEaten) {
          // Pac-Man dies
          setLives(l => l - 1);
          if (lives - 1 <= 0) {
            setGameState(GameState.GameOver);
          } else {
            resetLevel();
          }
        }
      }
    });

    // Dots
    if (dots[pacman.y]?.[pacman.x]) {
      setDots(d => {
        const newDots = [...d];
        newDots[pacman.y][pacman.x] = false;
        return newDots;
      });
      setScore(s => s + DOT_SCORE);
      setDotCount(d => d - 1);
    }
    
    // Power Pellets
    const pelletIndex = powerPellets.findIndex(p => p.x === pacman.x && p.y === pacman.y);
    if (pelletIndex > -1) {
      setPowerPellets(p => p.filter((_, i) => i !== pelletIndex));
      setScore(s => s + POWER_PELLET_SCORE);
      setFrightenedMode(true);
      setFrightenedTimer(FRIGHTENED_DURATION);
      setGhostsEaten(0);
      setGhosts(g => g.map(gh => ({ ...gh, isFrightened: !gh.isEaten, dir: getOppositeDirection(gh.dir) })));
    }
  }, [pacman.x, pacman.y, ghosts, dots, powerPellets, lives, resetLevel, ghostsEaten]);

  const gameLoop = useCallback(() => {
    if (gameState !== GameState.Playing) return;

    movePacman();
    moveGhosts();
    checkCollisions();

    if (dotCount -1 <= 0 && powerPellets.length === 0) {
        setLevel(l => l + 1);
        initializeMap();
        resetLevel();
    }
  }, [gameState, movePacman, moveGhosts, checkCollisions, dotCount, powerPellets, initializeMap, resetLevel]);
  
  useEffect(() => {
    const interval = setInterval(gameLoop, 200);
    return () => clearInterval(interval);
  }, [gameLoop]);

  useEffect(() => {
    if (frightenedMode) {
      if (frightenedTimer > 0) {
        const timer = setTimeout(() => {
          setFrightenedTimer(t => t - 1000);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        setFrightenedMode(false);
        setGhosts(g => g.map(gh => ({ ...gh, isFrightened: false })));
      }
    }
  }, [frightenedMode, frightenedTimer]);

  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg md:max-w-xl lg:max-w-2xl">
        <Scoreboard score={score} lives={lives} level={level} />
        <div className="relative" style={{ width: MAP_WIDTH * TILE_SIZE, height: MAP_HEIGHT * TILE_SIZE }}>
          {(gameState === GameState.Ready || gameState === GameState.GameOver) && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10">
              <h1 className="text-4xl text-yellow-400 mb-4">{gameState === GameState.Ready ? "READY!" : "GAME OVER"}</h1>
              <p className="text-lg text-white">PRESS ANY KEY TO START</p>
            </div>
          )}
          <GameBoard 
            dots={dots}
            powerPellets={powerPellets}
            pacman={pacman}
            ghosts={ghosts}
            frightenedMode={frightenedMode}
            frightenedTimer={frightenedTimer}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
