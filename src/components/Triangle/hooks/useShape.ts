import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRenderer, useSelectedShapes } from 'src/context/CanvasContext';
import { Bounds, DragE } from 'src/types';
import { UUID } from 'src/utils/uuid';

interface UseShapeProps {
  x: number;
  y: number;
  points: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x3: number;
    y3: number;
  };
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
    const minX = Math.min(points.x1 + x, points.x2 + x, points.x3 + x);
    const minY = Math.min(points.y1 + y, points.y2 + y, points.y3 + y);
    const maxX = Math.max(points.x1 + x, points.x2 + x, points.x3 + x);
    const maxY = Math.max(points.y1 + y, points.y2 + y, points.y3 + y);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [x, y, points]);

  const renderFn = useCallback(() => {
    renderer!.drawTriangle({
      x1: points.x1 + x,
      y1: points.y1 + y,
      x2: points.x2 + x,
      y2: points.y2 + y,
      x3: points.x3 + x,
      y3: points.y3 + y,
      options: {
        strokeColor,
        fillColor,
        thickness,
      },
    });

    if (isSelected) {
      renderer!.drawTriangle({
        x1: points.x1 + x,
        y1: points.y1 + y,
        x2: points.x2 + x,
        y2: points.y2 + y,
        x3: points.x3 + x,
        y3: points.y3 + y,
        options: {
          fillColor: [0.2, 0.4, 0.9, 0.3],
          strokeColor: [0.2, 0.4, 0.9, 0.9],
          thickness,
        },
      });
    }
  }, [
    fillColor,
    isSelected,
    points.x1,
    points.x2,
    points.x3,
    points.y1,
    points.y2,
    points.y3,
    renderer,
    strokeColor,
    thickness,
    x,
    y,
  ]);

  const hitTest = useCallback(
    (px: number, py: number) => {
      function sign(
        p1x: number,
        p1y: number,
        p2x: number,
        p2y: number,
        p3x: number,
        p3y: number
      ): number {
        return (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
      }

      const x1 = points.x1 + x;
      const y1 = points.y1 + y;
      const x2 = points.x2 + x;
      const y2 = points.y2 + y;
      const x3 = points.x3 + x;
      const y3 = points.y3 + y;

      const d1 = sign(px, py, x1, y1, x2, y2);
      const d2 = sign(px, py, x2, y2, x3, y3);
      const d3 = sign(px, py, x3, y3, x1, y1);

      const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
      const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

      return !(hasNeg && hasPos);
    },
    [points.x1, points.x2, points.x3, points.y1, points.y2, points.y3, x, y]
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
