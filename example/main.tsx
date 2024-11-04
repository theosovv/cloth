/* eslint-disable react/display-name */
import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Canvas,
  Rectangle,
  Circle,
  Ellipse,
  Triangle,
  Path,
  Line,
  Polygon,
  Text,
} from '../src';
import { DragE } from '../src/types';

const container = document.getElementById('app');
const root = createRoot(container!);

function App(): JSX.Element {
  const [elipsPosition, setElipsPosition] = useState({ x: 100, y: 100 });
  const [linePosition, setLinePositionS] = useState({ x: 300, y: 100 });
  const [pathPosition, setPathPositionS] = useState({ x: 500, y: 100 });
  const [polyPosition, setPolyPositionS] = useState({ x: 100, y: 300 });
  const [rectPosition, setRectPositionS] = useState({ x: 300, y: 300 });
  const [textPosition, setTextPositionS] = useState({ x: 500, y: 300 });
  const [trianglePosition, setTrianglePositionS] = useState({ x: 100, y: 500 });
  const [circlePosition, setCirclePositionS] = useState({ x: 300, y: 500 });

  const handleElipsDrag = useCallback((dx: number, dy: number) => {
    setElipsPosition((prevPosition) => ({
      x: prevPosition.x + dx,
      y: prevPosition.y + dy,
    }));
  }, []);

  const handlePathDragS = useCallback((dx: number, dy: number) => {
    setPathPositionS((prevPosition) => ({
      x: prevPosition.x + dx,
      y: prevPosition.y + dy,
    }));
  }, []);

  const handlePolyDragS = useCallback((dx: number, dy: number) => {
    setPolyPositionS((prevPosition) => ({
      x: prevPosition.x + dx,
      y: prevPosition.y + dy,
    }));
  }, []);

  const handleRectDragS = useCallback((dx: number, dy: number) => {
    setRectPositionS((prevPosition) => ({
      x: prevPosition.x + dx,
      y: prevPosition.y + dy,
    }));
  }, []);

  const handleTextDragS = useCallback((dx: number, dy: number) => {
    setTextPositionS((prevPosition) => ({
      x: prevPosition.x + dx,
      y: prevPosition.y + dy,
    }));
  }, []);

  const handleTriangleDragS = useCallback((dx: number, dy: number) => {
    setTrianglePositionS((prevPosition) => ({
      x: prevPosition.x + dx,
      y: prevPosition.y + dy,
    }));
  }, []);

  const handleCircleDragS = useCallback((dx: number, dy: number) => {
    setCirclePositionS((prevPosition) => ({
      x: prevPosition.x + dx,
      y: prevPosition.y + dy,
    }));
  }, []);

  const handleLineDragS = useCallback((dx: number, dy: number) => {
    setLinePositionS((prevPosition) => ({
      x: prevPosition.x + dx,
      y: prevPosition.y + dy,
    }));
  }, []);

  return (
    <React.StrictMode>
      <Canvas width={window.innerWidth} height={window.innerHeight}>
        <Ellipse
          x={elipsPosition.x}
          y={elipsPosition.y}
          radiusX={100}
          radiusY={50}
          color={[0, 1, 0, 1]}
          strokeColor={[0, 0, 0, 1]}
          thickness={3}
          isDraggable
          onDrag={(e: DragE) => {
            handleElipsDrag(e.worldDx, e.worldDy);
          }}
        />
        <Line
          x={linePosition.x}
          y={linePosition.y}
          points={{ x1: 100, y1: 100, x2: 200, y2: 200 }}
          strokeColor={[0, 1, 0, 1]}
          thickness={3}
          isDraggable
          onDrag={(e: DragE) => {
            handleLineDragS(e.worldDx, e.worldDy);
          }}
        />
        <Path
          x={pathPosition.x}
          y={pathPosition.y}
          points={[
            { x: 0, y: 0, moveTo: true },
            { x: 20, y: 20 },
            { x: 40, y: 0 },
            { x: 20, y: -20 },
          ]}
          strokeColor={[0, 0, 0, 1]}
          fillColor={[0, 1, 1, 1]}
          thickness={3}
          closed
          isDraggable
          onDrag={(e: DragE) => {
            handlePathDragS(e.worldDx, e.worldDy);
          }}
        />
        <Polygon
          x={polyPosition.x}
          y={polyPosition.y}
          points={[
            { x: 0, y: -50 },
            { x: 15, y: -15 },
            { x: 50, y: -15 },
            { x: 20, y: 10 },
            { x: 30, y: 45 },
            { x: 0, y: 25 },
            { x: -30, y: 45 },
            { x: -20, y: 10 },
            { x: -50, y: -15 },
            { x: -15, y: -15 },
          ]}
          strokeColor={[0, 0, 0, 1]}
          fillColor={[1, 0.8, 0, 1]}
          thickness={3}
          isDraggable
          onDrag={(e: DragE) => {
            handlePolyDragS(e.worldDx, e.worldDy);
          }}
        />
        <Rectangle
          x={rectPosition.x}
          y={rectPosition.y}
          width={100}
          height={200}
          color={[0, 1, 0, 1]}
          isDraggable
          onDrag={(e: DragE) => {
            handleRectDragS(e.worldDx, e.worldDy);
          }}
        />
        <Text
          x={textPosition.x}
          y={textPosition.y}
          text='Люблю свою семью!'
          fontSize={24}
          color={[0, 0, 0, 1]}
          isDraggable
          onDrag={(e: DragE) => {
            handleTextDragS(e.worldDx, e.worldDy);
          }}
        />
        <Triangle
          x={trianglePosition.x}
          y={trianglePosition.y}
          points={{
            x1: 40,
            y1: 40,
            x2: -40,
            y2: 40,
            x3: 0,
            y3: -40,
          }}
          strokeColor={[0, 0, 1, 1]}
          fillColor={[1, 0, 1, 1]}
          thickness={3}
          isDraggable
          onDrag={(e: DragE) => {
            handleTriangleDragS(e.worldDx, e.worldDy);
          }}
        />
        <Circle
          x={circlePosition.x}
          y={circlePosition.y}
          radius={50}
          color={[1, 0, 0, 1]}
          strokeColor={[0, 0, 1, 1]}
          thickness={3}
          isDraggable
          onDrag={(e: DragE) => {
            handleCircleDragS(e.worldDx, e.worldDy);
          }}
        />
      </Canvas>
    </React.StrictMode>
  );
}

root.render(<App />);
