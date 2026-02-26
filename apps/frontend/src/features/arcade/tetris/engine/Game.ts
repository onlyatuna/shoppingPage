import { Board } from './Board';
import { Piece } from './Piece';
import { Renderer } from './Renderer';
import { TetrominoType, GameUIState, Tetromino } from '../types';
import { POINTS, LEVEL_SPEEDS, BOARD_WIDTH, BOARD_HEIGHT, TETROMINOS, TETROMINO_TYPES } from '../constants';

export class Game {
  private board: Board;
  private renderer: Renderer;
  public activePiece: Piece | null = null;
  private nextQueue: TetrominoType[] = [];
  private holdPiece: TetrominoType | null = null;
  
  // State
  private score: number = 0;
  private highScore: number = 0;
  private level: number = 1;
  private lines: number = 0;
  private gameOver: boolean = false;
  private paused: boolean = false;
  private canHold: boolean = true;

  // Animation State
  private clearingRows: number[] = [];
  private animationTimer: number = 0;
  private readonly ANIMATION_DELAY = 180; // Optimized to 180ms for snappier feel

  // 7-Bag Randomizer
  private bag: TetrominoType[] = [];

  // Input Handling (DAS/ARR)
  private keys: Set<string> = new Set();
  private lastMoveDir: 0 | -1 | 1 = 0;
  private dasTimer: number = 0;
  private arrTimer: number = 0;
  private readonly DAS_DELAY = 150; // 150ms to start auto-repeat
  private readonly ARR_DELAY = 30;  // 30ms per step

  // Lock Delay (Infinity Rule)
  private lockTimer: number = 0;
  private readonly LOCK_DELAY = 500; // 500ms lock delay
  private isTouchingGround: boolean = false;
  private moveLimitCounter: number = 0; // Prevent infinite stalling
  private readonly MOVE_LIMIT = 15;

  // Timing
  private lastTime: number = 0;
  private dropCounter: number = 0;
  private dropInterval: number = 1000;
  private reqId: number | null = null;

  // Callback to update React UI
  private onStateChange: (state: GameUIState) => void;

  constructor(onStateChange: (state: GameUIState) => void) {
    this.board = new Board();
    this.renderer = new Renderer();
    this.onStateChange = onStateChange;
    
    // Load High Score
    const saved = localStorage.getItem('neon_tetris_hiscore');
    if (saved) {
      this.highScore = parseInt(saved, 10);
    }

    this.initGame();
  }

  // --- 7-Bag Randomizer ---
  private fillBag() {
    const types = [...TETROMINO_TYPES];
    // Fisher-Yates Shuffle
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    this.bag.push(...types);
  }

  private getNextPieceType(): TetrominoType {
    if (this.bag.length === 0) {
      this.fillBag();
    }
    return this.bag.shift()!;
  }

  public initGame() {
    this.board.reset();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.paused = false;
    this.canHold = true;
    this.holdPiece = null;
    this.bag = [];
    this.fillBag();
    this.nextQueue = Array.from({ length: 4 }, () => this.getNextPieceType());
    
    this.keys.clear();
    this.lastMoveDir = 0;
    this.clearingRows = [];

    this.spawnPiece();
    this.updateSpeed();
    this.emitState();
  }

  private updateSpeed() {
    this.dropInterval = LEVEL_SPEEDS[Math.min(this.level - 1, LEVEL_SPEEDS.length - 1)] || 100;
  }

  private spawnPiece() {
    const nextType = this.nextQueue.shift()!;
    this.nextQueue.push(this.getNextPieceType());
    
    const newPiece = new Piece(nextType);
    
    // Check spawn collision
    if (!this.board.isValidPosition(newPiece)) {
      this.gameOver = true;
      this.updateHighScore();
      this.activePiece = null;
    } else {
      this.activePiece = newPiece;
      this.resetLockState();
    }
    this.canHold = true;
  }

  private resetLockState() {
    this.lockTimer = 0;
    this.isTouchingGround = false;
    this.moveLimitCounter = 0;
  }

  public bindCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.renderer.setContext(ctx, canvas.width, canvas.height);
      this.draw();
    }
  }

  // --- Game Loop ---

  public start() {
    if (this.reqId) cancelAnimationFrame(this.reqId);
    this.lastTime = performance.now();
    this.loop();
  }

  public stop() {
    if (this.reqId) cancelAnimationFrame(this.reqId);
  }

  private loop = (time: number = performance.now()) => {
    if (this.paused || this.gameOver) {
       if (!this.paused && !this.gameOver) {
          this.reqId = requestAnimationFrame(this.loop);
       }
       return; 
    }

    const dt = time - this.lastTime;
    this.lastTime = time;

    // 0. Animation State
    if (this.clearingRows.length > 0) {
        this.animationTimer += dt;
        if (this.animationTimer >= this.ANIMATION_DELAY) {
            this.finalizeClear();
        }
        this.draw();
        this.reqId = requestAnimationFrame(this.loop);
        return; // Skip update logic while animating
    }

    // 1. Handle Input (DAS / ARR)
    this.handleInputMovement(dt);

    // 2. Handle Gravity & Soft Drop
    let currentSpeed = this.dropInterval;
    if (this.keys.has('ArrowDown')) {
      currentSpeed = 50; // Fast drop speed
    }
    
    this.dropCounter += dt;
    if (this.dropCounter >= currentSpeed) {
      this.drop();
      this.dropCounter = 0;
    }

    // 3. Handle Lock Delay
    if (this.activePiece) {
        const dummy = this.activePiece.clone();
        dummy.move(0, 1);
        if (!this.board.isValidPosition(dummy)) {
            this.isTouchingGround = true;
        } else {
            this.isTouchingGround = false;
        }

        if (this.isTouchingGround) {
            this.lockTimer += dt;
            if (this.lockTimer >= this.LOCK_DELAY) {
                this.lock();
            }
        }
    }

    this.draw();
    this.reqId = requestAnimationFrame(this.loop);
  };

  private handleInputMovement(dt: number) {
      if (this.lastMoveDir !== 0) {
          this.dasTimer += dt;
          if (this.dasTimer >= this.DAS_DELAY) {
              this.arrTimer += dt;
              while (this.arrTimer >= this.ARR_DELAY) {
                  this.move(this.lastMoveDir, 0);
                  this.arrTimer -= this.ARR_DELAY;
              }
          }
      }
  }

  private drop() {
    if (!this.activePiece) return;
    
    const moved = this.tryMove(0, 1);
    if (moved) {
        this.resetLockState();
    }
  }

  private lock() {
    if (!this.activePiece) return;
    
    // 1. Lock piece
    this.board.lockPiece(this.activePiece);
    this.activePiece = null; // Hide active piece during check

    // 2. Check for rows to clear
    const fullRows = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
       if (this.board.grid[y].every(cell => cell !== null)) {
           fullRows.push(y);
       }
    }

    if (fullRows.length > 0) {
        // Start Animation
        this.clearingRows = fullRows;
        this.animationTimer = 0;
        // Don't spawn yet
    } else {
        // No lines, spawn immediately
        this.spawnPiece();
    }
    this.emitState();
  }

  private finalizeClear() {
    const cleared = this.board.clearFullRows(); // Actually modify grid
    this.clearingRows = [];
    
    if (cleared > 0) {
      const points = [0, POINTS.SINGLE, POINTS.DOUBLE, POINTS.TRIPLE, POINTS.TETRIS];
      this.score += (points[cleared] || 0) * this.level;
      this.lines += cleared;
      this.updateHighScore();
      
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.updateSpeed();
      }
    }

    this.spawnPiece();
    this.emitState();
  }

  private updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('neon_tetris_hiscore', this.highScore.toString());
    }
  }

  // --- Controls & Logic ---

  public handleKeyDown(key: string) {
    if (this.gameOver) return;
    
    // PREVENT REPEAT: If key is already held, ignore this event.
    // This solves mobile "double tap" issues if the OS fires repeats,
    // and solves keyboard auto-repeat triggering rotate/hard-drop multiple times.
    // DAS/ARR loop handles continuous movement for Left/Right.
    if (this.keys.has(key)) return;

    this.keys.add(key);

    if (key === 'ArrowLeft') {
        this.lastMoveDir = -1;
        this.dasTimer = 0;
        this.arrTimer = 0;
        this.move(-1, 0); 
    }
    if (key === 'ArrowRight') {
        this.lastMoveDir = 1;
        this.dasTimer = 0;
        this.arrTimer = 0;
        this.move(1, 0); 
    }
    if (key === 'ArrowUp') this.rotate();
    if (key === ' ') this.hardDrop();
    if (key === 'c' || key === 'C' || key === 'Shift') this.hold();
    if (key === 'p' || key === 'P') this.togglePause();
  }

  public handleKeyUp(key: string) {
    this.keys.delete(key);
    
    if (key === 'ArrowLeft' && this.lastMoveDir === -1) {
        this.lastMoveDir = this.keys.has('ArrowRight') ? 1 : 0;
        this.dasTimer = 0;
    }
    if (key === 'ArrowRight' && this.lastMoveDir === 1) {
        this.lastMoveDir = this.keys.has('ArrowLeft') ? -1 : 0;
        this.dasTimer = 0;
    }
  }

  public move(dx: number, dy: number) {
    if (this.paused || this.gameOver || this.clearingRows.length > 0) return;
    this.tryMove(dx, dy);
  }

  private tryMove(dx: number, dy: number): boolean {
    if (!this.activePiece) return false;
    
    this.activePiece.move(dx, dy);
    if (!this.board.isValidPosition(this.activePiece)) {
      this.activePiece.move(-dx, -dy);
      return false;
    }

    if (this.isTouchingGround) {
       this.lockTimer = 0;
       this.moveLimitCounter++;
       if (this.moveLimitCounter > this.MOVE_LIMIT) {
           this.lock(); 
       }
    }
    
    return true;
  }

  public rotate() {
    if (this.paused || this.gameOver || !this.activePiece || this.clearingRows.length > 0) return;

    this.activePiece.rotate();
    
    if (!this.board.isValidPosition(this.activePiece)) {
       const kicks = [
           [0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1], [-2, 0], [2, 0], [0, 1]
       ];
       
       let success = false;
       for (const [ox, oy] of kicks) {
          this.activePiece.move(ox, oy);
          if (this.board.isValidPosition(this.activePiece)) {
            success = true;
            break;
          }
          this.activePiece.move(-ox, -oy);
       }
       
       if (!success) {
         this.activePiece.rotate(); 
         this.activePiece.rotate(); 
         this.activePiece.rotate(); 
         return; 
       }
    }

    if (this.isTouchingGround) {
        this.lockTimer = 0;
        this.moveLimitCounter++;
        if (this.moveLimitCounter > this.MOVE_LIMIT) this.lock();
    }
  }

  public hardDrop() {
    if (this.paused || this.gameOver || !this.activePiece || this.clearingRows.length > 0) return;
    
    let dropped = 0;
    while (this.board.isValidPosition(this.activePiece)) {
      this.activePiece.move(0, 1);
      dropped++;
    }
    this.activePiece.move(0, -1);
    dropped--;
    
    this.score += dropped * 2;
    this.lock();
  }

  public hold() {
    if (this.paused || this.gameOver || !this.canHold || !this.activePiece || this.clearingRows.length > 0) return;

    this.resetLockState();

    const currentType = this.activePiece.type;
    
    if (this.holdPiece === null) {
      this.holdPiece = currentType;
      this.spawnPiece();
    } else {
      const temp = this.holdPiece;
      this.holdPiece = currentType;
      
      this.activePiece = new Piece(temp);
      this.activePiece.x = Math.floor(BOARD_WIDTH / 2) - Math.ceil(this.activePiece.shape[0].length / 2);
      this.activePiece.y = 0;
      
      if (!this.board.isValidPosition(this.activePiece)) {
          this.gameOver = true;
      }
    }
    
    this.canHold = false;
    this.emitState();
  }

  public togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    this.emitState();
    if (!this.paused) {
        this.lastTime = performance.now();
        this.loop();
    }
  }

  private draw() {
    const ghost = this.getGhostPiece();
    this.renderer.draw(this.board, this.activePiece, ghost, this.clearingRows);
  }

  private getGhostPiece(): Piece | null {
    if (!this.activePiece || this.clearingRows.length > 0) return null;
    const ghost = this.activePiece.clone();
    
    while (this.board.isValidPosition(ghost)) {
      ghost.move(0, 1);
    }
    ghost.move(0, -1);
    return ghost;
  }

  private emitState() {
    const nextQueue: Tetromino[] = this.nextQueue.map(type => ({
        type,
        ...TETROMINOS[type]
    }));
    
    const holdPiece: Tetromino | null = this.holdPiece 
        ? { type: this.holdPiece, ...TETROMINOS[this.holdPiece] } 
        : null;

    this.onStateChange({
      score: this.score,
      highScore: this.highScore,
      level: this.level,
      lines: this.lines,
      nextQueue: nextQueue,
      holdPiece: holdPiece,
      gameOver: this.gameOver,
      paused: this.paused
    });
  }

  public restart() {
    this.initGame();
    this.start();
  }
}