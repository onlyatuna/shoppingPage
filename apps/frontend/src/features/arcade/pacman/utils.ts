
import { MAP_LAYOUT } from './constants';
import { Direction } from './types';

export const isWall = (x: number, y: number): boolean => {
  // Check boundaries
  if (y < 0 || y >= MAP_LAYOUT.length || x < 0 || x >= MAP_LAYOUT[0].length) {
    return true;
  }
  const tile = MAP_LAYOUT[y][x];
  return tile === 1 || tile === 4; // 1 is wall, 4 is ghost door
};

export const getOppositeDirection = (dir: Direction): Direction => {
    switch(dir) {
        case 'up': return 'down';
        case 'down': return 'up';
        case 'left': return 'right';
        case 'right': return 'left';
    }
}

export const getDistance = (pos1: {x: number, y: number}, pos2: {x: number, y: number}): number => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}
