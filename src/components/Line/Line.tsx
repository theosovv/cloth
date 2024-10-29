import { useEffect } from 'react';
import { useRenderer } from '../../context/CanvasContext';

interface LineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: [number, number, number, number];
  thickness?: number;
}

export function Line(props: LineProps): null {
  const { x1, y1, x2, y2, color, thickness = 2 } = props;
  const renderer = useRenderer();

  useEffect(() => {
    if (renderer) {
      renderer.drawLine(x1, y1, x2, y2, color, thickness);
    }
  }, [x1, y1, x2, y2, color, thickness, renderer]);

  return null;
}