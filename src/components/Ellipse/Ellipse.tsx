import { useEffect } from 'react';
import { useRenderer } from '../../context/CanvasContext';

interface EllipseProps {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  color: [number, number, number, number];
}

export function Ellipse(props: EllipseProps): null {
  const { x, y, radiusX, radiusY, color } = props;
  const renderer = useRenderer();

  useEffect(() => {
    if (renderer) {
      renderer.drawEllipse(x, y, radiusX, radiusY, color);
    }
  }, [x, y, radiusX, radiusY, color, renderer]);

  return null;
}