import { DragE } from '../../types';
import { useShape } from './hooks/useShape';

interface TriangleProps {
  x: number;
  y: number;
  points: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x3: number;
    y3: number;
  };
  strokeColor: [number, number, number, number];
  fillColor?: [number, number, number, number];
  thickness?: number;
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
}

export function Triangle(props: TriangleProps): null {
  useShape({ ...props });

  return null;
}
