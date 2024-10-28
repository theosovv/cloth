import { useEffect } from 'react';
import { useRenderer } from '../../context/CanvasContext';

interface RectangleProps {
    x: number;
    y: number;
    width: number;
    height: number;
    color: [number, number, number, number];
}

export function Rectangle(props: RectangleProps): null {
  const { x, y, width, height, color } = props;
  const renderer = useRenderer();

  useEffect(() => {
    if (renderer) {
      renderer.drawRectangle(x, y, width, height, color);
    }
  }, [x, y, width, height, color, renderer]);

  return null;
}