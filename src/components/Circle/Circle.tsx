import { useEffect } from 'react';
import { useRenderer } from '../../context/CanvasContext';

interface CircleProps {
  x: number;
  y: number;
  radius: number;
  color: [number, number, number, number];
}

export function Circle(props: CircleProps): null {
  const { x, y, radius, color } = props;
  const renderer = useRenderer();

  useEffect(() => {
    if (renderer) {
      renderer.drawCircle(x, y, radius, color);
    }
  }, [x, y, radius, color, renderer]);

  return null;
}