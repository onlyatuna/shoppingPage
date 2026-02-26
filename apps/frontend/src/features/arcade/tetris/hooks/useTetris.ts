import { useState, useEffect, useRef, useCallback } from 'react';
import { TETROMINOS, randomTetromino } from '../constants';

const ROWS = 20;
const COLS = 10;

export const useTetris = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game State Refs (Mutable for performance, won't trigger re-renders)
  const grid = useRef(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const piece = useRef<any>(null);
  const requestRef = useRef<number>(undefined);
  const lastTimeRef = useRef<number>(0);
  const dropCounter = useRef<number>(0);
  const dropInterval = useRef<number>(1000);

  // React State (For UI only)
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('tetris-best') || '0'));
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPausedState] = useState(false);
  const [nextQueue, setNextQueue] = useState<any[]>([]);
  const [holdPiece, setHoldPiece] = useState<any>(null);

  // Initialize Game
  const initGame = useCallback(() => {
    grid.current = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setPausedState(false);
    setHoldPiece(null);
    dropInterval.current = 1000;

    // Generate Bag
    const initialQueue = [randomTetromino(), randomTetromino(), randomTetromino(), randomTetromino()];
    setNextQueue(initialQueue);
    // Explicitly grab the first one to spawn
    const first = initialQueue[0];
    spawnPiece(first);
    // Remove the first one from queue and add a new one
    setNextQueue(prev => prev.slice(1).concat(randomTetromino()));
  }, []);

  const spawnPiece = (p: any) => {
    piece.current = {
      pos: { x: Math.floor(COLS / 2) - Math.floor(p.shape[0].length / 2), y: 0 },
      matrix: p.shape,
      color: p.color,
      type: p.type
    };
    // Check immediate collision (Game Over)
    if (collide(grid.current, piece.current)) {
      setGameOver(true);
    }
  };

  const collide = (arena: any[], p: any) => {
    const [m, o] = [p.matrix, p.pos];
    for (let y = 0; y < m.length; ++y) {
      for (let x = 0; x < m[y].length; ++x) {
        if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
          return true;
        }
      }
    }
    return false;
  };

  const merge = (arena: any[], p: any) => {
    p.matrix.forEach((row: any[], y: number) => {
      row.forEach((value: number, x: number) => {
        if (value !== 0) {
          arena[y + p.pos.y][x + p.pos.x] = p.color;
        }
      });
    });
  };

  const sweep = () => {
    let rowCount = 0;
    outer: for (let y = grid.current.length - 1; y >= 0; --y) {
      for (let x = 0; x < grid.current[y].length; ++x) {
        if (grid.current[y][x] === 0) continue outer;
      }
      const row = grid.current.splice(y, 1)[0].fill(0);
      grid.current.unshift(row);
      ++y;
      rowCount++;
    }
    if (rowCount > 0) {
      const points = [0, 40, 100, 300, 1200];
      setScore(prev => {
        const s = prev + points[rowCount] * level;
        if (s > highScore) {
          setHighScore(s);
          localStorage.setItem('tetris-best', s.toString());
        }
        return s;
      });
      setLines(l => l + rowCount);
      setLevel(_l => Math.floor((lines + rowCount) / 10) + 1);
      dropInterval.current = Math.max(100, 1000 - (level - 1) * 50);
    }
  };

  // Drawing Logic
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and fill background
    ctx.fillStyle = '#1e293b'; // slate-800 to match previous theme
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scaling
    const scale = canvas.width / COLS;

    // Helper: Draw Matrix
    const drawMatrix = (matrix: any[], offset: { x: number, y: number }, color: string | null, ghost = false) => {
      matrix.forEach((row, y) => {
        row.forEach((value: any, x: number) => {
          if (value !== 0) {
            ctx.fillStyle = ghost ? `${color}40` : (color || value); // value is color string in grid
            ctx.fillRect((x + offset.x) * scale, (y + offset.y) * scale, scale - 1, scale - 1);

            // Neon Glow / Border Effect
            if (!ghost) {
              ctx.strokeStyle = 'rgba(255,255,255,0.3)';
              ctx.lineWidth = 1;
              ctx.strokeRect((x + offset.x) * scale, (y + offset.y) * scale, scale - 1, scale - 1);
            } else {
              ctx.strokeStyle = color || '#fff';
              ctx.lineWidth = 1;
              ctx.strokeRect((x + offset.x) * scale, (y + offset.y) * scale, scale - 1, scale - 1);
            }
          }
        });
      });
    };

    // Draw Grid
    drawMatrix(grid.current, { x: 0, y: 0 }, null);

    // Draw Ghost Piece
    if (piece.current) {
      const ghost = { ...piece.current, pos: { ...piece.current.pos } };
      while (!collide(grid.current, ghost)) {
        ghost.pos.y++;
      }
      ghost.pos.y--;
      drawMatrix(ghost.matrix, ghost.pos, piece.current.color, true);

      // Draw Active Piece
      drawMatrix(piece.current.matrix, piece.current.pos, piece.current.color);
    }
  };

  // Game Loop
  const update = (time: number) => {
    if (gameOver || paused) return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    dropCounter.current += deltaTime;
    if (dropCounter.current > dropInterval.current) {
      playerDrop();
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  // Controls
  const playerDrop = () => {
    if (!piece.current) return;
    piece.current.pos.y++;
    if (collide(grid.current, piece.current)) {
      piece.current.pos.y--;
      merge(grid.current, piece.current);
      spawnPiece(nextQueue[0]);
      setNextQueue(prev => prev.slice(1).concat(randomTetromino()));
      sweep();
      dropCounter.current = 0;
    }
    dropCounter.current = 0;
  };

  const playerMove = (dir: number) => {
    if (!piece.current || paused || gameOver) return;
    piece.current.pos.x += dir;
    if (collide(grid.current, piece.current)) {
      piece.current.pos.x -= dir;
    }
  };

  const playerRotate = () => {
    if (!piece.current || paused || gameOver) return;
    const pos = piece.current.pos.x;
    let offset = 1;
    const rotateMatrix = (matrix: any[]) => {
      return matrix[0].map((_: any, index: number) => matrix.map((row: any) => row[index]).reverse());
    };
    const originalMatrix = piece.current.matrix;
    piece.current.matrix = rotateMatrix(piece.current.matrix);

    // Wall kick (basic)
    while (collide(grid.current, piece.current)) {
      piece.current.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > piece.current.matrix[0].length) {
        piece.current.matrix = originalMatrix; // Rotate back
        piece.current.pos.x = pos;
        return;
      }
    }
  };

  const hardDrop = () => {
    if (!piece.current || paused || gameOver) return;
    while (!collide(grid.current, piece.current)) {
      piece.current.pos.y++;
    }
    piece.current.pos.y--;
    merge(grid.current, piece.current);
    spawnPiece(nextQueue[0]);
    setNextQueue(prev => prev.slice(1).concat(randomTetromino()));
    sweep();
    dropCounter.current = 0;
  };

  const hold = () => {
    if (!piece.current || paused || gameOver) return;
    if (!holdPiece) {
      setHoldPiece({ shape: piece.current.matrix, color: piece.current.color, type: piece.current.type });
      spawnPiece(nextQueue[0]);
      setNextQueue(prev => prev.slice(1).concat(randomTetromino()));
    } else {
      const temp = { ...holdPiece };
      setHoldPiece({ shape: piece.current.matrix, color: piece.current.color, type: piece.current.type });
      // Find original definition to restore standard orientation
      const type = temp.type as keyof typeof TETROMINOS;
      const original = TETROMINOS[type];
      if (original) {
        spawnPiece({ ...original, type });
      } else {
        // Fallback if needed
        spawnPiece(temp);
      }
    }
  };

  useEffect(() => {
    if (!gameOver && !paused) {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameOver, paused, nextQueue]); // Dependencies trigger restart of loop logic

  // Keyboard Handlers
  const onKeyDown = useCallback((key: string) => {
    if (key === 'ArrowLeft') playerMove(-1);
    if (key === 'ArrowRight') playerMove(1);
    if (key === 'ArrowDown') playerDrop();
    if (key === 'ArrowUp') playerRotate();
    if (key === ' ') hardDrop();
    if (key.toLowerCase() === 'c' || key === 'Shift') hold();
    // Force a draw after input for responsiveness
    const canvas = canvasRef.current;
    if (canvas && !paused && !gameOver) {
      // Re-trigger draw in next frame or immediately? 
      // The loop handles it, but immediate draw feels snappier.
      // draw(); // Can't call closure draw here easily without refactoring, relying on loop is fine for simple implementation.
    }
  }, [paused, gameOver, nextQueue, holdPiece]);

  const onKeyUp = useCallback((_key: string) => { }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  return {
    score, highScore, level, lines, nextQueue, holdPiece, gameOver, paused,
    setPaused: () => setPausedState(prev => !prev),
    startGame: initGame,
    move: (x: number, _y: number) => playerMove(x),
    rotate: playerRotate,
    hardDrop,
    hold,
    canvasRef,
    onKeyDown,
    onKeyUp
  };
};
