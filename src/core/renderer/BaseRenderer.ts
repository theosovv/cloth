import { Shape, ShapeWithId } from '../../types';

type EventCallback = () => void;

export abstract class BaseRenderer {
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  protected renderQueue: ShapeWithId[] = [];

  abstract render(): void;
  abstract clear(): void;

  public addToRenderQueue(shape: Shape, id: string): void {
    const shapeWithId = { ...shape, id };
    const existingIndex = this.renderQueue.findIndex((s) => s.id === id);

    if (existingIndex !== -1) {
      this.renderQueue[existingIndex] = shapeWithId;
    } else {
      this.renderQueue.push(shapeWithId);
    }
  }

  public on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
  }

  public off(event: string, callback: EventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  public emit(event: string): void {
    this.eventListeners.get(event)?.forEach((callback) => callback());
  }

  public getShapes(): Shape[] {
    return this.renderQueue;
  }
}
