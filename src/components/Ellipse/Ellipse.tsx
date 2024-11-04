import { DragE } from '../../types';
import { useShape } from './hooks/useShape';

interface EllipseProps {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  color: [number, number, number, number];
  strokeColor?: [number, number, number, number];
  thickness?: number;
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
}

export function Ellipse(props: EllipseProps): null {
  useShape({ ...props });

  return null;
}
