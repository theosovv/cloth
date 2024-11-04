export interface PathPoint {
  x: number;
  y: number;
  moveTo?: boolean;
}

export interface TextMetrics {
  width: number;
  height: number;
}

export interface DragE {
  x: number;
  y: number;
  dx: number;
  dy: number;
  worldX: number;
  worldY: number;
  worldDx: number;
  worldDy: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Shape {
  id: string;
  isSelected?: boolean;
  props: {
    isDraggable?: boolean;
    onDragStart?: (e: DragE) => void;
    onDrag?: (e: DragE) => void;
    onDragEnd?: (e: DragE) => void;
  };
  render: () => void;
  hitTest: (x: number, y: number) => boolean;
  getBounds: () => Bounds;
  move: (dx: number, dy: number) => void;
}

export interface ShapeWithId extends Shape {
  id: string;
}
