import { Board } from './Board';
import { Piece } from './Piece';
import { COLORS, BOARD_WIDTH, BOARD_HEIGHT } from '../constants';

export class Renderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private cellSize: number = 24; // Internal resolution base

  public setContext(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    // We assume the canvas logic size matches BOARD_WIDTH * cellSize
    // Scaling is handled via CSS
  }

  public draw(board: Board, activePiece: Piece | null, ghostPiece: Piece | null, clearingRows: number[] = []) {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    const width = BOARD_WIDTH * this.cellSize;
    const height = BOARD_HEIGHT * this.cellSize;

    // Clear
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fillRect(0, 0, width, height);

    // Draw Grid Lines
    ctx.strokeStyle = '#334155'; // slate-700
    ctx.lineWidth = 1;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * this.cellSize, 0);
      ctx.lineTo(x * this.cellSize, height);
      ctx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * this.cellSize);
      ctx.lineTo(width, y * this.cellSize);
      ctx.stroke();
    }

    // Draw Board (Locked Pieces)
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      // Check if this row is being cleared
      const isClearing = clearingRows.includes(y);
      
      if (isClearing) {
        // Draw flash effect for the whole row
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, y * this.cellSize, width, this.cellSize);
        continue; // Skip drawing individual blocks for this row
      }

      for (let x = 0; x < BOARD_WIDTH; x++) {
        const type = board.grid[y][x];
        if (type) {
          this.drawCell(x, y, COLORS[type], false);
        }
      }
    }

    // Draw Ghost
    if (ghostPiece && clearingRows.length === 0) {
      const ghostCells = ghostPiece.getOccupiedCells();
      const color = COLORS[ghostPiece.type];
      ghostCells.forEach(({ x, y }) => this.drawCell(x, y, color, true));
    }

    // Draw Active Piece
    if (activePiece && clearingRows.length === 0) {
      const cells = activePiece.getOccupiedCells();
      const color = COLORS[activePiece.type];
      cells.forEach(({ x, y }) => this.drawCell(x, y, color, false));
    }
  }

  private drawCell(x: number, y: number, color: string, isGhost: boolean) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const cs = this.cellSize;

    ctx.fillStyle = isGhost ? `${color}40` : color;
    ctx.fillRect(x * cs, y * cs, cs, cs);

    if (!isGhost) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x * cs + 1, y * cs + 1, cs - 2, cs - 2);
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x * cs, y * cs, cs, cs);
    }
  }
}