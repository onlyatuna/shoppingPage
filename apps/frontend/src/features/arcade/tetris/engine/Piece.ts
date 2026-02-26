import { TetrominoType } from '../types';
import { TETROMINOS, BOARD_WIDTH } from '../constants';

export class Piece {
  public type: TetrominoType;
  public shape: number[][];
  public x: number;
  public y: number;
  public rotationIndex: number;

  constructor(type: TetrominoType) {
    this.type = type;
    this.shape = TETROMINOS[type].shape;
    this.rotationIndex = 0;
    
    // Center the piece
    this.x = Math.floor(BOARD_WIDTH / 2) - Math.ceil(this.shape[0].length / 2);
    this.y = 0;
  }

  // Clone for "phantom" or future calculations without mutating current
  clone(): Piece {
    const p = new Piece(this.type);
    p.shape = this.shape.map(row => [...row]);
    p.x = this.x;
    p.y = this.y;
    p.rotationIndex = this.rotationIndex;
    return p;
  }

  move(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
  }

  rotate() {
    // Matrix rotation logic
    const N = this.shape.length;
    const newShape = this.shape.map((row, i) =>
      row.map((val, j) => this.shape[N - 1 - j][i])
    );
    this.shape = newShape;
    this.rotationIndex = (this.rotationIndex + 1) % 4;
  }

  // Helper to get absolute coordinates of occupied cells
  getOccupiedCells(): {x: number, y: number}[] {
    const cells: {x: number, y: number}[] = [];
    for (let r = 0; r < this.shape.length; r++) {
      for (let c = 0; c < this.shape[r].length; c++) {
        if (this.shape[r][c]) {
          cells.push({ x: this.x + c, y: this.y + r });
        }
      }
    }
    return cells;
  }
}