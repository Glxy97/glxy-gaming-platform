export interface PerformanceMetrics {
  fps: number
  frameTime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  drawCalls: number
  triangles: number
  entities: number
}

export interface PerformanceCallbacks {
  onPerformanceWarning?: (metrics: PerformanceMetrics) => void
  onPerformanceCritical?: (metrics: PerformanceMetrics) => void
  onPerformanceRecovery?: (metrics: PerformanceMetrics) => void
}

export class PerformanceMonitor {
  private callbacks: PerformanceCallbacks
  private metrics: PerformanceMetrics
  private frameCount: number = 0
  private lastTime: number = 0
  private frameTimes: number[] = []
  private maxFrameTimeSamples: number = 60

  constructor(callbacks: PerformanceCallbacks = {}) {
    this.callbacks = callbacks
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memory: { used: 0, total: 0, percentage: 0 },
      drawCalls: 0,
      triangles: 0,
      entities: 0
    }
    this.lastTime = performance.now()
  }

  update(): void {
    const now = performance.now()
    const deltaTime = now - this.lastTime
    this.lastTime = now

    // Update frame time samples
    this.frameTimes.push(deltaTime)
    if (this.frameTimes.length > this.maxFrameTimeSamples) {
      this.frameTimes.shift()
    }

    // Calculate FPS
    this.frameCount++
    if (this.frameCount % 30 === 0) { // Update every 30 frames
      const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      this.metrics.fps = Math.round(1000 / avgFrameTime)
      this.metrics.frameTime = Math.round(avgFrameTime * 100) / 100

      // Update memory info
      this.updateMemoryInfo()

      // Check performance thresholds
      this.checkPerformanceThresholds()
    }
  }

  private updateMemoryInfo(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.metrics.memory = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // Convert to MB
        total: Math.round(memory.totalJSHeapSize / 1048576),
        percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
      }
    } else {
      // Fallback for browsers that don't support memory API
      this.metrics.memory = {
        used: 0,
        total: 0,
        percentage: 0
      }
    }
  }

  private checkPerformanceThresholds(): void {
    const { fps, memory } = this.metrics

    // Performance thresholds
    const fpsWarning = 30
    const fpsCritical = 15
    const memoryWarning = 80
    const memoryCritical = 90

    let isWarning = false
    let isCritical = false

    if (fps < fpsCritical || memory.percentage > memoryCritical) {
      isCritical = true
    } else if (fps < fpsWarning || memory.percentage > memoryWarning) {
      isWarning = true
    }

    // Trigger callbacks
    if (isCritical) {
      this.callbacks.onPerformanceCritical?.(this.metrics)
    } else if (isWarning) {
      this.callbacks.onPerformanceWarning?.(this.metrics)
    } else {
      // Check if we're recovering from poor performance
      if (fps > fpsWarning + 10 && memory.percentage < memoryWarning - 10) {
        this.callbacks.onPerformanceRecovery?.(this.metrics)
      }
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  setDrawCalls(count: number): void {
    this.metrics.drawCalls = count
  }

  setTriangles(count: number): void {
    this.metrics.triangles = count
  }

  setEntities(count: number): void {
    this.metrics.entities = count
  }

  startFrame(): void {
    // Frame start timing
  }

  endFrame(): void {
    this.update()
  }

  startUpdate(): void {
    // Update start timing
  }

  endUpdate(): void {
    // Update end timing
  }

  startEffects(): void {
    // Effects start timing
  }

  endEffects(): void {
    // Effects end timing
  }

  startRender(): void {
    // Render start timing
  }

  endRender(): void {
    // Render end timing
  }

  reset(): void {
    this.frameCount = 0
    this.frameTimes = []
    this.lastTime = performance.now()
  }
}