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
      
      void main() {
        gl_Position = u_projection * u_view * vec4(a_position, 0.0, 1.0);
        v_color = a_color;
      }
    `);

    const fragmentShader = this.createShader(this.gl!.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec4 v_color;
      
      void main() {
        gl_FragColor = v_color;
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
    // Матрица проекции для 2D рендеринга
    this.projectionMatrix = new Float32Array([
      2 / this.gl!.canvas.width, 0, 0, 0,
      0, -2 / this.gl!.canvas.height, 0, 0,
      0, 0, 1, 0,
      -1, 1, 0, 1,
    ]);

    // Матрица вида для панорамирования и масштабирования
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

    if (!this.projectionMatrix || !this.viewMatrix) {
      throw new Error('Matrices are not initialized');
    }

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
}