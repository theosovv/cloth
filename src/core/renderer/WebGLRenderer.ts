import earcut from 'earcut';
import { PathPoint, TextMetrics, Shape } from '../../types';
import { BaseRenderer } from './BaseRenderer';

interface Viewport {
  scale: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawCircleOptions {
  x: number;
  y: number;
  radius: number;
  color?: [number, number, number, number];
  strokeColor?: [number, number, number, number];
  thickness?: number;
}

interface DrawEllipseOptions {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  color?: [number, number, number, number];
  strokeColor?: [number, number, number, number];
  thickness?: number;
}

interface DrawLineOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeColor?: [number, number, number, number];
  thickness?: number;
  lineCap?: 'butt' | 'round' | 'square';
}

interface DrawPathOptions {
  points: PathPoint[];
  strokeColor?: [number, number, number, number];
  fillColor?: [number, number, number, number];
  thickness?: number;
  closed?: boolean;
}

interface DrawPolygonOptions {
  strokeColor?: [number, number, number, number];
  points: PathPoint[];
  fillColor?: [number, number, number, number];
  thickness?: number;
}

interface DrawRectangleOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: [number, number, number, number];
  strokeColor?: [number, number, number, number];
  thickness?: number;
}

interface DrawTriangleOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  options: {
    strokeColor?: [number, number, number, number];
    fillColor?: [number, number, number, number];
    thickness?: number;
  };
}

export class WebGLRenderer extends BaseRenderer {
  private gl: WebGLRenderingContext | null;
  public canvas: HTMLCanvasElement;
  private pixelRatio = window.devicePixelRatio || 1;
  private program: WebGLProgram | undefined;
  private textProgram: WebGLProgram | undefined;
  private projectionMatrix: Float32Array | undefined;
  private viewMatrix: Float32Array | undefined;
  public viewport: Viewport = {
    scale: 1,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  private bufferCache: Map<string, WebGLBuffer> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', {
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true,
      depth: true,
      stencil: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
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
    const vertexShader = this.createShader(
      this.gl!.VERTEX_SHADER,
      `
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
    `
    );

    const fragmentShader = this.createShader(
      this.gl!.FRAGMENT_SHADER,
      `
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
    `
    );

    this.program = this.createProgram(vertexShader, fragmentShader);
  }

  private initTextShaders(): void {
    const vertexShader = this.createShader(
      this.gl!.VERTEX_SHADER,
      `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
  
      uniform mat4 u_projection;
      uniform mat4 u_view;
  
      varying vec2 v_texCoord;
  
      void main() {
        gl_Position = u_projection * u_view * vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `
    );

    const fragmentShader = this.createShader(
      this.gl!.FRAGMENT_SHADER,
      `
      precision mediump float;
      
      varying vec2 v_texCoord;
      uniform sampler2D u_texture;
      
      void main() {
        vec4 texColor = texture2D(u_texture, v_texCoord);
        gl_FragColor = texColor;
      }
    `
    );

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

  private createProgram(
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ): WebGLProgram {
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
      2 / this.gl!.canvas.width,
      0,
      0,
      0,
      0,
      -2 / this.gl!.canvas.height,
      0,
      0,
      0,
      0,
      1,
      0,
      -1,
      1,
      0,
      1,
    ]);

    this.viewMatrix = new Float32Array([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
    ]);
  }

  private setupGL(): void {
    if (!this.program) {
      throw new Error('Program is not initialized');
    }

    this.gl!.enable(this.gl!.BLEND);
    this.gl!.blendFunc(this.gl!.SRC_ALPHA, this.gl!.ONE_MINUS_SRC_ALPHA);
    this.gl!.enable(this.gl!.SAMPLE_COVERAGE);
    this.gl!.sampleCoverage(1, false);
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
      2 / width,
      0,
      0,
      0,
      0,
      -2 / height,
      0,
      0,
      0,
      0,
      1,
      0,
      -1,
      1,
      0,
      1,
    ]);
  }

  private scheduleRender(): void {
    requestAnimationFrame(() => {
      this.clear();
      this.render();
    });
  }

  public addToRenderQueue(shape: Shape, id: string): void {
    const shapeWithId = { ...shape, id };
    const existingIndex = this.renderQueue.findIndex((s) => s.id === id);

    if (existingIndex !== -1) {
      this.renderQueue[existingIndex] = shapeWithId;
    } else {
      this.renderQueue.push(shapeWithId);
    }
  }

  public render(): void {
    this.clear();

    for (const shape of this.renderQueue) {
      shape.render();
    }

    this.emit('afterRender');
  }

  public getShapes(): Shape[] {
    return this.renderQueue;
  }

  public setViewport(
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const displayWidth = width * this.pixelRatio;
    const displayHeight = height * this.pixelRatio;

    if (
      this.gl!.canvas.width !== displayWidth ||
      this.gl!.canvas.height !== displayHeight
    ) {
      this.gl!.canvas.width = displayWidth;
      this.gl!.canvas.height = displayHeight;
    }

    this.viewport.width = width;
    this.viewport.height = height;
    this.gl!.viewport(0, 0, displayWidth, displayHeight);
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

    this.viewport.x -= (centerX - this.viewport.x) * (scale / oldScale - 1);
    this.viewport.y -= (centerY - this.viewport.y) * (scale / oldScale - 1);

    this.setTransform(this.viewport.scale, this.viewport.x, this.viewport.y);
    this.scheduleRender();
  }

  public clear(): void {
    this.gl!.clearColor(1, 1, 1, 1);
    this.gl!.clear(this.gl!.COLOR_BUFFER_BIT);
  }

  public drawRectangle(options: DrawRectangleOptions): void {
    const {
      x,
      y,
      width,
      height,
      fillColor = [0, 0, 0, 1],
      strokeColor,
      thickness = 1,
    } = options;
    this.gl!.useProgram(this.program!);
    const vertices = new Float32Array([
      x,
      y,
      x + width,
      y,
      x,
      y + height,
      x + width,
      y + height,
    ]);

    const colors = new Float32Array([
      ...fillColor,
      ...fillColor,
      ...fillColor,
      ...fillColor,
    ]);

    const positionBuffer = this.getBuffer('rectanglePosition');
    const colorBuffer = this.getBuffer('rectangleColor');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, vertices, this.gl!.DYNAMIC_DRAW);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, colors, this.gl!.DYNAMIC_DRAW);

    const positionLocation = this.gl!.getAttribLocation(
      this.program!,
      'a_position'
    );
    const colorLocation = this.gl!.getAttribLocation(this.program!, 'a_color');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(
      positionLocation,
      2,
      this.gl!.FLOAT,
      false,
      0,
      0
    );

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.enableVertexAttribArray(colorLocation);
    this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);

    const projectionLocation = this.gl!.getUniformLocation(
      this.program!,
      'u_projection'
    );
    const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

    this.gl!.uniformMatrix4fv(
      projectionLocation,
      false,
      this.projectionMatrix!
    );
    this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

    this.gl!.drawArrays(this.gl!.TRIANGLE_STRIP, 0, 4);

    if (strokeColor) {
      // Верхняя линия
      this.drawLine({
        x1: x - thickness / 2,
        y1: y,
        x2: x + width + thickness / 2,
        y2: y,
        strokeColor,
        thickness,
      });
      // Правая линия
      this.drawLine({
        x1: x + width,
        y1: y - thickness / 2,
        x2: x + width,
        y2: y + height + thickness / 2,
        strokeColor,
        thickness,
      });
      // Нижняя линия
      this.drawLine({
        x1: x - thickness / 2,
        y1: y + height,
        x2: x + width + thickness / 2,
        y2: y + height,
        strokeColor,
        thickness,
      });
      // Левая линия
      this.drawLine({
        x1: x,
        y1: y - thickness / 2,
        x2: x,
        y2: y + height + thickness / 2,
        strokeColor,
        thickness,
      });
    }
  }

  public setTransform(
    scale: number,
    translateX: number,
    translateY: number
  ): void {
    this.viewMatrix = new Float32Array([
      scale,
      0,
      0,
      0,
      0,
      scale,
      0,
      0,
      0,
      0,
      1,
      0,
      translateX,
      translateY,
      0,
      1,
    ]);

    if (this.program) {
      this.gl!.useProgram(this.program);
      const viewLocation = this.gl!.getUniformLocation(this.program, 'u_view');
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix);
    }

    if (this.textProgram) {
      this.gl!.useProgram(this.textProgram);
      const viewLocation = this.gl!.getUniformLocation(
        this.textProgram,
        'u_view'
      );
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix);
    }

    if (this.program) {
      this.gl!.useProgram(this.program);
    }
  }

  public drawCircle(options: DrawCircleOptions): void {
    const {
      x,
      y,
      radius,
      color = [0, 0, 0, 1],
      strokeColor,
      thickness = 1,
    } = options;
    this.gl!.useProgram(this.program!);

    const segments = 64; // Adjust for desired smoothness
    const angleStep = (Math.PI * 2) / segments;

    // Draw filled circle
    if (color) {
      const vertices: number[] = [];
      const colors: number[] = [];

      // Center vertex
      vertices.push(x, y);
      colors.push(...color);

      for (let i = 0; i <= segments; i++) {
        const angle = i * angleStep;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        vertices.push(px, py);
        colors.push(...color);
      }

      const positionBuffer = this.getBuffer('circleFillPosition');
      const colorBuffer = this.getBuffer('circleFillColor');

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(vertices),
        this.gl!.DYNAMIC_DRAW
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(colors),
        this.gl!.DYNAMIC_DRAW
      );

      const positionLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_position'
      );
      const colorLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_color'
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
      this.gl!.enableVertexAttribArray(positionLocation);
      this.gl!.vertexAttribPointer(
        positionLocation,
        2,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
      this.gl!.enableVertexAttribArray(colorLocation);
      this.gl!.vertexAttribPointer(
        colorLocation,
        4,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      const projectionLocation = this.gl!.getUniformLocation(
        this.program!,
        'u_projection'
      );
      const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

      this.gl!.uniformMatrix4fv(
        projectionLocation,
        false,
        this.projectionMatrix!
      );
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

      this.gl!.drawArrays(this.gl!.TRIANGLE_FAN, 0, segments + 2);
    }

    // Draw stroke
    if (strokeColor && thickness > 0) {
      const strokeVertices: number[] = [];
      const strokeColors: number[] = [];

      for (let i = 0; i <= segments; i++) {
        const angle = i * angleStep;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // Outer vertex
        const outerX = x + cos * (radius + thickness / 2);
        const outerY = y + sin * (radius + thickness / 2);

        // Inner vertex
        const innerX = x + cos * (radius - thickness / 2);
        const innerY = y + sin * (radius - thickness / 2);

        // Add vertices to array
        strokeVertices.push(outerX, outerY);
        strokeVertices.push(innerX, innerY);

        // Add colors
        strokeColors.push(...strokeColor);
        strokeColors.push(...strokeColor);
      }

      const strokePositionBuffer = this.getBuffer('circleStrokePosition');
      const strokeColorBuffer = this.getBuffer('circleStrokeColor');

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(strokeVertices),
        this.gl!.DYNAMIC_DRAW
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(strokeColors),
        this.gl!.DYNAMIC_DRAW
      );

      const positionLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_position'
      );
      const colorLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_color'
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
      this.gl!.enableVertexAttribArray(positionLocation);
      this.gl!.vertexAttribPointer(
        positionLocation,
        2,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
      this.gl!.enableVertexAttribArray(colorLocation);
      this.gl!.vertexAttribPointer(
        colorLocation,
        4,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      const projectionLocation = this.gl!.getUniformLocation(
        this.program!,
        'u_projection'
      );
      const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

      this.gl!.uniformMatrix4fv(
        projectionLocation,
        false,
        this.projectionMatrix!
      );
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

      // Draw the stroke as a triangle strip
      this.gl!.drawArrays(this.gl!.TRIANGLE_STRIP, 0, (segments + 1) * 2);
    }
  }

  public drawEllipse(options: DrawEllipseOptions): void {
    const {
      x,
      y,
      radiusX,
      radiusY,
      color = [0, 0, 0, 1],
      strokeColor,
      thickness = 1,
    } = options;
    this.gl!.useProgram(this.program!);

    const segments = 64; // Adjust for desired smoothness
    const angleStep = (Math.PI * 2) / segments;

    // Draw filled ellipse
    if (color) {
      const vertices: number[] = [];
      const colors: number[] = [];

      // Center vertex
      vertices.push(x, y);
      colors.push(...color);

      for (let i = 0; i <= segments; i++) {
        const angle = i * angleStep;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const px = x + cos * radiusX;
        const py = y + sin * radiusY;
        vertices.push(px, py);
        colors.push(...color);
      }

      const positionBuffer = this.getBuffer('ellipseFillPosition');
      const colorBuffer = this.getBuffer('ellipseFillColor');

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(vertices),
        this.gl!.DYNAMIC_DRAW
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(colors),
        this.gl!.DYNAMIC_DRAW
      );

      const positionLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_position'
      );
      const colorLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_color'
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
      this.gl!.enableVertexAttribArray(positionLocation);
      this.gl!.vertexAttribPointer(
        positionLocation,
        2,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
      this.gl!.enableVertexAttribArray(colorLocation);
      this.gl!.vertexAttribPointer(
        colorLocation,
        4,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      const projectionLocation = this.gl!.getUniformLocation(
        this.program!,
        'u_projection'
      );
      const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

      this.gl!.uniformMatrix4fv(
        projectionLocation,
        false,
        this.projectionMatrix!
      );
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

      this.gl!.drawArrays(this.gl!.TRIANGLE_FAN, 0, segments + 2);
    }

    // Draw stroke
    if (strokeColor && thickness > 0) {
      const strokeVertices: number[] = [];
      const strokeColors: number[] = [];

      for (let i = 0; i <= segments; i++) {
        const angle = i * angleStep;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // Outer vertex
        const outerX = x + cos * (radiusX + thickness / 2);
        const outerY = y + sin * (radiusY + thickness / 2);

        // Inner vertex
        const innerX = x + cos * (radiusX - thickness / 2);
        const innerY = y + sin * (radiusY - thickness / 2);

        // Add vertices to array
        strokeVertices.push(outerX, outerY);
        strokeVertices.push(innerX, innerY);

        // Add colors
        strokeColors.push(...strokeColor);
        strokeColors.push(...strokeColor);
      }

      const strokePositionBuffer = this.getBuffer('ellipseStrokePosition');
      const strokeColorBuffer = this.getBuffer('ellipseStrokeColor');

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(strokeVertices),
        this.gl!.DYNAMIC_DRAW
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(strokeColors),
        this.gl!.DYNAMIC_DRAW
      );

      const positionLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_position'
      );
      const colorLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_color'
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
      this.gl!.enableVertexAttribArray(positionLocation);
      this.gl!.vertexAttribPointer(
        positionLocation,
        2,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
      this.gl!.enableVertexAttribArray(colorLocation);
      this.gl!.vertexAttribPointer(
        colorLocation,
        4,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      const projectionLocation = this.gl!.getUniformLocation(
        this.program!,
        'u_projection'
      );
      const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

      this.gl!.uniformMatrix4fv(
        projectionLocation,
        false,
        this.projectionMatrix!
      );
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

      // Draw the stroke as a triangle strip
      this.gl!.drawArrays(this.gl!.TRIANGLE_STRIP, 0, (segments + 1) * 2);
    }
  }

  public drawLine(options: DrawLineOptions): void {
    const {
      x1,
      y1,
      x2,
      y2,
      strokeColor = [0, 0, 0, 1],
      thickness = 1,
      lineCap = 'butt', // 'butt', 'round', 'square'
    } = options;

    this.gl!.useProgram(this.program!);

    // Calculate direction vector
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);

    if (length === 0) return; // Avoid division by zero

    const dir = { x: dx / length, y: dy / length };

    // Calculate normal vector
    const normal = { x: -dir.y, y: dir.x };

    // Adjust for line caps
    let startOffset = 0;
    let endOffset = 0;

    if (lineCap === 'square') {
      startOffset = thickness / 2;
      endOffset = thickness / 2;
    } else if (lineCap === 'round') {
      startOffset = thickness / 2;
      endOffset = thickness / 2;
      // Round caps will be drawn separately
    }

    // Adjusted start and end points
    const sx = x1 - dir.x * startOffset;
    const sy = y1 - dir.y * startOffset;
    const ex = x2 + dir.x * endOffset;
    const ey = y2 + dir.y * endOffset;

    // Calculate quad vertices
    const tl = {
      x: sx + normal.x * (thickness / 2),
      y: sy + normal.y * (thickness / 2),
    }; // Top Left
    const bl = {
      x: sx - normal.x * (thickness / 2),
      y: sy - normal.y * (thickness / 2),
    }; // Bottom Left
    const tr = {
      x: ex + normal.x * (thickness / 2),
      y: ey + normal.y * (thickness / 2),
    }; // Top Right
    const br = {
      x: ex - normal.x * (thickness / 2),
      y: ey - normal.y * (thickness / 2),
    }; // Bottom Right

    // Vertices and colors
    const vertices = new Float32Array([
      bl.x,
      bl.y,
      br.x,
      br.y,
      tl.x,
      tl.y,
      tr.x,
      tr.y,
    ]);

    const colors = new Float32Array([
      ...strokeColor,
      ...strokeColor,
      ...strokeColor,
      ...strokeColor,
    ]);

    const positionBuffer = this.getBuffer('linePosition');
    const colorBuffer = this.getBuffer('lineColor');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, vertices, this.gl!.DYNAMIC_DRAW);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, colors, this.gl!.DYNAMIC_DRAW);

    const positionLocation = this.gl!.getAttribLocation(
      this.program!,
      'a_position'
    );
    const colorLocation = this.gl!.getAttribLocation(this.program!, 'a_color');

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, positionBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(
      positionLocation,
      2,
      this.gl!.FLOAT,
      false,
      0,
      0
    );

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.enableVertexAttribArray(colorLocation);
    this.gl!.vertexAttribPointer(colorLocation, 4, this.gl!.FLOAT, false, 0, 0);

    const projectionLocation = this.gl!.getUniformLocation(
      this.program!,
      'u_projection'
    );
    const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

    this.gl!.uniformMatrix4fv(
      projectionLocation,
      false,
      this.projectionMatrix!
    );
    this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

    // Draw the line rectangle
    this.gl!.drawArrays(this.gl!.TRIANGLE_STRIP, 0, 4);

    // Handle round line caps
    if (lineCap === 'round') {
      this.drawCircle({
        x: x1,
        y: y1,
        radius: thickness / 2,
        color: strokeColor,
      });
      this.drawCircle({
        x: x2,
        y: y2,
        radius: thickness / 2,
        color: strokeColor,
      });
    }
  }

  public drawPath(options: DrawPathOptions): void {
    const {
      points,
      fillColor,
      strokeColor = [0, 0, 0, 1],
      thickness = 1,
      closed = false,
    } = options;
    this.gl!.useProgram(this.program!);
    if (points.length < 2) return;

    // Draw filled path using triangulation if fillColor is provided
    if (fillColor) {
      const flatPoints: number[] = points.map((p) => [p.x, p.y]).flat();
      const indices = earcut(flatPoints);
      const vertices: number[] = [];
      const colors: number[] = [];

      for (const index of indices) {
        vertices.push(flatPoints[index * 2], flatPoints[index * 2 + 1]);
        colors.push(...fillColor);
      }

      const fillPositionBuffer = this.getBuffer('pathFillPosition');
      const fillColorBuffer = this.getBuffer('pathFillColor');

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillPositionBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(vertices),
        this.gl!.DYNAMIC_DRAW
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillColorBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(colors),
        this.gl!.DYNAMIC_DRAW
      );

      const positionLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_position'
      );
      const colorLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_color'
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillPositionBuffer);
      this.gl!.enableVertexAttribArray(positionLocation);
      this.gl!.vertexAttribPointer(
        positionLocation,
        2,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillColorBuffer);
      this.gl!.enableVertexAttribArray(colorLocation);
      this.gl!.vertexAttribPointer(
        colorLocation,
        4,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      const projectionLocation = this.gl!.getUniformLocation(
        this.program!,
        'u_projection'
      );
      const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

      this.gl!.uniformMatrix4fv(
        projectionLocation,
        false,
        this.projectionMatrix!
      );
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

      this.gl!.drawArrays(this.gl!.TRIANGLES, 0, indices.length);
    }

    // Draw stroke
    if (strokeColor && thickness > 0) {
      const strokeVertices: number[] = [];
      const strokeColors: number[] = [];
      const indices: number[] = [];
      const numPoints = points.length;

      // Calculate offset vertices for each point
      const offsetVertices: { x: number; y: number }[] = [];

      for (let i = 0; i < numPoints; i++) {
        let prevIndex = (i - 1 + numPoints) % numPoints;
        let nextIndex = (i + 1) % numPoints;

        if (!closed) {
          // For open paths, use current segment direction at ends
          if (i === 0) prevIndex = i;
          if (i === numPoints - 1) nextIndex = i;
        }

        const prev = points[prevIndex];
        const curr = points[i];
        const next = points[nextIndex];

        // Calculate direction vectors
        const dir1 = this.normalize(this.subtract(curr, prev));
        const dir2 = this.normalize(this.subtract(next, curr));

        // Calculate normals
        const normal1 = { x: -dir1.y, y: dir1.x };
        const normal2 = { x: -dir2.y, y: dir2.x };

        // Calculate bisector
        let bisector = { x: normal1.x + normal2.x, y: normal1.y + normal2.y };
        const bisectorLength = Math.hypot(bisector.x, bisector.y);
        if (bisectorLength === 0) {
          // Handles sharp turns (180 degrees)
          bisector = { x: normal1.x, y: normal1.y };
        } else {
          bisector = {
            x: bisector.x / bisectorLength,
            y: bisector.y / bisectorLength,
          };
        }

        // Calculate miter length
        const sinTheta = dir1.x * normal2.y - dir1.y * normal2.x;
        const miterLength = thickness / sinTheta;

        // Limit miter length to avoid spikes
        const miterLimit = thickness;
        const clampedMiterLength = Math.min(Math.abs(miterLength), miterLimit);

        // Calculate offset vertex
        const offset = this.multiply(bisector, clampedMiterLength);
        const offsetVertex = this.add(curr, offset);

        offsetVertices.push(offsetVertex);
      }

      // Build vertex and color arrays
      for (let i = 0; i < numPoints; i++) {
        const curr = points[i];
        const offsetVertex = offsetVertices[i];

        // Inner vertex (original point)
        strokeVertices.push(curr.x, curr.y);
        strokeColors.push(...strokeColor);

        // Outer vertex (offset point)
        strokeVertices.push(offsetVertex.x, offsetVertex.y);
        strokeColors.push(...strokeColor);
      }

      // Build indices for triangle strip
      for (let i = 0; i < numPoints - 1; i++) {
        indices.push(i * 2, i * 2 + 1, (i + 1) * 2, (i + 1) * 2 + 1);
      }

      if (closed) {
        // Close the loop for closed paths
        indices.push((numPoints - 1) * 2, (numPoints - 1) * 2 + 1, 0, 1);
      }

      const strokePositionBuffer = this.getBuffer('pathStrokePosition');
      const strokeColorBuffer = this.getBuffer('pathStrokeColor');
      const indexBuffer = this.getBuffer('pathStrokeIndex');

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(strokeVertices),
        this.gl!.DYNAMIC_DRAW
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(strokeColors),
        this.gl!.DYNAMIC_DRAW
      );

      this.gl!.bindBuffer(this.gl!.ELEMENT_ARRAY_BUFFER, indexBuffer);
      this.gl!.bufferData(
        this.gl!.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        this.gl!.DYNAMIC_DRAW
      );

      const positionLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_position'
      );
      const colorLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_color'
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
      this.gl!.enableVertexAttribArray(positionLocation);
      this.gl!.vertexAttribPointer(
        positionLocation,
        2,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
      this.gl!.enableVertexAttribArray(colorLocation);
      this.gl!.vertexAttribPointer(
        colorLocation,
        4,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      const projectionLocation = this.gl!.getUniformLocation(
        this.program!,
        'u_projection'
      );
      const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

      this.gl!.uniformMatrix4fv(
        projectionLocation,
        false,
        this.projectionMatrix!
      );
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

      // Draw the stroke as triangle strips
      this.gl!.drawElements(
        this.gl!.TRIANGLE_STRIP,
        indices.length,
        this.gl!.UNSIGNED_SHORT,
        0
      );
    }
  }

  public drawTriangle(params: DrawTriangleOptions): void {
    const { x1, y1, x2, y2, x3, y3, options } = params;
    const { strokeColor = [0, 0, 0, 1], fillColor, thickness = 1 } = options;

    this.gl!.useProgram(this.program!);

    // Draw filled triangle
    if (fillColor) {
      const vertices = new Float32Array([x1, y1, x2, y2, x3, y3]);

      const colors = new Float32Array([
        ...fillColor,
        ...fillColor,
        ...fillColor,
      ]);

      const fillPositionBuffer = this.getBuffer('triangleFillPosition');
      const fillColorBuffer = this.getBuffer('triangleFillColor');

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillPositionBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        vertices,
        this.gl!.DYNAMIC_DRAW
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillColorBuffer);
      this.gl!.bufferData(this.gl!.ARRAY_BUFFER, colors, this.gl!.DYNAMIC_DRAW);

      const positionLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_position'
      );
      const colorLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_color'
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillPositionBuffer);
      this.gl!.enableVertexAttribArray(positionLocation);
      this.gl!.vertexAttribPointer(
        positionLocation,
        2,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillColorBuffer);
      this.gl!.enableVertexAttribArray(colorLocation);
      this.gl!.vertexAttribPointer(
        colorLocation,
        4,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      const projectionLocation = this.gl!.getUniformLocation(
        this.program!,
        'u_projection'
      );
      const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

      this.gl!.uniformMatrix4fv(
        projectionLocation,
        false,
        this.projectionMatrix!
      );
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

      this.gl!.drawArrays(this.gl!.TRIANGLES, 0, 3);
    }

    // Draw stroke
    if (strokeColor && thickness > 0) {
      const points = [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
        { x: x3, y: y3 },
      ];

      // Calculate offset vertices for stroke
      const offsetVertices: { x: number; y: number }[] = [];
      const numPoints = points.length;

      for (let i = 0; i < numPoints; i++) {
        const prev = points[(i - 1 + numPoints) % numPoints];
        const curr = points[i];
        const next = points[(i + 1) % numPoints];

        // Compute edge directions
        const dir1 = this.normalize(this.subtract(curr, prev));
        const dir2 = this.normalize(this.subtract(next, curr));

        // Compute normals
        const normal1 = { x: -dir1.y, y: dir1.x };
        const normal2 = { x: -dir2.y, y: dir2.x };

        // Compute bisector
        let bisector = this.add(normal1, normal2);
        const bisectorLength = Math.hypot(bisector.x, bisector.y);
        if (bisectorLength === 0) {
          bisector = normal1; // Handle corner with straight line
        } else {
          bisector = {
            x: bisector.x / bisectorLength,
            y: bisector.y / bisectorLength,
          };
        }

        // Calculate miter length
        const sinTheta = (dir1.x * normal2.y - dir1.y * normal2.x) / 2;
        const miterLength = thickness / (2 * sinTheta);

        // Limit miter length
        const miterLimit = 10 * thickness;
        const clampedMiterLength = Math.min(Math.abs(miterLength), miterLimit);

        // Offset vertex
        const offset = this.multiply(bisector, clampedMiterLength);
        const offsetVertex = this.add(curr, offset);
        offsetVertices.push(offsetVertex);
      }

      // Construct vertex data for stroke
      const strokeVertices: number[] = [];
      const strokeColors: number[] = [];
      const indices: number[] = [];

      for (let i = 0; i < numPoints; i++) {
        const curr = points[i];
        const offsetVertex = offsetVertices[i];

        // Inner vertex (original point)
        strokeVertices.push(curr.x, curr.y);
        strokeColors.push(...strokeColor);

        // Outer vertex (offset point)
        strokeVertices.push(offsetVertex.x, offsetVertex.y);
        strokeColors.push(...strokeColor);
      }

      // Create indices for triangle strip
      for (let i = 0; i <= numPoints; i++) {
        const idx = i % numPoints;
        indices.push(idx * 2, idx * 2 + 1);
      }

      const strokePositionBuffer = this.getBuffer('triangleStrokePosition');
      const strokeColorBuffer = this.getBuffer('triangleStrokeColor');
      const indexBuffer = this.getBuffer('triangleStrokeIndex');

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(strokeVertices),
        this.gl!.DYNAMIC_DRAW
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(strokeColors),
        this.gl!.DYNAMIC_DRAW
      );

      this.gl!.bindBuffer(this.gl!.ELEMENT_ARRAY_BUFFER, indexBuffer);
      this.gl!.bufferData(
        this.gl!.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        this.gl!.DYNAMIC_DRAW
      );

      const positionLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_position'
      );
      const colorLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_color'
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
      this.gl!.enableVertexAttribArray(positionLocation);
      this.gl!.vertexAttribPointer(
        positionLocation,
        2,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
      this.gl!.enableVertexAttribArray(colorLocation);
      this.gl!.vertexAttribPointer(
        colorLocation,
        4,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      const projectionLocation = this.gl!.getUniformLocation(
        this.program!,
        'u_projection'
      );
      const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

      this.gl!.uniformMatrix4fv(
        projectionLocation,
        false,
        this.projectionMatrix!
      );
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

      // Draw stroke as triangle strip
      this.gl!.drawElements(
        this.gl!.TRIANGLE_STRIP,
        indices.length,
        this.gl!.UNSIGNED_SHORT,
        0
      );
    }
  }

  public drawPolygon(options: DrawPolygonOptions): void {
    const {
      points,
      strokeColor = [0, 0, 0, 1],
      fillColor,
      thickness = 1,
    } = options;

    this.gl!.useProgram(this.program!);

    // Draw filled polygon
    if (fillColor) {
      const flatPoints: number[] = points.map((p) => [p.x, p.y]).flat();
      const indices = earcut(flatPoints);
      const vertices: number[] = [];
      const colors: number[] = [];

      for (const index of indices) {
        vertices.push(flatPoints[index * 2], flatPoints[index * 2 + 1]);
        colors.push(...fillColor);
      }

      const fillPositionBuffer = this.getBuffer('polygonFillPosition');
      const fillColorBuffer = this.getBuffer('polygonFillColor');

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillPositionBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(vertices),
        this.gl!.DYNAMIC_DRAW
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillColorBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(colors),
        this.gl!.DYNAMIC_DRAW
      );

      const positionLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_position'
      );
      const colorLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_color'
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillPositionBuffer);
      this.gl!.enableVertexAttribArray(positionLocation);
      this.gl!.vertexAttribPointer(
        positionLocation,
        2,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, fillColorBuffer);
      this.gl!.enableVertexAttribArray(colorLocation);
      this.gl!.vertexAttribPointer(
        colorLocation,
        4,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      const projectionLocation = this.gl!.getUniformLocation(
        this.program!,
        'u_projection'
      );
      const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

      this.gl!.uniformMatrix4fv(
        projectionLocation,
        false,
        this.projectionMatrix!
      );
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

      this.gl!.drawArrays(this.gl!.TRIANGLES, 0, indices.length);
    }

    // Draw stroke with proper joins
    if (strokeColor && thickness > 0) {
      const strokeVertices: number[] = [];
      const strokeColors: number[] = [];

      const numPoints = points.length;
      // Arrays to store offset vertices
      const offsetVertices: { x: number; y: number }[] = [];

      // Loop through points to calculate offset vertices
      for (let i = 0; i < numPoints; i++) {
        const prev = points[(i - 1 + numPoints) % numPoints];
        const curr = points[i];
        const next = points[(i + 1) % numPoints];

        // Edge vectors
        const v1 = this.normalize(this.subtract(curr, prev));
        const v2 = this.normalize(this.subtract(next, curr));

        // Calculate normals
        const n1 = { x: -v1.y, y: v1.x };
        const n2 = { x: -v2.y, y: v2.x };

        // Calculate bisector
        const bisector = this.normalize(this.add(n1, n2));

        // Calculate angle between edges
        const cosTheta = this.dot(n1, bisector);
        const miterLength = thickness / cosTheta;

        // Limit miter length to avoid spikes
        const miterLimit = 10 * thickness;
        const clampedMiterLength = Math.min(miterLength, miterLimit);

        // Offset vertex
        const offset = this.multiply(bisector, clampedMiterLength);
        const offsetVertex = this.add(curr, offset);
        offsetVertices.push(offsetVertex);
      }

      // Create vertex data for stroke
      for (let i = 0; i < numPoints; i++) {
        const curr = points[i];
        const offsetVertex = offsetVertices[i];

        // Inner vertex (original point)
        strokeVertices.push(curr.x, curr.y);
        strokeColors.push(...strokeColor);

        // Outer vertex (offset point)
        strokeVertices.push(offsetVertex.x, offsetVertex.y);
        strokeColors.push(...strokeColor);
      }

      // Create index data for triangle strip
      const indices: number[] = [];
      for (let i = 0; i <= numPoints; i++) {
        indices.push((i % numPoints) * 2, (i % numPoints) * 2 + 1);
      }

      const strokePositionBuffer = this.getBuffer('polygonStrokePosition');
      const strokeColorBuffer = this.getBuffer('polygonStrokeColor');
      const indexBuffer = this.getBuffer('polygonStrokeIndex');

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(strokeVertices),
        this.gl!.DYNAMIC_DRAW
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
      this.gl!.bufferData(
        this.gl!.ARRAY_BUFFER,
        new Float32Array(strokeColors),
        this.gl!.DYNAMIC_DRAW
      );

      this.gl!.bindBuffer(this.gl!.ELEMENT_ARRAY_BUFFER, indexBuffer);
      this.gl!.bufferData(
        this.gl!.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        this.gl!.DYNAMIC_DRAW
      );

      const positionLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_position'
      );
      const colorLocation = this.gl!.getAttribLocation(
        this.program!,
        'a_color'
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokePositionBuffer);
      this.gl!.enableVertexAttribArray(positionLocation);
      this.gl!.vertexAttribPointer(
        positionLocation,
        2,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, strokeColorBuffer);
      this.gl!.enableVertexAttribArray(colorLocation);
      this.gl!.vertexAttribPointer(
        colorLocation,
        4,
        this.gl!.FLOAT,
        false,
        0,
        0
      );

      const projectionLocation = this.gl!.getUniformLocation(
        this.program!,
        'u_projection'
      );
      const viewLocation = this.gl!.getUniformLocation(this.program!, 'u_view');

      this.gl!.uniformMatrix4fv(
        projectionLocation,
        false,
        this.projectionMatrix!
      );
      this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);

      // Draw the stroke as a triangle strip
      this.gl!.drawElements(
        this.gl!.TRIANGLE_STRIP,
        indices.length,
        this.gl!.UNSIGNED_SHORT,
        0
      );
    }
  }

  // Helper functions
  private subtract(
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): { x: number; y: number } {
    return { x: a.x - b.x, y: a.y - b.y };
  }

  private add(
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): { x: number; y: number } {
    return { x: a.x + b.x, y: a.y + b.y };
  }

  private multiply(
    a: { x: number; y: number },
    scalar: number
  ): { x: number; y: number } {
    return { x: a.x * scalar, y: a.y * scalar };
  }

  private dot(
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): number {
    return a.x * b.x + a.y * b.y;
  }

  private normalize(a: { x: number; y: number }): { x: number; y: number } {
    const length = Math.hypot(a.x, a.y);
    return { x: a.x / length, y: a.y / length };
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
    } = {}
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
    const textContext = textCanvas.getContext('2d', {
      willReadFrequently: true,
    });

    if (!textContext) {
      throw new Error('Failed to get 2D context');
    }

    textContext.font = `${fontSize}px ${fontFamily}`;
    const metrics = textContext.measureText(text);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = fontSize;

    textCanvas.width = textWidth * 2;
    textCanvas.height = textHeight * 2;

    textContext.font = `${fontSize * 2}px ${fontFamily}`;
    textContext.textAlign = textAlign;
    textContext.textBaseline = baseline;
    textContext.fillStyle = `rgba(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255}, ${color[3]})`;

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

    const vertexBuffer = this.getBuffer('textVertex');
    const texCoordBuffer = this.getBuffer('textTexCoord');

    const texture = this.gl!.createTexture();
    this.gl!.activeTexture(this.gl!.TEXTURE0);
    this.gl!.bindTexture(this.gl!.TEXTURE_2D, texture);

    this.gl!.texImage2D(
      this.gl!.TEXTURE_2D,
      0,
      this.gl!.RGBA,
      this.gl!.RGBA,
      this.gl!.UNSIGNED_BYTE,
      textCanvas
    );

    this.gl!.texParameteri(
      this.gl!.TEXTURE_2D,
      this.gl!.TEXTURE_MIN_FILTER,
      this.gl!.LINEAR
    );
    this.gl!.texParameteri(
      this.gl!.TEXTURE_2D,
      this.gl!.TEXTURE_MAG_FILTER,
      this.gl!.LINEAR
    );
    this.gl!.texParameteri(
      this.gl!.TEXTURE_2D,
      this.gl!.TEXTURE_WRAP_S,
      this.gl!.CLAMP_TO_EDGE
    );
    this.gl!.texParameteri(
      this.gl!.TEXTURE_2D,
      this.gl!.TEXTURE_WRAP_T,
      this.gl!.CLAMP_TO_EDGE
    );

    const vertices = new Float32Array([
      x,
      y,
      x + textWidth,
      y,
      x,
      y + textHeight,
      x + textWidth,
      y + textHeight,
    ]);

    const texCoords = new Float32Array([
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0,
    ]);

    this.gl!.useProgram(this.textProgram!);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, vertexBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, vertices, this.gl!.DYNAMIC_DRAW);

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, texCoordBuffer);
    this.gl!.bufferData(
      this.gl!.ARRAY_BUFFER,
      texCoords,
      this.gl!.DYNAMIC_DRAW
    );

    const positionLocation = this.gl!.getAttribLocation(
      this.textProgram!,
      'a_position'
    );
    const texCoordLocation = this.gl!.getAttribLocation(
      this.textProgram!,
      'a_texCoord'
    );

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, vertexBuffer);
    this.gl!.enableVertexAttribArray(positionLocation);
    this.gl!.vertexAttribPointer(
      positionLocation,
      2,
      this.gl!.FLOAT,
      false,
      0,
      0
    );

    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, texCoordBuffer);
    this.gl!.enableVertexAttribArray(texCoordLocation);
    this.gl!.vertexAttribPointer(
      texCoordLocation,
      2,
      this.gl!.FLOAT,
      false,
      0,
      0
    );

    const projectionLocation = this.gl!.getUniformLocation(
      this.textProgram!,
      'u_projection'
    );
    const viewLocation = this.gl!.getUniformLocation(
      this.textProgram!,
      'u_view'
    );
    const textureLocation = this.gl!.getUniformLocation(
      this.textProgram!,
      'u_texture'
    );

    this.gl!.uniformMatrix4fv(
      projectionLocation,
      false,
      this.projectionMatrix!
    );
    this.gl!.uniformMatrix4fv(viewLocation, false, this.viewMatrix!);
    this.gl!.uniform1i(textureLocation, 0);

    this.gl!.drawArrays(this.gl!.TRIANGLE_STRIP, 0, 4);

    this.gl!.bindTexture(this.gl!.TEXTURE_2D, null);
    this.gl!.deleteTexture(texture);

    this.gl!.useProgram(this.program!);

    return {
      width: textWidth,
      height: textHeight,
    };
  }

  public screenToWorld(
    screenX: number,
    screenY: number
  ): { x: number; y: number } {
    return {
      x: (screenX - this.viewport.x) / this.viewport.scale,
      y: (screenY - this.viewport.y) / this.viewport.scale,
    };
  }
}
