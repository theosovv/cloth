import { DragE } from '../../types';
import { useShape } from './hooks/useShape';

interface RectangleProps {
  x: number;
  y: number;
  width: number;
  height: number;
  color: [number, number, number, number];
  thickness?: number;
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
}

export function Rectangle(props: RectangleProps): null {
  useShape({ ...props });

  return null;
}
