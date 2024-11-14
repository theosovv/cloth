import cloth from 'cloth-core';

export class Cloth {
  private renderer: cloth.Renderer;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new cloth.Renderer(canvas);
  }

  clear() {
    this.renderer.clear();
  }
}