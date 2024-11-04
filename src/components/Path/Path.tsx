import { PathPoint, DragE } from '../../types';
import { useShape } from './hooks/useShape';

interface PathProps {
  x: number;
  y: number;
  points: PathPoint[];
  strokeColor: [number, number, number, number];
  fillColor?: [number, number, number, number];
  thickness?: number;
  closed?: boolean;
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
}

export function Path(props: PathProps): null {
  useShape({ ...props });

  return null;
}
