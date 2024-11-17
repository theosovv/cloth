import { Renderer } from 'cloth-core';

export class Cloth {
  private renderer: Renderer;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
  }

  resize(width: number, height: number) {
    this.renderer.resize(width, height);
  }

  clear() {
    this.renderer.clear();
  }

  setVertices(vertices: Float32Array) {
    this.renderer.set_vertices(vertices);
  }

  render(vertex_count: number) {
    this.renderer.render(vertex_count);
  }
}