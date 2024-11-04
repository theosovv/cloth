import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRenderer, useSelectedShapes } from 'src/context/CanvasContext';
import { DragE } from 'src/types';
import { UUID } from 'src/utils/uuid';

interface Options {
  onDrag?: (e: DragE) => void;
  onDragStart?: (e: DragE) => void;
  x: number;
  y: number;
  radius: number;
  color: [number, number, number, number];
  strokeColor?: [number, number, number, number];
  thickness?: number;
  isDraggable?: boolean;
  onDragEnd?: (e: DragE) => void;
}

export function useShape(options: Options): void {
  const {
    onDrag,
    x,
    y,
    radius,
    color,
    strokeColor,
    thickness,
    isDraggable,
    onDragEnd,
    onDragStart,
  } = options;
  const shapeId = useRef(UUID());
  const selectedShapes = useSelectedShapes();
  const renderer = useRenderer();

  const isSelected = selectedShapes?.has(shapeId.current);

  const move = useCallback(
    (dx: number, dy: number): void => {
      onDrag?.({
        x,
        y,
        dx,
        dy,
        worldX: x,
        worldY: y,
        worldDx: dx,
        worldDy: dy,
      });
    },
    [onDrag, x, y]
  );

  const getBounds = useCallback((): {
    x: number;
    y: number;
    width: number;
    height: number;
  } => {
    return {
      x: x - radius,
      y: y - radius,
      width: radius * 2,
      height: radius * 2,
    };
  }, [x, y, radius]);

  const hitTest = useCallback(
    (_x: number, _y: number): boolean => {
      const dx = _x - x;
      const dy = _y - y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    },
    [radius, x, y]
  );

  const renderFn = useCallback(() => {
    renderer!.drawCircle({ x, y, radius, color, strokeColor, thickness });
    if (isSelected) {
      renderer!.drawCircle({
        x,
        y,
        radius: radius,
        color: [0.2, 0.4, 0.9, 0.3],
        strokeColor: [0.2, 0.4, 0.9, 0.9],
        thickness,
      });
    }
  }, [color, isSelected, radius, renderer, strokeColor, thickness, x, y]);

  const shape = useMemo(() => {
    return {
      id: shapeId.current,
      props: {
        isDraggable: isDraggable === true,
        onDragStart: onDragStart,
        onDrag: onDrag,
        onDragEnd: onDragEnd,
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
