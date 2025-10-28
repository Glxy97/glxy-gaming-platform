/**
 * Performance Monitoring Dashboard (New)
 * Moderne Performance-Überwachung für Gaming-Anwendungen
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  renderTime: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  timestamp: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  metric: keyof PerformanceMetrics;
  threshold: number;
  currentValue: number;
  timestamp: number;
  resolved: boolean;
}

export interface PerformanceConfig {
  updateInterval: number;
  alertThresholds: {
    minFPS: number;
    maxFrameTime: number;
    maxMemoryUsage: number;
    maxRenderTime: number;
  };
  enableHistory: boolean;
  historySize: number;
}

class PerformanceMonitoringDashboard {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private history: PerformanceMetrics[] = [];
  private alerts = new Map<string, PerformanceAlert>();
  private listeners = new Set<(metrics: PerformanceMetrics) => void>();
  private alertListeners = new Set<(alerts: PerformanceAlert[]) => void>();
  private monitoringInterval?: NodeJS.Timeout;
  private lastFrameTime = 0;
  private frameCount = 0;

  constructor(config: PerformanceConfig) {
    this.config = config;
    this.metrics = this.getInitialMetrics();
    this.initializeMonitoring();
  }

  private getInitialMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      frameTime: 0,
      memoryUsage: {
        used: 0,
        total: 0,
        percentage: 0
      },
      renderTime: 0,
      drawCalls: 0,
      triangles: 0,
      textures: 0,
      timestamp: Date.now()
    };
  }

  // Monitoring initialisieren
  private initializeMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
    }, this.config.updateInterval);
  }

  // Metriken aktualisieren
  private updateMetrics() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // FPS berechnen
    this.frameCount++;
    if (deltaTime > 0) {
      this.metrics.fps = Math.round(1000 / deltaTime);
      this.metrics.frameTime = deltaTime;
    }

    // Speicherverbrauch aktualisieren
    this.updateMemoryUsage();

    // WebGL-Metriken (falls verfügbar)
    this.updateWebGLMetrics();

    // Zeitstempel aktualisieren
    this.metrics.timestamp = Date.now();

    // History speichern
    if (this.config.enableHistory) {
      this.addToHistory(this.metrics);
    }

    // Alerts prüfen
    this.checkAlerts();

    // Listener benachrichtigen
    this.notifyListeners();
  }

  // Speicherverbrauch aktualisieren
  private updateMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      };
    }
  }

  // WebGL-Metriken aktualisieren
  private updateWebGLMetrics() {
    // Simulierte WebGL-Metriken
    this.metrics.renderTime = Math.random() * 16; // ms
    this.metrics.drawCalls = Math.floor(Math.random() * 1000);
    this.metrics.triangles = Math.floor(Math.random() * 100000);
    this.metrics.textures = Math.floor(Math.random() * 100);
  }

  // Zur History hinzufügen
  private addToHistory(metrics: PerformanceMetrics) {
    this.history.push(metrics);

    // History size begrenzen
    if (this.history.length > this.config.historySize) {
      this.history.shift();
    }
  }

  // Alerts prüfen
  private checkAlerts() {
    const { alertThresholds } = this.config;

    // FPS Alert
    if (this.metrics.fps < alertThresholds.minFPS) {
      this.createAlert({
        type: 'warning',
        message: `Low FPS detected: ${this.metrics.fps}`,
        metric: 'fps',
        threshold: alertThresholds.minFPS,
        currentValue: this.metrics.fps
      });
    }

    // Frame Time Alert
    if (this.metrics.frameTime > alertThresholds.maxFrameTime) {
      this.createAlert({
        type: 'warning',
        message: `High frame time: ${this.metrics.frameTime.toFixed(2)}ms`,
        metric: 'frameTime',
        threshold: alertThresholds.maxFrameTime,
        currentValue: this.metrics.frameTime
      });
    }

    // Memory Alert
    if (this.metrics.memoryUsage.percentage > alertThresholds.maxMemoryUsage) {
      this.createAlert({
        type: 'error',
        message: `High memory usage: ${this.metrics.memoryUsage.percentage}%`,
        metric: 'memoryUsage',
        threshold: alertThresholds.maxMemoryUsage,
        currentValue: this.metrics.memoryUsage.percentage
      });
    }

    // Render Time Alert
    if (this.metrics.renderTime > alertThresholds.maxRenderTime) {
      this.createAlert({
        type: 'warning',
        message: `High render time: ${this.metrics.renderTime.toFixed(2)}ms`,
        metric: 'renderTime',
        threshold: alertThresholds.maxRenderTime,
        currentValue: this.metrics.renderTime
      });
    }
  }

  // Alert erstellen
  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>) {
    const id = `alert_${Date.now()}_${Math.random()}`;
    const alert: PerformanceAlert = {
      id,
      ...alertData,
      timestamp: Date.now(),
      resolved: false
    };

    this.alerts.set(id, alert);
    this.notifyAlertListeners();
  }

  // Alert auflösen
  resolveAlert(alertId: string) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.notifyAlertListeners();
    }
  }

  // Alle Alerts auflösen
  resolveAllAlerts() {
    this.alerts.forEach(alert => {
      alert.resolved = true;
    });
    this.notifyAlertListeners();
  }

  // Listener für Metriken
  addListener(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Listener für Alerts
  addAlertListener(listener: (alerts: PerformanceAlert[]) => void): () => void {
    this.alertListeners.add(listener);
    return () => this.alertListeners.delete(listener);
  }

  // Listener benachrichtigen
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getMetrics()));
  }

  private notifyAlertListeners() {
    this.alertListeners.forEach(listener => listener(this.getAlerts()));
  }

  // Aktuelle Metriken abrufen
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // History abrufen
  getHistory(): PerformanceMetrics[] {
    return [...this.history];
  }

  // Alerts abrufen
  getAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values());
  }

  // Aktive Alerts abrufen
  getActiveAlerts(): PerformanceAlert[] {
    return this.getAlerts().filter(alert => !alert.resolved);
  }

  // Durchschnittswerte berechnen
  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.history.length === 0) return {};

    const sum = this.history.reduce((acc, metrics) => {
      acc.fps += metrics.fps;
      acc.frameTime += metrics.frameTime;
      acc.renderTime += metrics.renderTime;
      acc.drawCalls += metrics.drawCalls;
      acc.triangles += metrics.triangles;
      acc.textures += metrics.textures;
      acc.memoryUsage.used += metrics.memoryUsage.used;
      acc.memoryUsage.percentage += metrics.memoryUsage.percentage;
      return acc;
    }, {
      fps: 0,
      frameTime: 0,
      renderTime: 0,
      drawCalls: 0,
      triangles: 0,
      textures: 0,
      memoryUsage: { used: 0, total: 0, percentage: 0 }
    });

    const count = this.history.length;

    return {
      fps: Math.round(sum.fps / count),
      frameTime: sum.frameTime / count,
      renderTime: sum.renderTime / count,
      drawCalls: Math.round(sum.drawCalls / count),
      triangles: Math.round(sum.triangles / count),
      textures: Math.round(sum.textures / count),
      memoryUsage: {
        used: Math.round(sum.memoryUsage.used / count),
        total: 0,
        percentage: Math.round(sum.memoryUsage.percentage / count)
      }
    };
  }

  // Konfiguration aktualisieren
  updateConfig(newConfig: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...newConfig };

    // Monitoring neustarten bei Intervall-Änderung
    if (newConfig.updateInterval) {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }
      this.initializeMonitoring();
    }
  }

  // Aufräumen
  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.listeners.clear();
    this.alertListeners.clear();
    this.alerts.clear();
    this.history.length = 0;
  }
}

// React Hook
export function usePerformanceMonitoring(config: PerformanceConfig) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => ({
    fps: 0,
    frameTime: 0,
    memoryUsage: { used: 0, total: 0, percentage: 0 },
    renderTime: 0,
    drawCalls: 0,
    triangles: 0,
    textures: 0,
    timestamp: Date.now()
  }));

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);

  const dashboardRef = useRef<PerformanceMonitoringDashboard>();

  useEffect(() => {
    dashboardRef.current = new PerformanceMonitoringDashboard(config);

    const unsubscribeMetrics = dashboardRef.current.addListener(setMetrics);
    const unsubscribeAlerts = dashboardRef.current.addAlertListener(setAlerts);

    // History regelmäßig aktualisieren
    const historyInterval = setInterval(() => {
      if (dashboardRef.current) {
        setHistory(dashboardRef.current.getHistory());
      }
    }, 1000);

    return () => {
      unsubscribeMetrics();
      unsubscribeAlerts();
      clearInterval(historyInterval);
      dashboardRef.current?.destroy();
    };
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    dashboardRef.current?.resolveAlert(alertId);
  }, []);

  const resolveAllAlerts = useCallback(() => {
    dashboardRef.current?.resolveAllAlerts();
  }, []);

  const getAverageMetrics = useCallback(() => {
    return dashboardRef.current?.getAverageMetrics() || {};
  }, []);

  const updateConfig = useCallback((newConfig: Partial<PerformanceConfig>) => {
    dashboardRef.current?.updateConfig(newConfig);
  }, []);

  return {
    metrics,
    alerts,
    history,
    activeAlerts: alerts.filter(alert => !alert.resolved),
    resolveAlert,
    resolveAllAlerts,
    getAverageMetrics,
    updateConfig
  };
}

export default PerformanceMonitoringDashboard;