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

export interface Shape {
  props: {
    isDraggable?: boolean;
    onDragStart?: (e: DragE) => void;
    onDrag?: (e: DragE) => void;
    onDragEnd?: (e: DragE) => void;
  };
  render: () => void;
  hitTest: (x: number, y: number) => boolean;
}