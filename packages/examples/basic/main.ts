import { Cloth } from '@cloth/bindings';

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const cloth = new Cloth(canvas);

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    cloth.resize(canvas.width, canvas.height);
  }

  window.addEventListener('resize', resize);


  const vertices = new Float32Array([
    0.0, 0.5, 0.0,
    -0.5, -0.5, 0.0,
    0.5, -0.5, 0.0,
  ]);

  cloth.setVertices(vertices);

  function renderLoop() {
    cloth.render(vertices.length / 3);

    requestAnimationFrame(renderLoop);
  }

  renderLoop();
}

main();
