import { DragE } from '../../types';
import { useShape } from './hooks/useShape';

interface CircleProps {
  x: number;
  y: number;
  radius: number;
  color: [number, number, number, number];
  strokeColor?: [number, number, number, number];
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
  thickness?: number;
}

export function Circle(props: CircleProps): null {
  useShape({ ...props });

  return null;
}
