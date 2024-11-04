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
  };
  strokeColor?: [number, number, number, number];
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
    thickness,
    isDraggable,
    onDragStart,
    onDrag,
    onDragEnd,
  } = props;

  const renderer = useRenderer();
  const shapeId = useRef(UUID());
  const selectedShapes = useSelectedShapes();
  const isSelected = selectedShapes?.has(shapeId.current);

  const move = useCallback(
    (dx: number, dy: number): void => {
      onDrag?.({
        x: points.x1 + dx,
        y: points.y1 + dy,
        dx,
        dy,
        worldX: points.x1 + dx,
        worldY: points.y1 + dy,
        worldDx: dx,
        worldDy: dy,
      });
    },
    [onDrag, points.x1, points.y1]
  );

  const getBounds = useCallback((): Bounds => {
    return {
      x: x + Math.min(points.x1, points.x2),
      y: y + Math.min(points.y1, points.y2),
      width: Math.abs(points.x2 - points.x1),
      height: Math.abs(points.y2 - points.y1),
    };
  }, [x, y, points]);

  const renderFn = useCallback(() => {
    renderer!.drawLine({
      x1: x + points.x1,
      y1: y + points.y1,
      x2: x + points.x2,
      y2: y + points.y2,
      strokeColor,
      thickness,
    });

    if (isSelected) {
      renderer!.drawLine({
        x1: x + points.x1,
        y1: y + points.y1,
        x2: x + points.x2,
        y2: y + points.y2,
        strokeColor: [0.2, 0.4, 0.9, 0.9],
        thickness: thickness,
      });
    }
  }, [
    isSelected,
    points.x1,
    points.x2,
    points.y1,
    points.y2,
    renderer,
    strokeColor,
    thickness,
    x,
    y,
  ]);

  const hitTest = useCallback(
    (x: number, y: number) => {
      const thickness = props.thickness || 2;
      const x1 = props.x + points.x1;
      const y1 = props.y + points.y1;
      const x2 = props.x + points.x2;
      const y2 = props.y + points.y2;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const lengthSquared = dx * dx + dy * dy;

      if (lengthSquared === 0) {
        // Линия является точкой
        const distance = Math.hypot(x - x1, y - y1);
        return distance <= thickness + 1;
      }

      let t = ((x - x1) * dx + (y - y1) * dy) / lengthSquared;
      t = Math.max(0, Math.min(1, t));

      const projectionX = x1 + t * dx;
      const projectionY = y1 + t * dy;

      const distance = Math.hypot(x - projectionX, y - projectionY);

      return distance <= thickness + 1;
    },
    [
      points.x1,
      points.x2,
      points.y1,
      points.y2,
      props.thickness,
      props.x,
      props.y,
    ]
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
