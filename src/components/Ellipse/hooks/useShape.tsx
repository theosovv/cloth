import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRenderer, useSelectedShapes } from 'src/context/CanvasContext';
import { DragE } from 'src/types';
import { UUID } from 'src/utils/uuid';

interface UseShapeProps {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  color: [number, number, number, number];
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
    color,
    strokeColor,
    onDrag,
    radiusX,
    radiusY,
    thickness,
    isDraggable,
    onDragStart,
    onDragEnd,
  } = props;

  const renderer = useRenderer();
  const shapeId = useRef(UUID());
  const selectedShapes = useSelectedShapes();
  const isSelected = selectedShapes?.has(shapeId.current);

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

  const getBounds = useCallback((): {
    x: number;
    y: number;
    width: number;
    height: number;
  } => {
    return {
      x: x - radiusX,
      y: y - radiusY,
      width: radiusX * 2,
      height: radiusY * 2,
    };
  }, [x, y, radiusX, radiusY]);

  const hitTest = useCallback(
    (x: number, y: number) => {
      const dx = (x - props.x) / radiusX;
      const dy = (y - props.y) / radiusY;
      return dx * dx + dy * dy <= 1;
    },
    [radiusX, radiusY, props.x, props.y]
  );

  const renderFn = useCallback(() => {
    renderer!.drawEllipse({
      x,
      y,
      radiusX,
      radiusY,
      color,
      strokeColor,
      thickness,
    });

    if (isSelected) {
      renderer!.drawEllipse({
        x,
        y,
        radiusX: radiusX,
        radiusY: radiusY,
        color: [0.2, 0.4, 0.9, 0.3],
        strokeColor: [0.2, 0.4, 0.9, 0.9],
        thickness,
      });
    }
  }, [
    color,
    isSelected,
    radiusX,
    radiusY,
    renderer,
    strokeColor,
    thickness,
    x,
    y,
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
