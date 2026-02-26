
import { Ghost, GhostName } from './types';

export const TILE_SIZE = 16; // pixels
export const MAP_WIDTH = 28;
export const MAP_HEIGHT = 31;

// 1 = wall, 0 = empty, 2 = dot, 3 = power pellet, 4 = ghost door, 5 = ghost house (no dots)
export const MAP_LAYOUT = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,3,1,1,1,2,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,2,1,1,1,3,1],
    [1,2,1,1,1,2,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,2,1,1],
    [1,2,2,2,2,2,1,1,2,2,2,2,2,1,1,2,2,2,2,2,1,1,2,2,2,2,2,1],
    [1,1,1,1,1,2,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,2,1,1,1,1,1],
    [0,0,0,0,1,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,1,0,0,0,0],
    [1,1,1,1,1,2,1,1,2,1,1,5,5,5,5,5,5,1,1,2,1,1,2,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,5,5,5,5,5,5,5,5,1,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,2,1,1,2,1,5,1,1,4,4,1,1,5,1,2,1,1,2,1,1,1,1,1],
    [0,0,0,0,1,2,1,1,2,1,5,1,5,5,5,5,1,5,1,2,1,1,2,1,0,0,0,0],
    [0,0,0,0,1,2,1,1,2,1,5,1,5,5,5,5,1,5,1,2,1,1,2,1,0,0,0,0],
    [1,1,1,1,1,2,2,2,2,1,5,1,1,1,1,1,1,5,1,2,2,2,2,1,1,1,1,1],
    [1,2,2,2,2,2,1,1,2,1,5,5,5,5,5,5,5,5,1,2,1,1,2,2,2,2,2,1],
    [1,1,1,1,1,2,1,1,2,1,5,1,1,1,1,1,1,5,1,2,1,1,2,1,1,1,1,1],
    [0,0,0,0,1,2,1,1,2,1,5,5,5,5,5,5,5,5,1,2,1,1,2,1,0,0,0,0],
    [0,0,0,0,1,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,1,0,0,0,0],
    [1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,2,1,1,1,2,1],
    [1,3,2,2,1,2,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,2,2,2,3,1],
    [1,1,1,2,1,2,1,1,2,1,1,1,1,1,1,1,1,1,2,1,1,2,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export const INITIAL_PACMAN_POS = { x: 13, y: 22 };

export const GHOST_NAMES: GhostName[] = ['Blinky', 'Pinky', 'Inky', 'Clyde'];
export const GHOST_COLORS: Record<GhostName, string> = {
    Blinky: 'bg-red-500',
    Pinky: 'bg-pink-400',
    Inky: 'bg-cyan-400',
    Clyde: 'bg-orange-500',
};

export const INITIAL_GHOSTS_POS: Ghost[] = [
  { name: 'Blinky', x: 13, y: 11, startX: 13, startY: 11, dir: 'left', color: GHOST_COLORS.Blinky, isFrightened: false, isEaten: false, isReleased: true, scatterTarget: {x: 25, y: -2} },
  { name: 'Pinky', x: 13, y: 14, startX: 13, startY: 14, dir: 'up', color: GHOST_COLORS.Pinky, isFrightened: false, isEaten: false, isReleased: false, scatterTarget: {x: 2, y: -2} },
  { name: 'Inky', x: 11, y: 14, startX: 11, startY: 14, dir: 'up', color: GHOST_COLORS.Inky, isFrightened: false, isEaten: false, isReleased: false, scatterTarget: {x: 27, y: 33} },
  { name: 'Clyde', x: 15, y: 14, startX: 15, startY: 14, dir: 'up', color: GHOST_COLORS.Clyde, isFrightened: false, isEaten: false, isReleased: false, scatterTarget: {x: 0, y: 33} },
];

export const GHOST_RELEASE_DOT_COUNT: Record<GhostName, number> = {
    Blinky: 0,
    Pinky: 5,
    Inky: 30,
    Clyde: 60,
};

export const DOT_SCORE = 10;
export const POWER_PELLET_SCORE = 50;
export const GHOST_SCORE = 200; // This will be multiplied
export const FRIGHTENED_DURATION = 8000; // 8 seconds
