
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Pacman {
  x: number;
  y: number;
  dir: Direction;
  nextDir: Direction;
  isAnimating: boolean;
  animationFrame: number;
}

export type GhostName = 'Blinky' | 'Pinky' | 'Inky' | 'Clyde';

export interface Ghost {
  name: GhostName;
  x: number;
  y: number;
  startX: number;
  startY: number;
  dir: Direction;
  color: string;
  isFrightened: boolean;
  isEaten: boolean;
  isReleased: boolean;
  scatterTarget: { x: number; y: number };
}

export enum GameState {
  Ready,
  Playing,
  GameOver,
  LevelComplete,
}
