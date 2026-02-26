export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface Tetromino {
  type: TetrominoType;
  shape: number[][];
  color: string;
}

export type GridCell = TetrominoType | null;
export type Grid = GridCell[][];

export interface GameUIState {
  score: number;
  highScore: number;
  level: number;
  lines: number;
  nextQueue: Tetromino[];
  holdPiece: Tetromino | null;
  gameOver: boolean;
  paused: boolean;
}