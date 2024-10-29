import { useEffect } from 'react';
import { useRenderer } from '../../context/CanvasContext';

interface TriangleProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  strokeColor: [number, number, number, number];
  fillColor?: [number, number, number, number];
  thickness?: number;
}

export function Triangle(props: TriangleProps): null {
  const {
    x1, y1, x2, y2, x3, y3,
    strokeColor,
    fillColor,
    thickness = 2,
  } = props;
  const renderer = useRenderer();

  useEffect(() => {
    if (renderer) {
      renderer.drawTriangle(
        x1, y1,
        x2, y2,
        x3, y3,
        strokeColor,
        fillColor || null,
        thickness,
      );
    }
  }, [x1, y1, x2, y2, x3, y3, strokeColor, fillColor, thickness, renderer]);

  return null;
}