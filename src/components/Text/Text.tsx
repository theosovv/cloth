import { DragE } from '../../types';
import { useShape } from './hooks/useShape';

interface TextProps {
  text: string;
  x: number;
  y: number;
  color: [number, number, number, number];
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  baseline?: 'top' | 'middle' | 'bottom';
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
}

export function Text(props: TextProps): null {
  useShape({ ...props });

  return null;
}
