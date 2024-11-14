import { Cloth } from '@cloth/bindings';

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const ui = new Cloth(canvas);

  ui.clear();
}

main();
