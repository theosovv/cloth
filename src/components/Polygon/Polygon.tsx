import { DragE } from '../../types';
import { useShape, Point } from './hooks/useShape';

interface PolygonProps {
  x: number;
  y: number;
  points: Point[];
  strokeColor: [number, number, number, number];
  fillColor?: [number, number, number, number];
  thickness?: number;
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
}

export function Polygon(props: PolygonProps): null {
  useShape({ ...props });

  return null;
}
