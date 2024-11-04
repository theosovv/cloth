import { Shape } from '../../types';
import { getCanvasRelativePosition } from '../../utils/getCanvasRelativePosition';
import { BaseRenderer } from './BaseRenderer';
import { WebGLRenderer } from './WebGLRenderer';

export class SelectionManager extends BaseRenderer {
  render(): void {
    throw new Error('Method not implemented.');
  }
  clear(): void {
    throw new Error('Method not implemented.');
  }
  public isSelecting = false;
  public isDragging = false;
  private selectedShapes: Set<Shape> = new Set();
  private selectionRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;
  private startX: number = 0;
  private startY: number = 0;
  private animationFrameId: number | null = null;
  private selectedShapeIds: Set<string> = new Set();

  constructor(
    private renderer: WebGLRenderer,
    private setSelectedShapes: (shapes: Set<string>) => void
  ) {
    super();
  }

  public startSelection(e: MouseEvent): void {
    this.isSelecting = true;
    const { x: canvasX, y: canvasY } = getCanvasRelativePosition(
      this.renderer.canvas,
      e.clientX,
      e.clientY
    );
    const worldPos = this.renderer.screenToWorld(canvasX, canvasY);
    this.startX = worldPos.x;
    this.startY = worldPos.y;
    this.selectionRect = {
      x: worldPos.x,
      y: worldPos.y,
      width: 0,
      height: 0,
    };

    this.renderSelectionFrame();
  }

  public updateSelection(e: MouseEvent): void {
    if (!this.selectionRect) return;
    const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);

    this.selectionRect = {
      x: Math.min(this.startX, worldPos.x),
      y: Math.min(this.startY, worldPos.y),
      width: Math.abs(worldPos.x - this.startX),
      height: Math.abs(worldPos.y - this.startY),
    };
    this.renderer.render();
    this.drawSelectionRect();
    this.selectShapesInRect();
    this.setSelectedShapes(new Set(this.selectedShapeIds));
  }

  public endSelection(): void {
    this.isSelecting = false;
    this.selectionRect = null;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.renderer.render();
  }

  private drawSelectionRect(): void {
    if (!this.selectionRect) return;

    const scaledThickness = 1 / this.renderer.viewport.scale;

    this.renderer.drawRectangle({
      x: this.selectionRect.x,
      y: this.selectionRect.y,
      width: this.selectionRect.width,
      height: this.selectionRect.height,
      fillColor: [0.2, 0.4, 0.9, 0.2],
    });

    this.renderer.drawPolygon({
      points: [
        { x: this.selectionRect.x, y: this.selectionRect.y },
        {
          x: this.selectionRect.x + this.selectionRect.width,
          y: this.selectionRect.y,
        },
        {
          x: this.selectionRect.x + this.selectionRect.width,
          y: this.selectionRect.y + this.selectionRect.height,
        },
        {
          x: this.selectionRect.x,
          y: this.selectionRect.y + this.selectionRect.height,
        },
      ],
      fillColor: [0.2, 0.4, 0.9, 0.6],
      strokeColor: [0.2, 0.4, 0.9, 1],
      thickness: scaledThickness,
    });
  }

  private renderSelectionFrame = (): void => {
    this.renderer.render();
    this.drawSelectionRect();
    this.selectShapesInRect();

    if (this.isSelecting) {
      this.animationFrameId = requestAnimationFrame(this.renderSelectionFrame);
    }
  };

  private selectShapesInRect(): void {
    if (!this.selectionRect) return;

    this.selectedShapes.clear();
    this.selectedShapeIds = new Set();
    const shapes = this.renderer.getShapes();

    for (const shape of shapes) {
      if (this.isShapeInSelectionRect(shape)) {
        this.selectedShapes.add(shape);
        this.selectedShapeIds.add(shape.id);
      }
    }
  }

  private isShapeInSelectionRect(shape: Shape): boolean {
    if (!this.selectionRect) return false;

    const bounds = shape.getBounds();

    return !(
      bounds.x > this.selectionRect.x + this.selectionRect.width ||
      bounds.x + bounds.width < this.selectionRect.x ||
      bounds.y > this.selectionRect.y + this.selectionRect.height ||
      bounds.y + bounds.height < this.selectionRect.y
    );
  }

  public getSelectedShapes(): Set<Shape> {
    return this.selectedShapes;
  }

  public clearSelectedShapes(): void {
    this.selectedShapeIds.clear();
    this.selectedShapes.clear();
    this.setSelectedShapes(new Set());
    this.renderer.render();
  }

  public addToSelection(shape: Shape): void {
    this.selectedShapes.add(shape);
    this.selectedShapeIds.add(shape.id);
    this.setSelectedShapes(new Set(this.selectedShapeIds));
  }
}
