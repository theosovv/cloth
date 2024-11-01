import { useEffect, useRef } from 'react';
import { useRenderer } from '../../context/CanvasContext';
import { DragE, Shape } from '../../types';
import { UUID } from '../../utils/uuid';

interface Point {
  x: number;
  y: number;
}

interface PolygonProps {
  x: number;
  y: number;
  points: Point[];
  strokeColor: [number, number, number, number];
  fillColor?: [number, number, number, number];
  thickness?: number;
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
}

export function Polygon(props: PolygonProps): null {
  const {
    x,
    y,
    points,
    strokeColor,
    fillColor,
    thickness = 2,
  } = props;
  const renderer = useRenderer();
  const fixedPoints = points.map((point) => ({
    x: point.x + x,
    y: point.y + y,
  }));
  const shapeId = useRef(UUID());

  useEffect(() => {
    if (renderer) {
      const renderFn = (): void => {
        renderer.drawPolygon(
          fixedPoints,
          strokeColor,
          fillColor || null,
          thickness,
        );
      };

      const shape: Shape = {
        props: {
          isDraggable: props.isDraggable === true,
          onDragStart: props.onDragStart,
          onDrag: props.onDrag,
          onDragEnd: props.onDragEnd,
        },
        render: renderFn,
        hitTest: (x: number, y: number) => {
          let inside = false;
          const points = fixedPoints;
          
          for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;
            
            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
          }
          
          return inside;
        },
      };

      renderer.addToRenderQueue(shape, shapeId.current);
      renderer.render();

      return (): void => {
      };
    }
  }, [points, strokeColor, fillColor, thickness, renderer]);

  return null;
}