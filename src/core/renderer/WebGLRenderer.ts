import earcut from 'earcut';
import { PathPoint } from '../../types';

export class WebGLRenderer {
  private gl: WebGLRenderingContext | null;
  private program: WebGLProgram | undefined;
  private projectionMatrix: Float32Array | undefined;
  private viewMatrix: Float32Array | undefined;

  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl', {
      antialias: true,
      preserveDrawingBuffer: true,
    });

    if (!this.gl) {
      throw new Error('WebGL is not supported in this browser.');
    }

    this.initShaders();
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
    this.gl!.useProgram(this.program);
    this.gl!.enable(this.gl!.BLEND);
    this.gl!.blendFunc(this.gl!.SRC_ALPHA, this.gl!.ONE_MINUS_SRC_ALPHA);
  }

  private updateProjectionMatrix(width: number, height: number): void {
    this.projectionMatrix = new Float32Array([
      2 / width, 0, 0, 0,
      0, -2 / height, 0, 0,
      0, 0, 1, 0,
      -1, 1, 0, 1,
    ]);
  }

  public setViewport(width: number, height: number): void {
    this.gl!.viewport(0, 0, width, height);
    this.updateProjectionMatrix(width, height);
  }

  public clear(): void {
    this.gl!.clearColor(1, 1, 1, 1);
    this.gl!.clear(this.gl!.COLOR_BUFFER_BIT);
  }

  public drawRectangle(x: number, y: number, width: number, height: number, color: [number, number, number, number]): void {
    const vertices = new Float32Array([
      x, y,
      x + width, y,
      x, y + height,
      x + width, y + height,
    ]);

    const colors = new Float32Array([
      ...color, ...color, ...color, ...color,
    ]);

    const positionBuffer = this.gl!.createBuffer();
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, vertices, this.gl!.STATIC_DRAW);

    const colorBuffer = this.gl!.createBuffer();
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, colors, this.gl!.STATIC_DRAW);

    if (!this.program) {
      throw new Error('Program is not initialized');
    }
    
    const positionLocation = this.gl!.getAttribLocation(this.program, 'a_position');
    const colorLocation = this.gl!.getAttribLocation(this.program, 'a_color');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.enableVertexAttribArray(colorLocation);
    this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);

    const projectionLocation = this.gl!.getUniformLocation(this.program, 'u_projection');
    const viewLocation = this.gl!.getUniformLocation(this.program, 'u_view');
    const isCircleLocation = this.gl!.getUniformLocation(this.program!, 'u_isCircle');

    if (!this.projectionMatrix || !this.viewMatrix) {
      throw new Error('Matrices are not initialized');
    }
    this.gl!.uniform1i(isCircleLocation, 0);
    this.gl!.uniformMatrix4fv(projectionLocation, false, this.projectionMatrix);
    this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix);

    this.gl!.drawArrays(this.gl!.TRIANGLE_STRIP, 0, 4);
  }

  public setTransform(scale: number, translateX: number, translateY: number): void {
    this.viewMatrix = new Float32Array([
      scale, 0, 0, 0,
      0, scale, 0, 0,
      0, 0, 1, 0,
      translateX, translateY, 0, 1,
    ]);
  }

  public drawCircle(x: number, y: number, radius: number, color: [number, number, number, number]): void {
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

    const vertexBuffer = this.gl!.createBuffer();
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, vertexBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(vertices), this.gl!.STATIC_DRAW);

    const colorBuffer = this.gl!.createBuffer();
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(colors), this.gl!.STATIC_DRAW);

    if (!this.program) {
      throw new Error('Program is not initialized');
    }

    const positionLocation = this.gl!.getAttribLocation(this.program, 'a_position');
    const colorLocation = this.gl!.getAttribLocation(this.program, 'a_color');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, vertexBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.enableVertexAttribArray(colorLocation);
    this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);

    const projectionLocation = this.gl!.getUniformLocation(this.program, 'u_projection');
    const viewLocation = this.gl!.getUniformLocation(this.program, 'u_view');
    const centerLocation = this.gl!.getUniformLocation(this.program!, 'u_center');
    const radiusLocation = this.gl!.getUniformLocation(this.program!, 'u_radius');
    const isCircleLocation = this.gl!.getUniformLocation(this.program!, 'u_isCircle');

    if (!this.projectionMatrix || !this.viewMatrix) {
      throw new Error('Matrices are not initialized');
    }

    this.gl!.uniformMatrix4fv(projectionLocation, false, this.projectionMatrix);
    this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix);
    this.gl!.uniform2f(centerLocation, x, y);
    this.gl!.uniform1f(radiusLocation, radius);
    this.gl!.uniform1i(isCircleLocation, 1);
    this.gl!.drawArrays(this.gl!.TRIANGLE_FAN, 0, segments + 2);
  }

  public drawEllipse(x: number, y: number, radiusX: number, radiusY: number, color: [number, number, number, number]): void {
    const segments = 64;
    const vertices: number[] = [];
    const colors: number[] = [];

    vertices.push(x, y);
    colors.push(...color);

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;

      vertices.push(x + Math.cos(angle) * radiusX, y + Math.sin(angle) * radiusY);
      colors.push(...color);
    }

    const vertexBuffer = this.gl!.createBuffer();
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, vertexBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(vertices), this.gl!.STATIC_DRAW);

    const colorBuffer = this.gl!.createBuffer();
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(colors), this.gl!.STATIC_DRAW);

    if (!this.program) {
      throw new Error('Program is not initialized');
    }

    const positionLocation = this.gl!.getAttribLocation(this.program, 'a_position');
    const colorLocation = this.gl!.getAttribLocation(this.program, 'a_color');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, vertexBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.enableVertexAttribArray(colorLocation);
    this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);

    const projectionLocation = this.gl!.getUniformLocation(this.program, 'u_projection');
    const viewLocation = this.gl!.getUniformLocation(this.program, 'u_view');

    if (!this.projectionMatrix || !this.viewMatrix) {
      throw new Error('Matrices are not initialized');
    }

    this.gl!.uniformMatrix4fv(projectionLocation, false, this.projectionMatrix);
    this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix);

    this.gl!.drawArrays(this.gl!.TRIANGLE_FAN, 0, segments + 2);
  }

  public drawLine(x1: number, y1: number, x2: number, y2: number, color: [number, number, number, number], thickness: number = 2): void {
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
      ...color,
      ...color,
      ...color,
      ...color,
    ]);

    const vertexBuffer = this.gl!.createBuffer();
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, vertexBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, vertices, this.gl!.STATIC_DRAW);

    const colorBuffer = this.gl!.createBuffer();
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, colors, this.gl!.STATIC_DRAW);

    if (!this.program) {
      throw new Error('Program is not initialized');
    }

    const positionLocation = this.gl!.getAttribLocation(this.program, 'a_position');
    const colorLocation = this.gl!.getAttribLocation(this.program, 'a_color');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, vertexBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.enableVertexAttribArray(colorLocation);
    this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);

    const projectionLocation = this.gl!.getUniformLocation(this.program, 'u_projection');
    const viewLocation = this.gl!.getUniformLocation(this.program, 'u_view');

    if (!this.projectionMatrix || !this.viewMatrix) {
      throw new Error('Matrices are not initialized');
    }

    this.gl!.uniformMatrix4fv(projectionLocation, false, this.projectionMatrix);
    this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix);

    this.gl!.drawArrays(this.gl!.TRIANGLE_STRIP, 0, 4);
  }

  public drawPath(
    points: PathPoint[],
    strokeColor: [number, number, number, number],
    fillColor: [number, number, number, number] | null = null,
    thickness: number = 2,
    closed: boolean = false,
  ): void {
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
  
      const vertexBuffer = this.gl!.createBuffer();
      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, vertexBuffer);
      this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(vertices), this.gl!.STATIC_DRAW);
  
      const colorBuffer = this.gl!.createBuffer();
      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
      this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(colors), this.gl!.STATIC_DRAW);
  
      if (!this.program) {
        throw new Error('Program is not initialized');
      }
  
      const positionLocation = this.gl!.getAttribLocation(this.program, 'a_position');
      const colorLocation = this.gl!.getAttribLocation(this.program, 'a_color');
  
      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, vertexBuffer);
      this.gl!.enableVertexAttribArray(positionLocation);
      this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);
  
      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
      this.gl!.enableVertexAttribArray(colorLocation);
      this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);
  
      const projectionLocation = this.gl!.getUniformLocation(this.program, 'u_projection');
      const viewLocation = this.gl!.getUniformLocation(this.program, 'u_view');
  
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
  
    const vertexBuffer = this.gl!.createBuffer();
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, vertexBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(vertices), this.gl!.STATIC_DRAW);
  
    const colorBuffer = this.gl!.createBuffer();
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array(colors), this.gl!.STATIC_DRAW);
  
    const positionLocation = this.gl!.getAttribLocation(this.program!, 'a_position');
    const colorLocation = this.gl!.getAttribLocation(this.program!, 'a_color');
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, vertexBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(positionLocation, 2, this.gl!.FLOAT, false, 0, 0);
  
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
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
}