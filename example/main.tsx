/* eslint-disable react/display-name */
import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, Rectangle, Circle, Ellipse, Triangle, Path, Line, Polygon, Text } from '../src';
import { DragE } from '../src/types';

const container = document.getElementById('app');
const root = createRoot(container!);

function App(): JSX.Element {
  const [position, setPosition] = useState({ x: 100, y: 100 });

  const handleDrag = useCallback((dx: number, dy: number) => {
    setPosition((prevPosition) => ({
      x: prevPosition.x + dx,
      y: prevPosition.y + dy,
    }));
  }, []);

  return (
    <React.StrictMode>
      <Canvas width={window.innerWidth} height={window.innerHeight}>
        <Circle
          x={200}
          y={200}
          radius={50}
          color={[1, 0, 0, 1]}
        />
        <Ellipse
          x={300}
          y={300}
          radiusX={100}
          radiusY={50}
          color={[0, 1, 0, 1]}
        />
        <Line
          x={400}
          y={400}
          points={{x1: 100, y1: 100, x2: 200, y2: 200}}
          color={[0, 0, 1, 1]}
          thickness={5}
        />
        <Path
          x={500}
          y={500}
          points={[
            { x: 0, y: 0, moveTo: true },
            { x: 20, y: 20 },
            { x: 40, y: 0 },
            { x: 20, y: -20 },
          ]}
          strokeColor={[1, 1, 0, 1]}
          fillColor={[0, 1, 1, 1]}
          thickness={10}
          closed
        />
        <Polygon
          x={600}
          y={600}
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
        />
        <Rectangle
          x={700}
          y={700}
          width={100}
          height={200}
          color={[0, 1, 0, 1]}
        />
        <Text
          x={800}
          y={800}
          text="Hello, world!"
          fontSize={24}
          color={[0, 0, 0, 1]}
        />
        <Triangle
          x={position.x}
          y={position.y}
          points={{
            x1: 40, y1: 40,
            x2: -40, y2: 40,
            x3: 0, y3: -40,
          }}
          strokeColor={[0, 0, 1, 1]}
          fillColor={[1, 0, 1, 1]}
          thickness={3}
          isDraggable
          onDrag={(e: DragE) => {
            handleDrag(e.worldDx, e.worldDy);
          }}
        />
      </Canvas>
    </React.StrictMode>
  );
}

root.render(<App />);
