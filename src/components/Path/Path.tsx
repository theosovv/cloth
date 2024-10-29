import { useEffect } from 'react';
import { useRenderer } from '../../context/CanvasContext';
import { PathPoint } from '../../types';

interface PathProps {
  points: PathPoint[];
  strokeColor: [number, number, number, number];
  fillColor?: [number, number, number, number];
  thickness?: number;
  closed?: boolean;
}

export function Path(props: PathProps): null {
  const {
    points,
    strokeColor,
    fillColor,
    thickness = 2,
    closed = false,
  } = props;
  const renderer = useRenderer();

  useEffect(() => {
    if (renderer) {
      renderer.drawPath(points, strokeColor, fillColor || null, thickness, closed);
    }
  }, [points, strokeColor, fillColor, thickness, closed, renderer]);

  return null;
}