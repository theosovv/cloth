import React from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, Path } from '../src';

const pathPoints = [
  { x: 100, y: 100, moveTo: true },
  { x: 200, y: 150 },
  { x: 300, y: 100 },
  { x: 350, y: 200 },
  { x: 200, y: 300 },
];

const container = document.getElementById('app');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <Canvas width={window.innerWidth} height={window.innerHeight}>
      <Path
        points={pathPoints}
        strokeColor={[0, 0, 1, 1]}
        fillColor={[0.8, 0.8, 1, 1]}
        thickness={3}
        closed={true}
      />
    </Canvas>
  </React.StrictMode>,
);