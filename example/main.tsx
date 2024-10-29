import React from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, Polygon } from '../src';

const points = [
  { x: 100, y: 100 },
  { x: 200, y: 50 },
  { x: 300, y: 100 },
  { x: 300, y: 200 },
  { x: 200, y: 250 },
  { x: 100, y: 200 },
];

const container = document.getElementById('app');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <Canvas width={window.innerWidth} height={window.innerHeight}>
      <Polygon 
        points={points}
        strokeColor={[0, 0, 0, 1]}
        fillColor={[0, 0.5, 1, 0.5]}
        thickness={2}
      />
    </Canvas>
  </React.StrictMode>,
);