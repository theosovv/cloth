import { WebGLRenderer } from './WebGLRenderer';
import { Shape } from '../../types';

export class DragManager {
  public isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private dragTarget: Shape | null = null;

  constructor(private renderer: WebGLRenderer) {}

  public hitTest(x: number, y: number, shape: Shape): boolean {
    if (!shape.props.isDraggable) return false;
    const worldPos = this.renderer.screenToWorld(x, y);
    return shape.hitTest(worldPos.x, worldPos.y);
  }

  public startDrag(e: MouseEvent, target: Shape): void {
    this.isDragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.dragTarget = target;

    const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);
    target.props.onDragStart?.({
      x: e.clientX,
      y: e.clientY,
      dx: 0,
      dy: 0,
      worldX: worldPos.x,
      worldY: worldPos.y,
      worldDx: 0,
      worldDy: 0,
    });
  }

  public drag(e: MouseEvent): void {
    if (!this.isDragging || !this.dragTarget) return;

    const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);
    const lastWorldPos = this.renderer.screenToWorld(this.lastX, this.lastY);
    
    this.renderer.clear();
    
    this.dragTarget.props.onDrag?.({
      x: e.clientX,
      y: e.clientY,
      dx: e.clientX - this.lastX,
      dy: e.clientY - this.lastY,
      worldX: worldPos.x,
      worldY: worldPos.y,
      worldDx: worldPos.x - lastWorldPos.x,
      worldDy: worldPos.y - lastWorldPos.y,
    });

    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  public endDrag(e: MouseEvent): void {
    if (!this.isDragging || !this.dragTarget) return;

    const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);

    this.dragTarget.props.onDragEnd?.({
      x: e.clientX,
      y: e.clientY,
      dx: 0,
      dy: 0,
      worldX: worldPos.x,
      worldY: worldPos.y,
      worldDx: 0,
      worldDy: 0,
    });

    this.isDragging = false;
    this.dragTarget = null;
  }
}