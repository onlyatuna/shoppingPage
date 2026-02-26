import { Grid, GridCell, TetrominoType } from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../constants';
import { Piece } from './Piece';

export class Board {
  public grid: Grid;

  constructor() {
    this.grid = this.createEmptyGrid();
  }

  private createEmptyGrid(): Grid {
    return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
  }

  public reset() {
    this.grid = this.createEmptyGrid();
  }

  // Collision Detection
  public isValidPosition(piece: Piece): boolean {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const newX = piece.x + c;
          const newY = piece.y + r;

          // Wall bounds
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false;
          }

          // Existing blocks (ignore top out for spawning validity usually, but mostly relevant for overlap)
          if (newY >= 0 && this.grid[newY][newX] !== null) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // Lock piece into grid
  public lockPiece(piece: Piece) {
    const cells = piece.getOccupiedCells();
    cells.forEach(({ x, y }) => {
      if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
        this.grid[y][x] = piece.type;
      }
    });
  }

  // Check and clear full rows
  public clearFullRows(): number {
    let linesCleared = 0;
    const newGrid = this.grid.filter(row => {
      const isFull = row.every(cell => cell !== null);
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (newGrid.length < BOARD_HEIGHT) {
      newGrid.unshift(Array(BOARD_WIDTH).fill(null));
    }

    this.grid = newGrid;
    return linesCleared;
  }
}