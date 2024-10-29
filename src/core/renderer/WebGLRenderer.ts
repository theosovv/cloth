import earcut from 'earcut';
import { PathPoint, TextMetrics } from '../../types';

interface Viewport {
  scale: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class WebGLRenderer {
  private gl: WebGLRenderingContext | null;
  private program: WebGLProgram | undefined;
  private textProgram: WebGLProgram | undefined;
  private projectionMatrix: Float32Array | undefined;
  private viewMatrix: Float32Array | undefined;
  private viewport: Viewport = {
    scale: 1,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  private renderQueue: (() => void)[] = [];
  private bufferCache: Map<string, WebGLBuffer> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl', {
      antialias: true,
      preserveDrawingBuffer: true,
    });

    if (!this.gl) {
      throw new Error('WebGL is not supported in this browser.');
    }

    this.initShaders();
    this.initTextShaders();
    this.initMatrices();
    this.setupGL();
  }

  private initShaders(): void {
    const vertexShader = this.createShader(this.gl!.VERTEX_SHADER, `
      attribute vec2 a_position;
      attribute vec4 a_color;
      
      uniform mat4 u_projection;
      uniform mat4 u_view;
      
      varying vec4 v_color;
      varying vec2 v_position;
      
      void main() {
        gl_Position = u_projection * u_view * vec4(a_position, 0.0, 1.0);
        v_color = a_color;
        v_position = a_position;
      }
    `);

    const fragmentShader = this.createShader(this.gl!.FRAGMENT_SHADER, `
      precision highp float;
      varying vec4 v_color;
      varying vec2 v_position;
      
      uniform vec2 u_center;
      uniform float u_radiusX;
      uniform float u_radiusY;
      uniform bool u_isEllipse;
      
      void main() {
        if (u_isEllipse) {
          vec2 scaled = (v_position - u_center) / vec2(u_radiusX, u_radiusY);
          float distance = length(scaled);
          float smoothedAlpha = 1.0 - smoothstep(0.95, 1.05, distance);
          gl_FragColor = vec4(v_color.rgb, v_color.a * smoothedAlpha);
        } else {
          gl_FragColor = v_color;
        }
      }
    `);

    this.program = this.createProgram(vertexShader, fragmentShader);
  }

  private initTextShaders(): void {
    const vertexShader = this.createShader(this.gl!.VERTEX_SHADER, `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
  
      uniform mat4 u_projection;
      uniform mat4 u_view;
  
      varying vec2 v_texCoord;
  
      void main() {
        gl_Position = u_projection * u_view * vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `);
  
    const fragmentShader = this.createShader(this.gl!.FRAGMENT_SHADER, `
      precision mediump float;
      
      varying vec2 v_texCoord;
      uniform sampler2D u_texture;
      
      void main() {
        vec4 texColor = texture2D(u_texture, v_texCoord);
        gl_FragColor = texColor;
      }
    `);
  
    this.textProgram = this.createProgram(vertexShader, fragmentShader);
    this.gl!.useProgram(this.textProgram);
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl!.createShader(type);
    
    if (!shader) {
      throw new Error('Create shader failed');
    }

    this.gl!.shaderSource(shader, source);
    this.gl!.compileShader(shader);

    if (!this.gl!.getShaderParameter(shader, this.gl!.COMPILE_STATUS)) {
      const info = this.gl!.getShaderInfoLog(shader);
      throw new Error(`Shader compile error: ${info}`);
    }

    return shader;
  }

  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = this.gl!.createProgram();

    if (!program) {
      throw new Error('Create program failed');
    }

    this.gl!.attachShader(program, vertexShader);
    this.gl!.attachShader(program, fragmentShader);
    this.gl!.linkProgram(program);

    if (!this.gl!.getProgramParameter(program, this.gl!.LINK_STATUS)) {
      const info = this.gl!.getProgramInfoLog(program);
      
      throw new Error(`Program link error: ${info}`);
    }

    return program;
  }

  private initMatrices(): void {
    this.projectionMatrix = new Float32Array([
      2 / this.gl!.canvas.width, 0, 0, 0,
      0, -2 / this.gl!.canvas.height, 0, 0,
      0, 0, 1, 0,
      -1, 1, 0, 1,
    ]);

    this.viewMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);
  }

  private setupGL(): void {
    if (!this.program) {
      throw new Error('Program is not initialized');
    }

    this.gl!.enable(this.gl!.BLEND);
    this.gl!.blendFunc(this.gl!.SRC_ALPHA, this.gl!.ONE_MINUS_SRC_ALPHA);
  }

  private getBuffer(key: string): WebGLBuffer {
    let buffer = this.bufferCache.get(key);
    if (!buffer) {
      buffer = this.gl!.createBuffer()!;
      this.bufferCache.set(key, buffer);
    }
    return buffer;
  }

  private updateProjectionMatrix(width: number, height: number): void {
    this.projectionMatrix = new Float32Array([
      2 / width, 0, 0, 0,
      0, -2 / height, 0, 0,
      0, 0, 1, 0,
      -1, 1, 0, 1,
    ]);
  }

  private scheduleRender(): void {
    requestAnimationFrame(() => {
      this.clear();
      this.render();
    });
  }

  public addToRenderQueue(renderFn: () => void): void {
    this.renderQueue.push(renderFn);
  }

  public render(): void {
    for (const renderFn of this.renderQueue) {
      renderFn();
    }
  }

  public setViewport(x: number, y: number, width: number, height: number): void {
    this.viewport.width = width;
    this.viewport.height = height;
    this.gl!.viewport(x, y, width, height);
    this.updateProjectionMatrix(width, height);
  }

  public pan(deltaX: number, deltaY: number): void {
    this.viewport.x += deltaX;
    this.viewport.y += deltaY;
    this.setTransform(this.viewport.scale, this.viewport.x, this.viewport.y);
    this.scheduleRender();
  }

  public zoom(scale: number, centerX: number, centerY: number): void {
    const oldScale = this.viewport.scale;
    this.viewport.scale = scale;

    // Корректировка позиции для сохранения центра масштабирования
    this.viewport.x -= (centerX - this.viewport.x) * (scale / oldScale - 1);
    this.viewport.y -= (centerY - this.viewport.y) * (scale / oldScale - 1);

    this.setTransform(this.viewport.scale, this.viewport.x, this.viewport.y);
    this.scheduleRender();
  }

  public clear(): void {
    this.gl!.clearColor(1, 1, 1, 1);
    this.gl!.clear(this.gl!.COLOR_BUFFER_BIT);
  }

  public drawRectangle(x: number, y: number, width: number, height: number, color: [number, number, number, number]): void {
    this.gl!.useProgram(this.program!);
    const vertices = new Float32Array([
      x, y,
      x + width, y,
      x, y + height,
      x + width, y + height,
    ]);

    const colors = new Float32Array([
      ...color, ...color, ...color, ...color,
    ]);

    const positionBuffer = this.getBuffer('rectanglePosition');
    const colorBuffer = this.getBuffer('rectangleColor');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, vertices, this.gl!.DYNAMIC_DRAW);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, colors, this.gl!.DYNAMIC_DRAW);

    const positionLocation = this.gl!.getAttribLocation(this.program!, 'a_position');
    const colorLocation = this.gl!.getAttribLocation(this.program!, 'a_color');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.enableVertexAttribArray(colorLocation);
    this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);

    const projectionLocation = this.gl!.getUniformLocation(this.program!, 'u_projection');
    const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

    this.gl!.uniformMatrix4fv(projectionLocation, false, this.projectionMatrix!);
    this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

    this.gl!.drawArrays(this.gl!.TRIANGLE_STRIP, 0, 4);
  }

  public setTransform(scale: number, translateX: number, translateY: number): void {
    this.viewMatrix = new Float32Array([
      scale, 0, 0, 0,
      0, scale, 0, 0,
      0, 0, 1, 0,
      translateX, translateY, 0, 1,
    ]);

    if (this.program) {
      this.gl!.useProgram(this.program);
      const viewLocation = this.gl!.getUniformLocation(this.program, 'u_view');
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix);
    }

    if (this.textProgram) {
      this.gl!.useProgram(this.textProgram);
      const viewLocation = this.gl!.getUniformLocation(this.textProgram, 'u_view');
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix);
    }

    if (this.program) {
      this.gl!.useProgram(this.program);
    }
  }

  public drawCircle(x: number, y: number, radius: number, color: [number, number, number, number]): void {
    this.gl!.useProgram(this.program!);
    const segments = 64;
    const vertices: number[] = [];
    const colors: number[] = [];

    vertices.push(x, y);
    colors.push(...color);

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      colors.push(...color);
    }

    const positionBuffer = this.getBuffer('circlePosition');
    const colorBuffer = this.getBuffer('circleColor');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(vertices), this.gl!.DYNAMIC_DRAW);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(colors), this.gl!.DYNAMIC_DRAW);

    const positionLocation = this.gl!.getAttribLocation(this.program!, 'a_position');
    const colorLocation = this.gl!.getAttribLocation(this.program!, 'a_color');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.enableVertexAttribArray(colorLocation);
    this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);

    const projectionLocation = this.gl!.getUniformLocation(this.program!, 'u_projection');
    const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

    this.gl!.uniformMatrix4fv(projectionLocation, false, this.projectionMatrix!);
    this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

    this.gl!.drawArrays(this.gl!.TRIANGLE_FAN, 0, segments + 2);
  }

  public drawEllipse(x: number, y: number, radiusX: number, radiusY: number, color: [number, number, number, number]): void {
    this.gl!.useProgram(this.program!);
    const segments = 64;
    const vertices: number[] = [];
    const colors: number[] = [];
  
    vertices.push(x, y);
    colors.push(...color);
  
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push(
        x + Math.cos(angle) * radiusX,
        y + Math.sin(angle) * radiusY,
      );
      colors.push(...color);
    }
  
    const positionBuffer = this.getBuffer('ellipsePosition');
    const colorBuffer = this.getBuffer('ellipseColor');
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(vertices), this.gl!.DYNAMIC_DRAW);
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(colors), this.gl!.DYNAMIC_DRAW);
  
    const positionLocation = this.gl!.getAttribLocation(this.program!, 'a_position');
    const colorLocation = this.gl!.getAttribLocation(this.program!, 'a_color');
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.enableVertexAttribArray(colorLocation);
    this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);
  
    const projectionLocation = this.gl!.getUniformLocation(this.program!, 'u_projection');
    const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');
  
    this.gl!.uniformMatrix4fv(projectionLocation, false, this.projectionMatrix!);
    this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);
  
    this.gl!.drawArrays(this.gl!.TRIANGLE_FAN, 0, segments + 2);
  }

  public drawLine(x1: number, y1: number, x2: number, y2: number, color: [number, number, number, number], thickness: number = 2): void {
    this.gl!.useProgram(this.program!);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    const nx = -dy / length * (thickness / 2);
    const ny = dx / length * (thickness / 2);

    const vertices = new Float32Array([
      x1 + nx, y1 + ny,
      x1 - nx, y1 - ny,
      x2 + nx, y2 + ny,
      x2 - nx, y2 - ny,
    ]);

    const colors = new Float32Array([
      ...color, ...color, ...color, ...color,
    ]);

    const positionBuffer = this.getBuffer('linePosition');
    const colorBuffer = this.getBuffer('lineColor');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, vertices, this.gl!.DYNAMIC_DRAW);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, colors, this.gl!.DYNAMIC_DRAW);

    const positionLocation = this.gl!.getAttribLocation(this.program!, 'a_position');
    const colorLocation = this.gl!.getAttribLocation(this.program!, 'a_color');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.enableVertexAttribArray(colorLocation);
    this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);

    const projectionLocation = this.gl!.getUniformLocation(this.program!, 'u_projection');
    const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

    this.gl!.uniformMatrix4fv(projectionLocation, false, this.projectionMatrix!);
    this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

    this.gl!.drawArrays(this.gl!.TRIANGLE_STRIP, 0, 4);
  }

  public drawPath(
    points: PathPoint[],
    strokeColor: [number, number, number, number],
    fillColor: [number, number, number, number] | null = null,
    thickness: number = 2,
    closed: boolean = false,
  ): void {
    this.gl!.useProgram(this.program!);
    if (points.length < 2) return;
  
    if (fillColor) {
      const flatPoints: number[] = [];
      for (const point of points) {
        flatPoints.push(point.x, point.y);
      }
      
      const indices = earcut(flatPoints);
      const vertices: number[] = [];
      const colors: number[] = [];
      
      for (const index of indices) {
        vertices.push(
          flatPoints[index * 2],
          flatPoints[index * 2 + 1],
        );
        colors.push(...fillColor);
      }
  
      const fillPositionBuffer = this.getBuffer('pathFillPosition');
      const fillColorBuffer = this.getBuffer('pathFillColor');
  
      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillPositionBuffer);
      this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(vertices), this.gl!.DYNAMIC_DRAW);
  
      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillColorBuffer);
      this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(colors), this.gl!.DYNAMIC_DRAW);
  
      const positionLocation = this.gl!.getAttribLocation(this.program!, 'a_position');
      const colorLocation = this.gl!.getAttribLocation(this.program!, 'a_color');
  
      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillPositionBuffer);
      this.gl!.enableVertexAttribArray(positionLocation);
      this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);
  
      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillColorBuffer);
      this.gl!.enableVertexAttribArray(colorLocation);
      this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);
  
      const projectionLocation = this.gl!.getUniformLocation(this.program!, 'u_projection');
      const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');
  
      this.gl!.uniformMatrix4fv(projectionLocation, false, this.projectionMatrix!);
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);
  
      this.gl!.drawArrays(this.gl!.TRIANGLES, 0, indices.length);
    }
  
    let currentPath: PathPoint[] = [];
    
    for (const point of points) {
      if (point.moveTo && currentPath.length > 0) {
        this.drawPathSegment(currentPath, strokeColor, thickness, false);
        currentPath = [];
      }
      currentPath.push(point);
    }
    
    if (currentPath.length > 0) {
      this.drawPathSegment(currentPath, strokeColor, thickness, closed);
    }
  }
  
  private drawPathSegment(
    points: PathPoint[],
    color: [number, number, number, number],
    thickness: number,
    closed: boolean,
  ): void {
    const vertices: number[] = [];
    const colors: number[] = [];
  
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
  
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
  
      const nx = -dy / length * (thickness / 2);
      const ny = dx / length * (thickness / 2);
  
      vertices.push(
        p1.x + nx, p1.y + ny,
        p1.x - nx, p1.y - ny,
        p2.x + nx, p2.y + ny,
        p2.x - nx, p2.y - ny,
      );
  
      colors.push(
        ...color, ...color, ...color, ...color,
      );
    }
  
    if (closed && points.length > 2) {
      const p1 = points[points.length - 1];
      const p2 = points[0];
  
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
  
      const nx = -dy / length * (thickness / 2);
      const ny = dx / length * (thickness / 2);
  
      vertices.push(
        p1.x + nx, p1.y + ny,
        p1.x - nx, p1.y - ny,
        p2.x + nx, p2.y + ny,
        p2.x - nx, p2.y - ny,
      );
  
      colors.push(
        ...color, ...color, ...color, ...color,
      );
    }
  
    const strokePositionBuffer = this.getBuffer('pathStrokePosition');
    const strokeColorBuffer = this.getBuffer('pathStrokeColor');
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(vertices), this.gl!.DYNAMIC_DRAW);
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(colors), this.gl!.DYNAMIC_DRAW);
  
    const positionLocation = this.gl!.getAttribLocation(this.program!, 'a_position');
    const colorLocation = this.gl!.getAttribLocation(this.program!, 'a_color');
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
    this.gl!.enableVertexAttribArray(colorLocation);
    this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);
  
    const projectionLocation = this.gl!.getUniformLocation(this.program!, 'u_projection');
    const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');
  
    this.gl!.uniformMatrix4fv(projectionLocation, false, this.projectionMatrix!);
    this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);
  
    for (let i = 0; i < vertices.length / 8; i++) {
      this.gl!.drawArrays(this.gl!.TRIANGLE_STRIP, i * 4, 4);
    }
  }

  public drawTriangle(
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number,
    strokeColor: [number, number, number, number],
    fillColor: [number, number, number, number] | null = null,
    thickness: number = 1,
  ): void {
    this.gl!.useProgram(this.program!);
    
    if (fillColor) {
      const vertices = new Float32Array([
        x1, y1,
        x2, y2,
        x3, y3,
      ]);
  
      const colors = new Float32Array([
        ...fillColor, ...fillColor, ...fillColor,
      ]);
  
      const fillPositionBuffer = this.getBuffer('triangleFillPosition');
      const fillColorBuffer = this.getBuffer('triangleFillColor');
  
      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillPositionBuffer);
      this.gl!.bufferData(this.gl!.ARRAY_BUFFER, vertices, this.gl!.DYNAMIC_DRAW);
  
      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillColorBuffer);
      this.gl!.bufferData(this.gl!.ARRAY_BUFFER, colors, this.gl!.DYNAMIC_DRAW);
  
      const positionLocation = this.gl!.getAttribLocation(this.program!, 'a_position');
      const colorLocation = this.gl!.getAttribLocation(this.program!, 'a_color');
  
      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillPositionBuffer);
      this.gl!.enableVertexAttribArray(positionLocation);
      this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);
  
      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillColorBuffer);
      this.gl!.enableVertexAttribArray(colorLocation);
      this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);
  
      const projectionLocation = this.gl!.getUniformLocation(this.program!, 'u_projection');
      const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');
  
      this.gl!.uniformMatrix4fv(projectionLocation, false, this.projectionMatrix!);
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);
  
      this.gl!.drawArrays(this.gl!.TRIANGLES, 0, 3);
    }
  
    // Draw stroke
    const points: PathPoint[] = [
      { x: x1, y: y1, moveTo: true },
      { x: x2, y: y2 },
      { x: x3, y: y3 },
    ];
  
    const strokeVertices: number[] = [];
    const strokeColors: number[] = [];
  
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
  
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
  
      const nx = -dy / length * (thickness / 2);
      const ny = dx / length * (thickness / 2);
  
      strokeVertices.push(
        p1.x + nx, p1.y + ny,
        p1.x - nx, p1.y - ny,
        p2.x + nx, p2.y + ny,
        p2.x - nx, p2.y - ny,
      );
  
      strokeColors.push(
        ...strokeColor, ...strokeColor, ...strokeColor, ...strokeColor,
      );
    }
  
    const strokePositionBuffer = this.getBuffer('triangleStrokePosition');
    const strokeColorBuffer = this.getBuffer('triangleStrokeColor');
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(strokeVertices), this.gl!.DYNAMIC_DRAW);
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(strokeColors), this.gl!.DYNAMIC_DRAW);
  
    const positionLocation = this.gl!.getAttribLocation(this.program!, 'a_position');
    const colorLocation = this.gl!.getAttribLocation(this.program!, 'a_color');
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
    this.gl!.enableVertexAttribArray(colorLocation);
    this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);
  
    const projectionLocation = this.gl!.getUniformLocation(this.program!, 'u_projection');
    const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');
  
    this.gl!.uniformMatrix4fv(projectionLocation, false, this.projectionMatrix!);
    this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);
  
    for (let i = 0; i < 3; i++) {
      this.gl!.drawArrays(this.gl!.TRIANGLE_STRIP, i * 4, 4);
    }
  }

  public drawPolygon(
    points: { x: number; y: number }[],
    strokeColor: [number, number, number, number],
    fillColor: [number, number, number, number] | null = null,
    thickness: number = 2,
  ): void {
    this.gl!.useProgram(this.program!);
    
    if (fillColor) {
      const flatPoints: number[] = points.map(p => [p.x, p.y]).flat();
      const indices = earcut(flatPoints);
      const vertices: number[] = [];
      const colors: number[] = [];

      for (const index of indices) {
        vertices.push(
          flatPoints[index * 2],
          flatPoints[index * 2 + 1],
        );
        colors.push(...fillColor);
      }

      const fillPositionBuffer = this.getBuffer('polygonFillPosition');
      const fillColorBuffer = this.getBuffer('polygonFillColor');

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillPositionBuffer);
      this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(vertices), this.gl!.DYNAMIC_DRAW);

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillColorBuffer);
      this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(colors), this.gl!.DYNAMIC_DRAW);

      const positionLocation = this.gl!.getAttribLocation(this.program!, 'a_position');
      const colorLocation = this.gl!.getAttribLocation(this.program!, 'a_color');

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillPositionBuffer);
      this.gl!.enableVertexAttribArray(positionLocation);
      this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillColorBuffer);
      this.gl!.enableVertexAttribArray(colorLocation);
      this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);

      const projectionLocation = this.gl!.getUniformLocation(this.program!, 'u_projection');
      const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

      this.gl!.uniformMatrix4fv(projectionLocation, false, this.projectionMatrix!);
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

      this.gl!.drawArrays(this.gl!.TRIANGLES, 0, indices.length);
    }

    // Draw stroke
    const strokeVertices: number[] = [];
    const strokeColors: number[] = [];

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      const nx = -dy / length * (thickness / 2);
      const ny = dx / length * (thickness / 2);

      strokeVertices.push(
        p1.x + nx, p1.y + ny,
        p1.x - nx, p1.y - ny,
        p2.x + nx, p2.y + ny,
        p2.x - nx, p2.y - ny,
      );

      strokeColors.push(
        ...strokeColor, ...strokeColor, ...strokeColor, ...strokeColor,
      );
    }

    const strokePositionBuffer = this.getBuffer('polygonStrokePosition');
    const strokeColorBuffer = this.getBuffer('polygonStrokeColor');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(strokeVertices), this.gl!.DYNAMIC_DRAW);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(strokeColors), this.gl!.DYNAMIC_DRAW);

    const positionLocation = this.gl!.getAttribLocation(this.program!, 'a_position');
    const colorLocation = this.gl!.getAttribLocation(this.program!, 'a_color');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
    this.gl!.enableVertexAttribArray(colorLocation);
    this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);

    const projectionLocation = this.gl!.getUniformLocation(this.program!, 'u_projection');
    const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

    this.gl!.uniformMatrix4fv(projectionLocation, false, this.projectionMatrix!);
    this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

    for (let i = 0; i < points.length; i++) {
      this.gl!.drawArrays(this.gl!.TRIANGLE_STRIP, i * 4, 4);
    }
  }

  public drawText(
    text: string,
    x: number,
    y: number,
    color: [number, number, number, number],
    options: {
      fontSize?: number;
      fontFamily?: string;
      textAlign?: 'left' | 'center' | 'right';
      baseline?: 'top' | 'middle' | 'bottom';
    } = {},
  ): TextMetrics {
    if (!this.textProgram) {
      this.initTextShaders();
    }
  
    const {
      fontSize = 16,
      fontFamily = 'Arial',
      textAlign = 'left',
      baseline = 'top',
    } = options;
  
    const textCanvas = document.createElement('canvas');
    const textContext = textCanvas.getContext('2d', { willReadFrequently: true });
  
    if (!textContext) {
      throw new Error('Failed to get 2D context');
    }
  
    // Set canvas size with padding for better text quality
    textContext.font = `${fontSize}px ${fontFamily}`;
    const metrics = textContext.measureText(text);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = fontSize;
  
    textCanvas.width = textWidth * 2;  // Double the size for better quality
    textCanvas.height = textHeight * 2;
  
    // Reset context after resize and set text properties
    textContext.font = `${fontSize * 2}px ${fontFamily}`; // Double size for better quality
    textContext.textAlign = textAlign;
    textContext.textBaseline = baseline;
    textContext.fillStyle = `rgba(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255}, ${color[3]})`;
  
    // Position calculation
    let xPos = 0;
    switch (textAlign) {
    case 'center':
      xPos = textCanvas.width / 2;
      break;
    case 'right':
      xPos = textCanvas.width;
      break;
    }
  
    let yPos = 0;
    switch (baseline) {
    case 'middle':
      yPos = textCanvas.height / 2;
      break;
    case 'bottom':
      yPos = textCanvas.height;
      break;
    }
  
    textContext.fillText(text, xPos, yPos);
  
    // Use cached buffers for vertices and texture coordinates
    const vertexBuffer = this.getBuffer('textVertex');
    const texCoordBuffer = this.getBuffer('textTexCoord');
  
    // Create and setup texture
    const texture = this.gl!.createTexture();
    this.gl!.activeTexture(this.gl!.TEXTURE0);
    this.gl!.bindTexture(this.gl!.TEXTURE_2D, texture);
    
    this.gl!.texImage2D(
      this.gl!.TEXTURE_2D,
      0,
      this.gl!.RGBA,
      this.gl!.RGBA,
      this.gl!.UNSIGNED_BYTE,
      textCanvas,
    );
  
    this.gl!.texParameteri(this.gl!.TEXTURE_2D, this.gl!.TEXTURE_MIN_FILTER, this.gl!.LINEAR);
    this.gl!.texParameteri(this.gl!.TEXTURE_2D, this.gl!.TEXTURE_MAG_FILTER, this.gl!.LINEAR);
    this.gl!.texParameteri(this.gl!.TEXTURE_2D, this.gl!.TEXTURE_WRAP_S, this.gl!.CLAMP_TO_EDGE);
    this.gl!.texParameteri(this.gl!.TEXTURE_2D, this.gl!.TEXTURE_WRAP_T, this.gl!.CLAMP_TO_EDGE);
  
    // Setup vertices and texture coordinates
    const vertices = new Float32Array([
      x, y,
      x + textWidth, y,
      x, y + textHeight,
      x + textWidth, y + textHeight,
    ]);
  
    const texCoords = new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      1.0, 1.0,
    ]);
  
    this.gl!.useProgram(this.textProgram!);
  
    // Update buffers
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, vertexBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, vertices, this.gl!.DYNAMIC_DRAW);
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, texCoordBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, texCoords, this.gl!.DYNAMIC_DRAW);
  
    // Set attributes and uniforms
    const positionLocation = this.gl!.getAttribLocation(this.textProgram!, 'a_position');
    const texCoordLocation = this.gl!.getAttribLocation(this.textProgram!, 'a_texCoord');
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, vertexBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, texCoordBuffer);
    this.gl!.enableVertexAttribArray(texCoordLocation);
    this.gl!.vertexAttribPointer(texCoordLocation, 2, this.gl!.FLOAT, false, 0, 0);
  
    const projectionLocation = this.gl!.getUniformLocation(this.textProgram!, 'u_projection');
    const viewLocation = this.gl!.getUniformLocation(this.textProgram!, 'u_view');
    const textureLocation = this.gl!.getUniformLocation(this.textProgram!, 'u_texture');
  
    this.gl!.uniformMatrix4fv(projectionLocation, false, this.projectionMatrix!);
    this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);
    this.gl!.uniform1i(textureLocation, 0);
  
    // Draw
    this.gl!.drawArrays(this.gl!.TRIANGLE_STRIP, 0, 4);
  
    // Cleanup
    this.gl!.bindTexture(this.gl!.TEXTURE_2D, null);
    this.gl!.deleteTexture(texture);
  
    // Return to main program
    this.gl!.useProgram(this.program!);
  
    return {
      width: textWidth,
      height: textHeight,
    };
  }

  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.viewport.x) / this.viewport.scale,
      y: (screenY - this.viewport.y) / this.viewport.scale,
    };
  }

  public worldToScreen(worldX: number, worldY: number): { x: number, y: number } {
    return {
      x: worldX * this.viewport.scale + this.viewport.x,
      y: worldY * this.viewport.scale + this.viewport.y,
    };
  }
}