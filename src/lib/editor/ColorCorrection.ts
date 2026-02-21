/**
 * ColorCorrection - Professional Color Correction & Filter Engine
 *
 * Provides WebGL-accelerated color correction tools and creative filters
 * for real-time image processing and non-destructive editing.
 */

import type {
  AdjustmentParams,
  BrightnessContrastParams,
  LevelsParams,
  CurvesParams,
  HSLParams,
  ColorBalanceParams,
  VibranceParams,
  ExposureParams,
  TemperatureParams,
  BlurParams,
  SharpenParams,
  VignetteParams,
  GrainParams,
  ChromaticAberrationParams,
  SplitToningParams,
  GradientMapParams,
  BlendMode,
  CurvePoint,
} from './AdjustmentStack';

// ============================================================================
// Types
// ============================================================================

export interface ProcessingContext {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext | null;
  ctx2d: CanvasRenderingContext2D | null;
  useWebGL: boolean;
}

export interface FilterResult {
  success: boolean;
  imageData?: ImageData;
  canvas?: HTMLCanvasElement;
  error?: string;
  processingTime?: number;
}

// ============================================================================
// WebGL Shader Sources
// ============================================================================

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
  }
`;

const FRAGMENT_SHADER_HEADER = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_image;
  uniform vec2 u_resolution;
`;

const BRIGHTNESS_CONTRAST_SHADER = `
  ${FRAGMENT_SHADER_HEADER}
  uniform float u_brightness;
  uniform float u_contrast;

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);

    // Apply brightness
    color.rgb += u_brightness;

    // Apply contrast
    color.rgb = (color.rgb - 0.5) * u_contrast + 0.5;

    gl_FragColor = clamp(color, 0.0, 1.0);
  }
`;

const LEVELS_SHADER = `
  ${FRAGMENT_SHADER_HEADER}
  uniform float u_inputBlack;
  uniform float u_inputWhite;
  uniform float u_inputGamma;
  uniform float u_outputBlack;
  uniform float u_outputWhite;

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);

    // Input levels
    color.rgb = (color.rgb - u_inputBlack) / (u_inputWhite - u_inputBlack);
    color.rgb = clamp(color.rgb, 0.0, 1.0);

    // Gamma
    color.rgb = pow(color.rgb, vec3(1.0 / u_inputGamma));

    // Output levels
    color.rgb = color.rgb * (u_outputWhite - u_outputBlack) + u_outputBlack;

    gl_FragColor = clamp(color, 0.0, 1.0);
  }
`;

const HSL_SHADER = `
  ${FRAGMENT_SHADER_HEADER}
  uniform float u_hue;
  uniform float u_saturation;
  uniform float u_lightness;

  vec3 rgb2hsl(vec3 c) {
    float maxC = max(max(c.r, c.g), c.b);
    float minC = min(min(c.r, c.g), c.b);
    float l = (maxC + minC) / 2.0;
    float h = 0.0;
    float s = 0.0;

    if (maxC != minC) {
      float d = maxC - minC;
      s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);

      if (maxC == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
      else if (maxC == c.g) h = (c.b - c.r) / d + 2.0;
      else h = (c.r - c.g) / d + 4.0;

      h /= 6.0;
    }

    return vec3(h, s, l);
  }

  vec3 hsl2rgb(vec3 c) {
    float h = c.x;
    float s = c.y;
    float l = c.z;

    if (s == 0.0) return vec3(l);

    float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
    float p = 2.0 * l - q;

    float r = h + 1.0/3.0;
    float g = h;
    float b = h - 1.0/3.0;

    r = r < 0.0 ? r + 1.0 : (r > 1.0 ? r - 1.0 : r);
    g = g < 0.0 ? g + 1.0 : (g > 1.0 ? g - 1.0 : g);
    b = b < 0.0 ? b + 1.0 : (b > 1.0 ? b - 1.0 : b);

    float rr = r < 1.0/6.0 ? p + (q - p) * 6.0 * r :
               r < 1.0/2.0 ? q :
               r < 2.0/3.0 ? p + (q - p) * (2.0/3.0 - r) * 6.0 : p;
    float gg = g < 1.0/6.0 ? p + (q - p) * 6.0 * g :
               g < 1.0/2.0 ? q :
               g < 2.0/3.0 ? p + (q - p) * (2.0/3.0 - g) * 6.0 : p;
    float bb = b < 1.0/6.0 ? p + (q - p) * 6.0 * b :
               b < 1.0/2.0 ? q :
               b < 2.0/3.0 ? p + (q - p) * (2.0/3.0 - b) * 6.0 : p;

    return vec3(rr, gg, bb);
  }

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    vec3 hsl = rgb2hsl(color.rgb);

    // Apply adjustments
    hsl.x = mod(hsl.x + u_hue, 1.0);
    hsl.y = clamp(hsl.y + u_saturation, 0.0, 1.0);
    hsl.z = clamp(hsl.z + u_lightness, 0.0, 1.0);

    gl_FragColor = vec4(hsl2rgb(hsl), color.a);
  }
`;

const TEMPERATURE_SHADER = `
  ${FRAGMENT_SHADER_HEADER}
  uniform float u_temperature;
  uniform float u_tint;

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);

    // Temperature (warm/cool)
    color.r += u_temperature * 0.1;
    color.b -= u_temperature * 0.1;

    // Tint (green/magenta)
    color.g += u_tint * 0.1;

    gl_FragColor = clamp(color, 0.0, 1.0);
  }
`;

const VIGNETTE_SHADER = `
  ${FRAGMENT_SHADER_HEADER}
  uniform float u_amount;
  uniform float u_midpoint;
  uniform float u_feather;
  uniform float u_roundness;

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);

    vec2 center = vec2(0.5, 0.5);
    vec2 uv = v_texCoord - center;

    // Apply roundness
    uv.x *= 1.0 + u_roundness * 0.01;

    float dist = length(uv) * 2.0;
    float vignette = smoothstep(u_midpoint * 0.01, u_midpoint * 0.01 + u_feather * 0.01, dist);

    color.rgb = mix(color.rgb, color.rgb * (1.0 - u_amount * 0.01), vignette);

    gl_FragColor = color;
  }
`;

const BLUR_SHADER = `
  ${FRAGMENT_SHADER_HEADER}
  uniform float u_radius;

  void main() {
    vec4 color = vec4(0.0);
    float total = 0.0;

    float radius = u_radius;
    for (float x = -4.0; x <= 4.0; x += 1.0) {
      for (float y = -4.0; y <= 4.0; y += 1.0) {
        vec2 offset = vec2(x, y) * radius / u_resolution;
        float weight = 1.0 - length(vec2(x, y)) / 5.66;
        if (weight > 0.0) {
          color += texture2D(u_image, v_texCoord + offset) * weight;
          total += weight;
        }
      }
    }

    gl_FragColor = color / total;
  }
`;

// ============================================================================
// ColorCorrection Class
// ============================================================================

export class ColorCorrection {
  private static instance: ColorCorrection;
  private gl: WebGLRenderingContext | null = null;
  private programs: Map<string, WebGLProgram> = new Map();
  private canvas: HTMLCanvasElement | null = null;
  private webglSupported = false;

  private constructor() {
    this.initWebGL();
  }

  static getInstance(): ColorCorrection {
    if (!ColorCorrection.instance) {
      ColorCorrection.instance = new ColorCorrection();
    }
    return ColorCorrection.instance;
  }

  // -------------------------------------------------------------------------
  // WebGL Initialization
  // -------------------------------------------------------------------------

  private initWebGL(): void {
    if (typeof window === 'undefined') return;

    try {
      this.canvas = document.createElement('canvas');
      this.gl = this.canvas.getContext('webgl', {
        preserveDrawingBuffer: true,
        premultipliedAlpha: false,
      });

      if (this.gl) {
        this.webglSupported = true;
        this.compileShaders();
      }
    } catch (err) {
      console.warn('WebGL not supported, falling back to Canvas 2D:', err);
      this.webglSupported = false;
    }
  }

  private compileShaders(): void {
    if (!this.gl) return;

    const shaders: Record<string, string> = {
      'brightness-contrast': BRIGHTNESS_CONTRAST_SHADER,
      levels: LEVELS_SHADER,
      hsl: HSL_SHADER,
      temperature: TEMPERATURE_SHADER,
      vignette: VIGNETTE_SHADER,
      blur: BLUR_SHADER,
    };

    for (const [name, fragmentSource] of Object.entries(shaders)) {
      const program = this.createProgram(VERTEX_SHADER, fragmentSource);
      if (program) {
        this.programs.set(name, program);
      }
    }
  }

  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null;

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) return null;

    const program = this.gl.createProgram();
    if (!program) return null;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(program));
      return null;
    }

    return program;
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

  // -------------------------------------------------------------------------
  // Image Processing
  // -------------------------------------------------------------------------

  async processImage(
    imageSource: HTMLImageElement | HTMLCanvasElement | ImageData,
    adjustments: AdjustmentParams[],
    options?: { useWebGL?: boolean }
  ): Promise<FilterResult> {
    const startTime = performance.now();

    try {
      // Convert source to ImageData
      let imageData = await this.getImageData(imageSource);

      // Apply each adjustment in order
      for (const adjustment of adjustments) {
        imageData = await this.applyAdjustment(imageData, adjustment, options?.useWebGL ?? this.webglSupported);
      }

      const processingTime = performance.now() - startTime;

      return {
        success: true,
        imageData,
        processingTime,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  private async getImageData(source: HTMLImageElement | HTMLCanvasElement | ImageData): Promise<ImageData> {
    if (source instanceof ImageData) {
      return source;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');

    if (source instanceof HTMLImageElement) {
      canvas.width = source.naturalWidth || source.width;
      canvas.height = source.naturalHeight || source.height;
      ctx.drawImage(source, 0, 0);
    } else {
      canvas.width = source.width;
      canvas.height = source.height;
      ctx.drawImage(source, 0, 0);
    }

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private async applyAdjustment(
    imageData: ImageData,
    adjustment: AdjustmentParams,
    useWebGL: boolean
  ): Promise<ImageData> {
    // Try WebGL first if available
    if (useWebGL && this.webglSupported && this.programs.has(adjustment.type)) {
      return this.applyWebGLAdjustment(imageData, adjustment);
    }

    // Fall back to Canvas 2D
    return this.applyCanvas2DAdjustment(imageData, adjustment);
  }

  // -------------------------------------------------------------------------
  // WebGL Processing
  // -------------------------------------------------------------------------

  private applyWebGLAdjustment(imageData: ImageData, adjustment: AdjustmentParams): ImageData {
    if (!this.gl || !this.canvas) {
      return this.applyCanvas2DAdjustment(imageData, adjustment);
    }

    const gl = this.gl;
    const program = this.programs.get(adjustment.type);
    if (!program) {
      return this.applyCanvas2DAdjustment(imageData, adjustment);
    }

    // Setup canvas
    this.canvas.width = imageData.width;
    this.canvas.height = imageData.height;
    gl.viewport(0, 0, imageData.width, imageData.height);

    // Use program
    gl.useProgram(program);

    // Create and bind texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);

    // Setup vertices
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Setup texture coordinates
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Set uniforms based on adjustment type
    this.setUniforms(gl, program, adjustment, imageData.width, imageData.height);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Read pixels
    const resultData = new Uint8ClampedArray(imageData.width * imageData.height * 4);
    gl.readPixels(0, 0, imageData.width, imageData.height, gl.RGBA, gl.UNSIGNED_BYTE, resultData);

    // Cleanup
    gl.deleteTexture(texture);
    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(texCoordBuffer);

    return new ImageData(resultData, imageData.width, imageData.height);
  }

  private setUniforms(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    adjustment: AdjustmentParams,
    width: number,
    height: number
  ): void {
    // Resolution uniform
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    if (resolutionLocation) {
      gl.uniform2f(resolutionLocation, width, height);
    }

    switch (adjustment.type) {
      case 'brightness-contrast': {
        const params = adjustment.params as BrightnessContrastParams;
        gl.uniform1f(gl.getUniformLocation(program, 'u_brightness'), params.brightness / 100);
        gl.uniform1f(gl.getUniformLocation(program, 'u_contrast'), 1 + params.contrast / 100);
        break;
      }
      case 'levels': {
        const params = adjustment.params as LevelsParams;
        gl.uniform1f(gl.getUniformLocation(program, 'u_inputBlack'), params.inputBlack / 255);
        gl.uniform1f(gl.getUniformLocation(program, 'u_inputWhite'), params.inputWhite / 255);
        gl.uniform1f(gl.getUniformLocation(program, 'u_inputGamma'), params.inputGamma);
        gl.uniform1f(gl.getUniformLocation(program, 'u_outputBlack'), params.outputBlack / 255);
        gl.uniform1f(gl.getUniformLocation(program, 'u_outputWhite'), params.outputWhite / 255);
        break;
      }
      case 'hsl': {
        const params = adjustment.params as HSLParams;
        gl.uniform1f(gl.getUniformLocation(program, 'u_hue'), params.hue / 360);
        gl.uniform1f(gl.getUniformLocation(program, 'u_saturation'), params.saturation / 100);
        gl.uniform1f(gl.getUniformLocation(program, 'u_lightness'), params.lightness / 100);
        break;
      }
      case 'temperature': {
        const params = adjustment.params as TemperatureParams;
        gl.uniform1f(gl.getUniformLocation(program, 'u_temperature'), params.temperature / 100);
        gl.uniform1f(gl.getUniformLocation(program, 'u_tint'), params.tint / 100);
        break;
      }
      case 'vignette': {
        const params = adjustment.params as VignetteParams;
        gl.uniform1f(gl.getUniformLocation(program, 'u_amount'), params.amount);
        gl.uniform1f(gl.getUniformLocation(program, 'u_midpoint'), params.midpoint);
        gl.uniform1f(gl.getUniformLocation(program, 'u_feather'), params.feather);
        gl.uniform1f(gl.getUniformLocation(program, 'u_roundness'), params.roundness);
        break;
      }
      case 'blur': {
        const params = adjustment.params as BlurParams;
        gl.uniform1f(gl.getUniformLocation(program, 'u_radius'), params.radius);
        break;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Canvas 2D Processing (Fallback)
  // -------------------------------------------------------------------------

  private applyCanvas2DAdjustment(imageData: ImageData, adjustment: AdjustmentParams): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    switch (adjustment.type) {
      case 'brightness-contrast':
        this.applyBrightnessContrast(data, adjustment.params as BrightnessContrastParams);
        break;
      case 'levels':
        this.applyLevels(data, adjustment.params as LevelsParams);
        break;
      case 'curves':
        this.applyCurves(data, adjustment.params as CurvesParams);
        break;
      case 'hsl':
        this.applyHSL(data, adjustment.params as HSLParams);
        break;
      case 'color-balance':
        this.applyColorBalance(data, adjustment.params as ColorBalanceParams);
        break;
      case 'vibrance':
        this.applyVibrance(data, adjustment.params as VibranceParams);
        break;
      case 'exposure':
        this.applyExposure(data, adjustment.params as ExposureParams);
        break;
      case 'temperature':
        this.applyTemperature(data, adjustment.params as TemperatureParams);
        break;
      case 'sharpen':
        this.applySharpen(data, width, height, adjustment.params as SharpenParams);
        break;
      case 'vignette':
        this.applyVignette(data, width, height, adjustment.params as VignetteParams);
        break;
      case 'grain':
        this.applyGrain(data, adjustment.params as GrainParams);
        break;
      case 'chromatic-aberration':
        this.applyChromaticAberration(data, width, height, adjustment.params as ChromaticAberrationParams);
        break;
      case 'split-toning':
        this.applySplitToning(data, adjustment.params as SplitToningParams);
        break;
      case 'gradient-map':
        this.applyGradientMap(data, adjustment.params as GradientMapParams);
        break;
    }

    return new ImageData(data, width, height);
  }

  private applyBrightnessContrast(data: Uint8ClampedArray, params: BrightnessContrastParams): void {
    const brightness = params.brightness * 2.55;
    const contrast = (params.contrast + 100) / 100;
    const intercept = 128 * (1 - contrast);

    for (let i = 0; i < data.length; i += 4) {
      data[i] = this.clamp(data[i] * contrast + intercept + brightness);
      data[i + 1] = this.clamp(data[i + 1] * contrast + intercept + brightness);
      data[i + 2] = this.clamp(data[i + 2] * contrast + intercept + brightness);
    }
  }

  private applyLevels(data: Uint8ClampedArray, params: LevelsParams): void {
    const inputRange = params.inputWhite - params.inputBlack;
    const outputRange = params.outputWhite - params.outputBlack;

    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let value = (data[i + c] - params.inputBlack) / inputRange;
        value = Math.max(0, Math.min(1, value));
        value = Math.pow(value, 1 / params.inputGamma);
        data[i + c] = this.clamp(value * outputRange + params.outputBlack);
      }
    }
  }

  private applyCurves(data: Uint8ClampedArray, params: CurvesParams): void {
    const rgbLut = this.buildCurveLUT(params.rgb);
    const redLut = this.buildCurveLUT(params.red);
    const greenLut = this.buildCurveLUT(params.green);
    const blueLut = this.buildCurveLUT(params.blue);

    for (let i = 0; i < data.length; i += 4) {
      data[i] = redLut[rgbLut[data[i]]];
      data[i + 1] = greenLut[rgbLut[data[i + 1]]];
      data[i + 2] = blueLut[rgbLut[data[i + 2]]];
    }
  }

  private buildCurveLUT(points: CurvePoint[]): Uint8Array {
    const lut = new Uint8Array(256);

    if (points.length < 2) {
      for (let i = 0; i < 256; i++) lut[i] = i;
      return lut;
    }

    // Sort points by x
    const sorted = [...points].sort((a, b) => a.x - b.x);

    // Interpolate
    for (let i = 0; i < 256; i++) {
      // Find surrounding points
      let p1 = sorted[0];
      let p2 = sorted[sorted.length - 1];

      for (let j = 0; j < sorted.length - 1; j++) {
        if (sorted[j].x <= i && sorted[j + 1].x >= i) {
          p1 = sorted[j];
          p2 = sorted[j + 1];
          break;
        }
      }

      // Linear interpolation
      const t = p2.x === p1.x ? 0 : (i - p1.x) / (p2.x - p1.x);
      lut[i] = this.clamp(p1.y + t * (p2.y - p1.y));
    }

    return lut;
  }

  private applyHSL(data: Uint8ClampedArray, params: HSLParams): void {
    for (let i = 0; i < data.length; i += 4) {
      const [h, s, l] = this.rgbToHsl(data[i], data[i + 1], data[i + 2]);

      const newH = (h + params.hue / 360 + 1) % 1;
      const newS = Math.max(0, Math.min(1, s + params.saturation / 100));
      const newL = Math.max(0, Math.min(1, l + params.lightness / 100));

      const [r, g, b] = this.hslToRgb(newH, newS, newL);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  private applyColorBalance(data: Uint8ClampedArray, params: ColorBalanceParams): void {
    for (let i = 0; i < data.length; i += 4) {
      const [, , l] = this.rgbToHsl(data[i], data[i + 1], data[i + 2]);

      // Determine which tonal range
      let adjustments: { cyan_red: number; magenta_green: number; yellow_blue: number };
      if (l < 0.33) {
        adjustments = params.shadows;
      } else if (l < 0.67) {
        adjustments = params.midtones;
      } else {
        adjustments = params.highlights;
      }

      data[i] = this.clamp(data[i] + adjustments.cyan_red * 2.55);
      data[i + 1] = this.clamp(data[i + 1] + adjustments.magenta_green * 2.55);
      data[i + 2] = this.clamp(data[i + 2] + adjustments.yellow_blue * 2.55);
    }
  }

  private applyVibrance(data: Uint8ClampedArray, params: VibranceParams): void {
    const vibrance = params.vibrance / 100;
    const saturation = params.saturation / 100;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const avg = (r + g + b) / 3;
      const currentSat = max === 0 ? 0 : (max - min) / max;

      // Vibrance affects less saturated colors more
      const vibranceAdjust = vibrance * (1 - currentSat);
      const totalAdjust = saturation + vibranceAdjust;

      data[i] = this.clamp((r + (r - avg) * totalAdjust) * 255);
      data[i + 1] = this.clamp((g + (g - avg) * totalAdjust) * 255);
      data[i + 2] = this.clamp((b + (b - avg) * totalAdjust) * 255);
    }
  }

  private applyExposure(data: Uint8ClampedArray, params: ExposureParams): void {
    const exposure = Math.pow(2, params.exposure);
    const offset = params.offset * 255;

    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let value = data[i + c] / 255;
        value = value * exposure + offset / 255;
        value = Math.pow(Math.max(0, value), 1 / params.gamma);
        data[i + c] = this.clamp(value * 255);
      }
    }
  }

  private applyTemperature(data: Uint8ClampedArray, params: TemperatureParams): void {
    const temp = params.temperature / 100;
    const tint = params.tint / 100;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = this.clamp(data[i] + temp * 25);
      data[i + 1] = this.clamp(data[i + 1] + tint * 25);
      data[i + 2] = this.clamp(data[i + 2] - temp * 25);
    }
  }

  private applySharpen(data: Uint8ClampedArray, width: number, height: number, params: SharpenParams): void {
    const amount = params.amount / 100;
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    const copy = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += copy[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          const idx = (y * width + x) * 4 + c;
          data[idx] = this.clamp(copy[idx] * (1 - amount) + sum * amount);
        }
      }
    }
  }

  private applyVignette(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    params: VignetteParams
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = (x - centerX) * (1 + params.roundness / 100);
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;

        const midpoint = params.midpoint / 100;
        const feather = params.feather / 100;

        let vignette = 0;
        if (dist > midpoint) {
          vignette = Math.min(1, (dist - midpoint) / feather);
        }

        const factor = 1 - vignette * (params.amount / 100);
        const idx = (y * width + x) * 4;

        data[idx] = this.clamp(data[idx] * factor);
        data[idx + 1] = this.clamp(data[idx + 1] * factor);
        data[idx + 2] = this.clamp(data[idx + 2] * factor);
      }
    }
  }

  private applyGrain(data: Uint8ClampedArray, params: GrainParams): void {
    const amount = params.amount / 100;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * amount * 100;

      if (params.monochromatic) {
        data[i] = this.clamp(data[i] + noise);
        data[i + 1] = this.clamp(data[i + 1] + noise);
        data[i + 2] = this.clamp(data[i + 2] + noise);
      } else {
        data[i] = this.clamp(data[i] + (Math.random() - 0.5) * amount * 100);
        data[i + 1] = this.clamp(data[i + 1] + (Math.random() - 0.5) * amount * 100);
        data[i + 2] = this.clamp(data[i + 2] + (Math.random() - 0.5) * amount * 100);
      }
    }
  }

  private applyChromaticAberration(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    params: ChromaticAberrationParams
  ): void {
    const copy = new Uint8ClampedArray(data);
    const offsetR = params.redCyan / 100;
    const offsetB = params.blueYellow / 100;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        // Offset red channel
        const rX = Math.round(x + offsetR * 5);
        if (rX >= 0 && rX < width) {
          data[idx] = copy[(y * width + rX) * 4];
        }

        // Offset blue channel
        const bX = Math.round(x - offsetB * 5);
        if (bX >= 0 && bX < width) {
          data[idx + 2] = copy[(y * width + bX) * 4 + 2];
        }
      }
    }
  }

  private applySplitToning(data: Uint8ClampedArray, params: SplitToningParams): void {
    const highlightColor = this.hslToRgb(params.highlightHue / 360, params.highlightSaturation / 100, 0.5);
    const shadowColor = this.hslToRgb(params.shadowHue / 360, params.shadowSaturation / 100, 0.5);

    for (let i = 0; i < data.length; i += 4) {
      const luminance = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      const balance = (params.balance + 100) / 200;

      // Determine blend between shadow and highlight toning
      const shadowWeight = Math.max(0, 0.5 - luminance) * 2 * (1 - balance);
      const highlightWeight = Math.max(0, luminance - 0.5) * 2 * balance;

      data[i] = this.clamp(data[i] + (shadowColor[0] - 128) * shadowWeight + (highlightColor[0] - 128) * highlightWeight);
      data[i + 1] = this.clamp(data[i + 1] + (shadowColor[1] - 128) * shadowWeight + (highlightColor[1] - 128) * highlightWeight);
      data[i + 2] = this.clamp(data[i + 2] + (shadowColor[2] - 128) * shadowWeight + (highlightColor[2] - 128) * highlightWeight);
    }
  }

  private applyGradientMap(data: Uint8ClampedArray, params: GradientMapParams): void {
    // Build gradient LUT
    const gradientLut: Array<[number, number, number]> = [];
    const stops = [...params.stops].sort((a, b) => a.position - b.position);

    for (let i = 0; i < 256; i++) {
      const pos = i / 255;

      // Find surrounding stops
      let stop1 = stops[0];
      let stop2 = stops[stops.length - 1];

      for (let j = 0; j < stops.length - 1; j++) {
        if (stops[j].position <= pos && stops[j + 1].position >= pos) {
          stop1 = stops[j];
          stop2 = stops[j + 1];
          break;
        }
      }

      const t = stop2.position === stop1.position ? 0 : (pos - stop1.position) / (stop2.position - stop1.position);
      const color1 = this.hexToRgb(stop1.color);
      const color2 = this.hexToRgb(stop2.color);

      gradientLut[i] = [
        Math.round(color1[0] + t * (color2[0] - color1[0])),
        Math.round(color1[1] + t * (color2[1] - color1[1])),
        Math.round(color1[2] + t * (color2[2] - color1[2])),
      ];
    }

    // Apply gradient map
    for (let i = 0; i < data.length; i += 4) {
      const luminance = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      const [r, g, b] = gradientLut[luminance];
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  // -------------------------------------------------------------------------
  // Blend Mode Application
  // -------------------------------------------------------------------------

  applyBlendMode(
    baseData: ImageData,
    overlayData: ImageData,
    mode: BlendMode,
    opacity: number
  ): ImageData {
    const result = new Uint8ClampedArray(baseData.data);
    const opacityFactor = opacity / 100;

    for (let i = 0; i < result.length; i += 4) {
      const baseR = baseData.data[i] / 255;
      const baseG = baseData.data[i + 1] / 255;
      const baseB = baseData.data[i + 2] / 255;

      const overlayR = overlayData.data[i] / 255;
      const overlayG = overlayData.data[i + 1] / 255;
      const overlayB = overlayData.data[i + 2] / 255;

      let [r, g, b] = this.blendColors(
        [baseR, baseG, baseB],
        [overlayR, overlayG, overlayB],
        mode
      );

      // Apply opacity
      r = baseR + (r - baseR) * opacityFactor;
      g = baseG + (g - baseG) * opacityFactor;
      b = baseB + (b - baseB) * opacityFactor;

      result[i] = this.clamp(r * 255);
      result[i + 1] = this.clamp(g * 255);
      result[i + 2] = this.clamp(b * 255);
    }

    return new ImageData(result, baseData.width, baseData.height);
  }

  private blendColors(
    base: [number, number, number],
    overlay: [number, number, number],
    mode: BlendMode
  ): [number, number, number] {
    const [bR, bG, bB] = base;
    const [oR, oG, oB] = overlay;

    switch (mode) {
      case 'normal':
        return overlay;
      case 'multiply':
        return [bR * oR, bG * oG, bB * oB];
      case 'screen':
        return [1 - (1 - bR) * (1 - oR), 1 - (1 - bG) * (1 - oG), 1 - (1 - bB) * (1 - oB)];
      case 'overlay':
        return [
          bR < 0.5 ? 2 * bR * oR : 1 - 2 * (1 - bR) * (1 - oR),
          bG < 0.5 ? 2 * bG * oG : 1 - 2 * (1 - bG) * (1 - oG),
          bB < 0.5 ? 2 * bB * oB : 1 - 2 * (1 - bB) * (1 - oB),
        ];
      case 'soft-light':
        return [
          oR < 0.5 ? bR - (1 - 2 * oR) * bR * (1 - bR) : bR + (2 * oR - 1) * (this.softLightD(bR) - bR),
          oG < 0.5 ? bG - (1 - 2 * oG) * bG * (1 - bG) : bG + (2 * oG - 1) * (this.softLightD(bG) - bG),
          oB < 0.5 ? bB - (1 - 2 * oB) * bB * (1 - bB) : bB + (2 * oB - 1) * (this.softLightD(bB) - bB),
        ];
      case 'hard-light':
        return [
          oR < 0.5 ? 2 * bR * oR : 1 - 2 * (1 - bR) * (1 - oR),
          oG < 0.5 ? 2 * bG * oG : 1 - 2 * (1 - bG) * (1 - oG),
          oB < 0.5 ? 2 * bB * oB : 1 - 2 * (1 - bB) * (1 - oB),
        ];
      case 'color-dodge':
        return [
          oR === 1 ? 1 : Math.min(1, bR / (1 - oR)),
          oG === 1 ? 1 : Math.min(1, bG / (1 - oG)),
          oB === 1 ? 1 : Math.min(1, bB / (1 - oB)),
        ];
      case 'color-burn':
        return [
          oR === 0 ? 0 : Math.max(0, 1 - (1 - bR) / oR),
          oG === 0 ? 0 : Math.max(0, 1 - (1 - bG) / oG),
          oB === 0 ? 0 : Math.max(0, 1 - (1 - bB) / oB),
        ];
      case 'darken':
        return [Math.min(bR, oR), Math.min(bG, oG), Math.min(bB, oB)];
      case 'lighten':
        return [Math.max(bR, oR), Math.max(bG, oG), Math.max(bB, oB)];
      case 'difference':
        return [Math.abs(bR - oR), Math.abs(bG - oG), Math.abs(bB - oB)];
      case 'exclusion':
        return [bR + oR - 2 * bR * oR, bG + oG - 2 * bG * oG, bB + oB - 2 * bB * oB];
      default:
        return overlay;
    }
  }

  private softLightD(x: number): number {
    return x <= 0.25 ? ((16 * x - 12) * x + 4) * x : Math.sqrt(x);
  }

  // -------------------------------------------------------------------------
  // Utility Functions
  // -------------------------------------------------------------------------

  private clamp(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  private rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return [h, s, l];
  }

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 0, 0];
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
  }

  // -------------------------------------------------------------------------
  // Public Utilities
  // -------------------------------------------------------------------------

  isWebGLSupported(): boolean {
    return this.webglSupported;
  }

  getAvailableFilters(): string[] {
    return Array.from(this.programs.keys());
  }
}

// Export singleton instance
export const colorCorrection = ColorCorrection.getInstance();
