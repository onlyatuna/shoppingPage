import { TetrominoType } from './types';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const TETROMINOS: Record<TetrominoType, { shape: number[][], color: string }> = {
  I: { shape: [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]], color: '#00f0ff' }, // Cyan
  J: { shape: [[0, 1, 0], [0, 1, 0], [1, 1, 0]], color: '#3b82f6' }, // Blue
  L: { shape: [[0, 1, 0], [0, 1, 0], [0, 1, 1]], color: '#f59e0b' }, // Orange
  O: { shape: [[1, 1], [1, 1]], color: '#eab308' }, // Yellow
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: '#22c55e' }, // Green
  T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: '#d946ef' }, // Magenta
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: '#ef4444' }, // Red
};

export const COLORS: Record<TetrominoType, string> = {
  I: '#00f0ff',
  J: '#3b82f6',
  L: '#f59e0b',
  O: '#eab308',
  S: '#22c55e',
  T: '#d946ef',
  Z: '#ef4444',
};

export const TETROMINO_TYPES: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

export const POINTS = {
  SINGLE: 100,
  DOUBLE: 300,
  TRIPLE: 500,
  TETRIS: 800,
};

// Speed curve (ms per frame/drop)
export const LEVEL_SPEEDS = [
  800, 720, 630, 550, 470, 380, 300, 220, 150, 100, 80, 60, 40, 20, 10
];

export const randomTetromino = () => {
  const keys = TETROMINO_TYPES;
  const randKey = keys[Math.floor(Math.random() * keys.length)];
  return { type: randKey, ...TETROMINOS[randKey] };
};