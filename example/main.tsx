import React from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, Rectangle, Circle, Ellipse, Line } from '../src';

const container = document.getElementById('app');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <Canvas width={window.innerWidth} height={window.innerHeight}>
      <Rectangle 
        x={100} 
        y={100} 
        width={200} 
        height={150} 
        color={[1, 0, 0, 1]} 
      />
      <Circle 
        x={400} 
        y={300} 
        radius={75}
        color={[0, 0, 1, 0.5]} 
      />
      <Ellipse
        x={600}
        y={100}
        radiusX={100}
        radiusY={50}
        color={[0, 1, 0, 0.5]}
      />
      <Line
        x1={100}
        y1={500}
        x2={300}
        y2={200}
        color={[0, 1, 1, 1]}
        thickness={5}
      />
    </Canvas>
  </React.StrictMode>,
);