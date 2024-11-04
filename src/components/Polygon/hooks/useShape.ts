import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRenderer, useSelectedShapes } from 'src/context/CanvasContext';
import { Bounds, DragE } from 'src/types';
import { UUID } from 'src/utils/uuid';

export interface Point {
  x: number;
  y: number;
}

interface UseShapeProps {
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

export function useShape(props: UseShapeProps): void {
  const {
    x,
    y,
    points,
    strokeColor,
    fillColor,
    thickness,
    isDraggable,
    onDragStart,
    onDrag,
    onDragEnd,
  } = props;

  const renderer = useRenderer();
  const fixedPoints = useMemo(() => {
    return points.map((point) => ({
      x: point.x + x,
      y: point.y + y,
    }));
  }, [points, x, y]);

  const shapeId = useRef(UUID());
  const isSelected = useSelectedShapes()?.has(shapeId.current);

  const move = useCallback(
    (dx: number, dy: number): void => {
      onDrag?.({
        x: x + dx,
        y: y + dy,
        dx,
        dy,
        worldX: x + dx,
        worldY: y + dy,
        worldDx: dx,
        worldDy: dy,
      });
    },
    [onDrag, x, y]
  );

  const getBounds = useCallback((): Bounds => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const point of points) {
      minX = Math.min(minX, point.x + x);
      minY = Math.min(minY, point.y + y);
      maxX = Math.max(maxX, point.x + x);
      maxY = Math.max(maxY, point.y + y);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [x, y, points]);

  const renderFn = useCallback(() => {
    renderer!.drawPolygon({
      points: fixedPoints,
      strokeColor,
      fillColor,
      thickness,
    });

    if (isSelected) {
      renderer!.drawPolygon({
        points: fixedPoints,
        fillColor: [0.2, 0.4, 0.9, 0.3],
        strokeColor: [0.2, 0.4, 0.9, 0.9],
        thickness,
      });
    }
  }, [fillColor, fixedPoints, isSelected, renderer, strokeColor, thickness]);

  const hitTest = useCallback(
    (x: number, y: number) => {
      let inside = false;
      const points = fixedPoints;

      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x,
          yi = points[i].y;
        const xj = points[j].x,
          yj = points[j].y;

        const intersect =
          yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }

      return inside;
    },
    [fixedPoints]
  );

  const shape = useMemo(() => {
    return {
      id: shapeId.current,
      props: {
        isDraggable: isDraggable === true,
        onDragStart,
        onDrag,
        onDragEnd,
      },
      render: renderFn,
      hitTest,
      getBounds,
      move,
    };
  }, [
    getBounds,
    hitTest,
    isDraggable,
    move,
    onDrag,
    onDragEnd,
    onDragStart,
    renderFn,
  ]);

  useEffect(() => {
    if (renderer) {
      renderer.addToRenderQueue(shape, shapeId.current);
      renderer.render();
    }
  }, [renderer, shape]);
}
