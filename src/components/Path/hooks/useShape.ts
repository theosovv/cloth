import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRenderer, useSelectedShapes } from 'src/context/CanvasContext';
import { Bounds, DragE, PathPoint } from 'src/types';
import { UUID } from 'src/utils/uuid';

interface UseShapeProps {
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

export function useShape(props: UseShapeProps): void {
  const {
    x,
    y,
    points,
    strokeColor,
    fillColor,
    thickness,
    closed,
    isDraggable,
    onDragStart,
    onDrag,
    onDragEnd,
  } = props;

  const renderer = useRenderer();
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

  const fixedPoints = useMemo(() => {
    return points.map((point) => ({
      x: point.x + props.x,
      y: point.y + props.y,
      moveTo: point.moveTo,
    }));
  }, [points, props.x, props.y]);

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

  const hitTest = useCallback(
    (x: number, y: number): boolean => {
      if (fillColor) {
        let inside = false;
        for (
          let i = 0, j = fixedPoints.length - 1;
          i < fixedPoints.length;
          j = i++
        ) {
          const xi = fixedPoints[i].x,
            yi = fixedPoints[i].y;
          const xj = fixedPoints[j].x,
            yj = fixedPoints[j].y;

          const intersect =
            yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
          if (intersect) inside = !inside;
        }
        if (inside) return true;
      }

      for (let i = 0; i < fixedPoints.length - 1; i++) {
        const p1 = fixedPoints[i];
        const p2 = fixedPoints[i + 1];

        const thickness = props.thickness || 2;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        const distance = Math.abs(
          (dy * x - dx * y + p2.x * p1.y - p2.y * p1.x) / length
        );

        if (distance <= thickness) return true;
      }
      return false;
    },
    [fillColor, fixedPoints, props.thickness]
  );

  const renderFn = useCallback(() => {
    renderer!.drawPath({
      points: fixedPoints,
      strokeColor,
      fillColor,
      thickness,
      closed,
    });

    if (isSelected) {
      renderer!.drawPath({
        points: fixedPoints,
        fillColor: [0.2, 0.4, 0.9, 0.3],
        strokeColor: [0.2, 0.4, 0.9, 0.9],
        thickness: thickness,
        closed,
      });
    }
  }, [
    closed,
    fillColor,
    fixedPoints,
    isSelected,
    renderer,
    strokeColor,
    thickness,
  ]);

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
