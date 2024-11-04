import { WebGLRenderer } from './WebGLRenderer';
import { Shape } from '../../types';
import { SelectionManager } from './SelectionManager';
import { getCanvasRelativePosition } from '../../utils/getCanvasRelativePosition';

export class DragManager {
  public isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private dragTarget: Shape | null = null;

  constructor(
    private renderer: WebGLRenderer,
    private selectionManager: SelectionManager
  ) {}

  public hitTest(x: number, y: number, shape: Shape): boolean {
    if (!shape.props.isDraggable) return false;
    const worldPos = this.renderer.screenToWorld(x, y);
    return shape.hitTest(worldPos.x, worldPos.y);
  }

  public startDrag(e: MouseEvent, target: Shape): void {
    this.isDragging = true;
    this.dragTarget = target;

    const { x: canvasX, y: canvasY } = getCanvasRelativePosition(
      this.renderer.canvas,
      e.clientX,
      e.clientY
    );

    const worldPos = this.renderer.screenToWorld(canvasX, canvasY);

    this.lastX = canvasX;
    this.lastY = canvasY;

    const selectedShapes = this.selectionManager.getSelectedShapes();

    if (!Array.from(selectedShapes).some((s) => s.id === target.id)) {
      this.selectionManager.addToSelection(target);
    }

    selectedShapes.forEach((shape) => {
      shape.props.onDragStart?.({
        x: canvasY,
        y: canvasY,
        dx: 0,
        dy: 0,
        worldX: worldPos.x,
        worldY: worldPos.y,
        worldDx: 0,
        worldDy: 0,
      });
    });
  }

  public drag(e: MouseEvent): void {
    if (!this.isDragging || !this.dragTarget) return;
    const { x: canvasX, y: canvasY } = getCanvasRelativePosition(
      this.renderer.canvas,
      e.clientX,
      e.clientY
    );
    const scale = this.renderer.viewport.scale;
    const dx = (canvasX - this.lastX) / scale;
    const dy = (canvasY - this.lastY) / scale;

    const selectedShapes = this.selectionManager.getSelectedShapes();

    if (Array.from(selectedShapes).some((s) => s.id === this.dragTarget?.id)) {
      selectedShapes.forEach((shape) => {
        shape.move(dx, dy);
      });
    }
    this.lastX = canvasX;
    this.lastY = canvasY;

    this.renderer.render();
  }

  public endDrag(e: MouseEvent): void {
    if (!this.isDragging || !this.dragTarget) return;
    const { x: canvasX, y: canvasY } = getCanvasRelativePosition(
      this.renderer.canvas,
      e.clientX,
      e.clientY
    );
    const worldPos = this.renderer.screenToWorld(canvasX, canvasY);

    // Обновляем координаты всех выделенных фигур
    this.dragTarget.props.onDragEnd?.({
      x: canvasX,
      y: canvasY,
      dx: 0,
      dy: 0,
      worldX: worldPos.x,
      worldY: worldPos.y,
      worldDx: 0,
      worldDy: 0,
    });

    this.isDragging = false;
    this.dragTarget = null;
    this.lastX = 0;
    this.lastY = 0;
  }
}
