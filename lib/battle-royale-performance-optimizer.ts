// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  networkLatency: number;
  playersInScene: number;
  objectsInScene: number;
  drawCalls: number;
}

interface PerformanceConfig {
  targetFPS: number;
  maxObjects: number;
  lodDistance: number;
  cullingEnabled: boolean;
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
}

export class BattleRoyalePerformanceOptimizer {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private lastFrameTime: number;
  private frameCount: number;
  private fpsUpdateInterval: number;
  private lastFPSUpdate: number;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      targetFPS: 60,
      maxObjects: 1000,
      lodDistance: 100,
      cullingEnabled: true,
      qualityLevel: 'high',
      ...config,
    };

    this.metrics = {
      fps: 60,
      frameTime: 0,
      memoryUsage: 0,
      networkLatency: 0,
      playersInScene: 0,
      objectsInScene: 0,
      drawCalls: 0,
    };

    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fpsUpdateInterval = 1000; // Update FPS every second
    this.lastFPSUpdate = performance.now();
  }

  // Update performance metrics
  updateMetrics(): PerformanceMetrics {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this.frameCount++;

    // Update FPS every second
    if (now - this.lastFPSUpdate >= this.fpsUpdateInterval) {
      this.metrics.fps = this.frameCount;
      this.metrics.frameTime = deltaTime;
      this.frameCount = 0;
      this.lastFPSUpdate = now;

      // Auto-adjust quality based on performance
      this.autoAdjustQuality();
    }

    // Update memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    return this.metrics;
  }

  // Auto-adjust quality based on current performance
  private autoAdjustQuality(): void {
    if (this.metrics.fps < this.config.targetFPS * 0.8) {
      // Performance is poor, reduce quality
      this.reduceQuality();
    } else if (this.metrics.fps > this.config.targetFPS * 1.2 && this.config.qualityLevel !== 'ultra') {
      // Performance is good, can increase quality
      this.increaseQuality();
    }
  }

  private reduceQuality(): void {
    switch (this.config.qualityLevel) {
      case 'ultra':
        this.config.qualityLevel = 'high';
        this.config.lodDistance *= 0.8;
        break;
      case 'high':
        this.config.qualityLevel = 'medium';
        this.config.lodDistance *= 0.7;
        break;
      case 'medium':
        this.config.qualityLevel = 'low';
        this.config.lodDistance *= 0.6;
        break;
      case 'low':
        // Already at lowest quality
        break;
    }

    console.log(`Reduced quality to: ${this.config.qualityLevel}`);
  }

  private increaseQuality(): void {
    switch (this.config.qualityLevel) {
      case 'low':
        this.config.qualityLevel = 'medium';
        this.config.lodDistance *= 1.2;
        break;
      case 'medium':
        this.config.qualityLevel = 'high';
        this.config.lodDistance *= 1.3;
        break;
      case 'high':
        this.config.qualityLevel = 'ultra';
        this.config.lodDistance *= 1.25;
        break;
      case 'ultra':
        // Already at highest quality
        break;
    }

    console.log(`Increased quality to: ${this.config.qualityLevel}`);
  }

  // Calculate Level of Detail (LOD) based on distance
  calculateLOD(distance: number): number {
    if (distance < this.config.lodDistance * 0.3) {
      return 3; // High detail
    } else if (distance < this.config.lodDistance * 0.6) {
      return 2; // Medium detail
    } else if (distance < this.config.lodDistance) {
      return 1; // Low detail
    }
    return 0; // Cull (don't render)
  }

  // Frustum culling check
  isObjectVisible(objectPosition: { x: number; y: number; z: number }, cameraPosition: { x: number; y: number; z: number }, viewDistance: number): boolean {
    if (!this.config.cullingEnabled) {
      return true;
    }

    const distance = Math.sqrt(
      Math.pow(objectPosition.x - cameraPosition.x, 2) +
      Math.pow(objectPosition.y - cameraPosition.y, 2) +
      Math.pow(objectPosition.z - cameraPosition.z, 2)
    );

    return distance <= viewDistance;
  }

  // Object pooling for frequently created/destroyed objects
  private objectPools: Map<string, any[]> = new Map();

  getFromPool<T>(poolName: string, factory: () => T): T {
    const pool = this.objectPools.get(poolName) || [];
    if (pool.length > 0) {
      return pool.pop()!;
    }
    return factory();
  }

  returnToPool<T>(poolName: string, object: T): void {
    const pool = this.objectPools.get(poolName) || [];
    pool.push(object);
    this.objectPools.set(poolName, pool);

    // Limit pool size to prevent memory leaks
    const maxPoolSize = 100;
    if (pool.length > maxPoolSize) {
      pool.splice(0, pool.length - maxPoolSize);
    }
  }

  // Network optimization - batch updates
  private updateQueue: any[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  queueUpdate(update: any): void {
    this.updateQueue.push(update);

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.flushUpdateQueue();
    }, 16); // Batch updates every 16ms (60fps)
  }

  private flushUpdateQueue(): void {
    if (this.updateQueue.length === 0) {
      return;
    }

    // Batch similar updates together
    const batchedUpdates = this.batchUpdates(this.updateQueue);

    // Send batched updates
    this.sendBatchedUpdates(batchedUpdates);

    this.updateQueue = [];
    this.batchTimeout = null;
  }

  private batchUpdates(updates: any[]): any[] {
    // Group updates by type
    const grouped: { [key: string]: any[] } = {};

    updates.forEach(update => {
      const type = update.type || 'unknown';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(update);
    });

    // Create batched updates
    const batched: any[] = [];

    Object.entries(grouped).forEach(([type, typeUpdates]) => {
      switch (type) {
        case 'position':
          // Batch position updates
          batched.push({
            type: 'positions',
            data: typeUpdates.map(u => ({
              playerId: u.playerId,
              x: u.x,
              y: u.y,
              z: u.z,
              rotation: u.rotation,
            }))
          });
          break;

        case 'damage':
          // Batch damage updates
          batched.push({
            type: 'damages',
            data: typeUpdates.map(u => ({
              targetId: u.targetId,
              damage: u.damage,
              sourceId: u.sourceId,
            }))
          });
          break;

        default:
          // Keep other updates as-is
          batched.push(...typeUpdates);
      }
    });

    return batched;
  }

  private sendBatchedUpdates(batchedUpdates: any[]): void {
    // In a real implementation, this would send via Socket.IO
    console.log('Sending batched updates:', batchedUpdates);
  }

  // Memory management
  cleanup(): void {
    // Clear object pools
    this.objectPools.clear();

    // Clear any pending timeouts
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Clear update queue
    this.updateQueue = [];
  }

  // Getters
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  setQualityLevel(level: 'low' | 'medium' | 'high' | 'ultra'): void {
    this.config.qualityLevel = level;

    // Adjust LOD distance based on quality
    const lodMultipliers = {
      low: 0.5,
      medium: 0.75,
      high: 1.0,
      ultra: 1.5,
    };

    this.config.lodDistance = 100 * lodMultipliers[level];
  }

  // Static utility methods
  static calculateDistance(pos1: { x: number; y: number; z: number }, pos2: { x: number; y: number; z: number }): number {
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) +
      Math.pow(pos1.y - pos2.y, 2) +
      Math.pow(pos1.z - pos2.z, 2)
    );
  }

  static isPointInCircle(point: { x: number; z: number }, center: { x: number; z: number }, radius: number): boolean {
    const distance = Math.sqrt(
      Math.pow(point.x - center.x, 2) +
      Math.pow(point.z - center.z, 2)
    );
    return distance <= radius;
  }

  static optimizeArray<T>(array: T[], maxSize: number): T[] {
    if (array.length <= maxSize) {
      return array;
    }

    // Keep the most recent items
    return array.slice(-maxSize);
  }

  static debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  }

  static throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }
}

// Performance monitoring singleton
export const performanceOptimizer = new BattleRoyalePerformanceOptimizer();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(performanceOptimizer.getMetrics());
  const [config, setConfig] = useState<PerformanceConfig>(performanceOptimizer.getConfig());

  useEffect(() => {
    const interval = setInterval(() => {
      const newMetrics = performanceOptimizer.updateMetrics();
      setMetrics(newMetrics);
      setConfig(performanceOptimizer.getConfig());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    config,
    setQualityLevel: performanceOptimizer.setQualityLevel.bind(performanceOptimizer),
  };
}