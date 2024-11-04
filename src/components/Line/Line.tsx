import { DragE } from '../../types';
import { useShape } from './hooks/useShape';

interface LineProps {
  x: number;
  y: number;
  points: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  strokeColor?: [number, number, number, number];
  thickness?: number;
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
}

export function Line(props: LineProps): null {
  useShape({ ...props });

  return null;
}
