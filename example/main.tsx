import React from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, Polygon, Text, Rectangle, Circle, Line, Ellipse, Triangle, Path } from '../src';

const container = document.getElementById('app');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <Canvas width={window.innerWidth} height={window.innerHeight}>
      <Polygon 
        points={[
          { x: 100, y: 100 },
          { x: 200, y: 50 },
          { x: 300, y: 100 },
          { x: 300, y: 200 },
          { x: 200, y: 250 },
          { x: 100, y: 200 },
        ]}
        strokeColor={[0, 0, 0, 1]}
        fillColor={[0, 0.5, 1, 0.5]}
        thickness={2}
      />
      <Text 
        text="JSтред"
        x={100}
        y={100}
        color={[0, 0, 0, 1]}
        fontSize={24}
        fontFamily="Arial"
        textAlign="center"
        baseline="middle"
      />
      <Rectangle
        x={400}
        y={100}
        width={100}
        height={80}
        color={[1, 0, 0, 0.5]}
      />
      <Circle
        x={600}
        y={150}
        radius={40}
        color={[0, 1, 0, 0.5]}
      />
      <Line
        x1={700}
        y1={100}
        x2={800}
        y2={200}
        color={[0, 0, 1, 1]}
        thickness={3}
      />
      <Ellipse
        x={500}
        y={300}
        radiusX={80}
        radiusY={40}
        color={[1, 0, 1, 0.5]}
      />
      <Triangle
        x1={700}
        y1={300}
        x2={800}
        y2={300}
        x3={750}
        y3={400}
        strokeColor={[0, 0, 0, 1]}
        fillColor={[1, 1, 0, 0.5]}
        thickness={2}
      />
      <Path
        points={[
          { x: 50, y: 50, moveTo: true },
          { x: 100, y: 25 },
          { x: 150, y: 50 },
          { x: 150, y: 100 },
          { x: 100, y: 125 },
          { x: 50, y: 100 },
          { x: 50, y: 50 },
          { x: 75, y: 75, moveTo: true },
          { x: 125, y: 75 },
          { x: 100, y: 100 },
        ]}
        strokeColor={[0.5, 0.2, 0.8, 1]}
        fillColor={[0.5, 0.2, 0.8, 0.3]}
        thickness={2}
        closed={true}
      />
      <Path
        points={[
          { x: 200, y: 400, moveTo: true },
          { x: 250, y: 350 },
          { x: 300, y: 450 },
          { x: 350, y: 350 },
          { x: 400, y: 400 },
        ]}
        strokeColor={[0.8, 0.4, 0, 1]}
        thickness={3}
        closed={false}
      />
    </Canvas>
  </React.StrictMode>,
);