// @ts-nocheck
/**
 * Network Optimization Layer
 * Optimiert Netzwerkkommunikation für Multiplayer-Spiele
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface NetworkMetrics {
  latency: number;
  bandwidth: number;
  packetLoss: number;
  jitter: number;
  lastUpdate: number;
}

export interface NetworkConfig {
  enableCompression: boolean;
  maxRetries: number;
  timeoutMs: number;
  keepAliveInterval: number;
  bufferSize: number;
}

interface NetworkPacket {
  id: string;
  type: 'data' | 'control' | 'heartbeat';
  payload: any;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  retries: number;
}

class NetworkOptimizationLayer {
  private config: NetworkConfig;
  private metrics: NetworkMetrics;
  private packetQueue: NetworkPacket[] = [];
  private sentPackets = new Map<string, NetworkPacket>();
  private listeners = new Set<(metrics: NetworkMetrics) => void>();
  private heartbeatInterval?: NodeJS.Timeout;
  private compressionWorker?: Worker;

  constructor(config: NetworkConfig) {
    this.config = config;
    this.metrics = {
      latency: 0,
      bandwidth: 1000, // kbps
      packetLoss: 0,
      jitter: 0,
      lastUpdate: Date.now()
    };

    this.initializeCompressionWorker();
    this.startHeartbeat();
  }

  // Kompressions-Worker initialisieren
  private initializeCompressionWorker() {
    if (typeof Worker !== 'undefined' && this.config.enableCompression) {
      try {
        const workerCode = `
          self.onmessage = function(e) {
            const { id, data, compress } = e.data;

            if (compress) {
              // Einfache Kompression simulieren
              const compressed = JSON.stringify(data).replace(/\s+/g, '');
              self.postMessage({ id, result: compressed, compressed: true });
            } else {
              // Dekompression simulieren
              const decompressed = JSON.parse(data);
              self.postMessage({ id, result: decompressed, compressed: false });
            }
          };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.compressionWorker = new Worker(URL.createObjectURL(blob));
      } catch (error) {
        console.warn('Failed to initialize compression worker:', error);
      }
    }
  }

  // Heartbeat starten
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.keepAliveInterval);
  }

  // Heartbeat senden
  private async sendHeartbeat() {
    const packet: NetworkPacket = {
      id: `heartbeat_${Date.now()}`,
      type: 'heartbeat',
      payload: { timestamp: Date.now() },
      timestamp: Date.now(),
      priority: 'low',
      retries: 0
    };

    try {
      const startTime = Date.now();
      await this.sendPacket(packet);
      const endTime = Date.now();

      // Metriken aktualisieren
      this.metrics.latency = endTime - startTime;
      this.metrics.lastUpdate = endTime;
      this.notifyListeners();
    } catch (error) {
      console.warn('Heartbeat failed:', error);
      this.metrics.packetLoss += 0.01;
      this.notifyListeners();
    }
  }

  // Paket senden
  async sendPacket(packet: NetworkPacket): Promise<void> {
    // Komprimieren falls aktiviert
    let payload = packet.payload;
    if (this.config.enableCompression && this.compressionWorker) {
      try {
        payload = await this.compressData(packet.payload);
      } catch (error) {
        console.warn('Compression failed:', error);
      }
    }

    // Simuliere Netzwerk-Overhead
    const networkLatency = this.metrics.latency + Math.random() * 10;
    await new Promise(resolve => setTimeout(resolve, networkLatency));

    // Simuliere Paketverlust
    if (Math.random() < this.metrics.packetLoss) {
      throw new Error('Packet lost');
    }

    // Paket als gesendet markieren
    this.sentPackets.set(packet.id, { ...packet, payload });
  }

  // Daten komprimieren
  private async compressData(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.compressionWorker) {
        resolve(data);
        return;
      }

      const id = `compress_${Date.now()}_${Math.random()}`;

      const handleMessage = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.compressionWorker!.removeEventListener('message', handleMessage);
          resolve(e.data.result);
        }
      };

      const handleError = (error: ErrorEvent) => {
        this.compressionWorker!.removeEventListener('error', handleError);
        reject(error.error);
      };

      this.compressionWorker.addEventListener('message', handleMessage);
      this.compressionWorker.addEventListener('error', handleError);

      this.compressionWorker.postMessage({
        id,
        data,
        compress: true
      });
    });
  }

  // Batch-Pakete senden
  async sendBatch(packets: NetworkPacket[]): Promise<void> {
    const batches = this.chunkArray(packets, this.config.bufferSize);

    for (const batch of batches) {
      await Promise.all(
        batch.map(packet => this.sendPacketWithRetry(packet))
      );
    }
  }

  // Paket mit Retry senden
  private async sendPacketWithRetry(packet: NetworkPacket): Promise<void> {
    let attempts = 0;

    while (attempts <= this.config.maxRetries) {
      try {
        await this.sendPacket(packet);
        return;
      } catch (error) {
        attempts++;
        packet.retries = attempts;

        if (attempts > this.config.maxRetries) {
          throw error;
        }

        // Exponential Backoff
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempts) * 100)
        );
      }
    }
  }

  // Array in Chunks aufteilen
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Netzwerk-Metriken abrufen
  getMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }

  // Listener für Metrik-Updates
  addListener(listener: (metrics: NetworkMetrics) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Listener benachrichtigen
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getMetrics()));
  }

  // Bandbreite testen
  async testBandwidth(): Promise<number> {
    const testData = new Array(1000).fill(0).map(() => Math.random());
    const startTime = Date.now();

    try {
      const packet: NetworkPacket = {
        id: `bandwidth_test_${Date.now()}`,
        type: 'data',
        payload: { data: testData },
        timestamp: Date.now(),
        priority: 'low',
        retries: 0
      };

      await this.sendPacket(packet);

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000; // seconds
      const dataSize = JSON.stringify(testData).length * 8; // bits

      const bandwidth = dataSize / duration / 1000; // kbps
      this.metrics.bandwidth = bandwidth;
      this.metrics.lastUpdate = endTime;

      this.notifyListeners();
      return bandwidth;
    } catch (error) {
      console.warn('Bandwidth test failed:', error);
      return this.metrics.bandwidth;
    }
  }

  // Aufräumen
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }

    this.listeners.clear();
    this.sentPackets.clear();
    this.packetQueue.length = 0;
  }
}

// React Hook
export function useNetworkOptimization(config: NetworkConfig) {
  const [metrics, setMetrics] = useState<NetworkMetrics>({
    latency: 0,
    bandwidth: 1000,
    packetLoss: 0,
    jitter: 0,
    lastUpdate: Date.now()
  });

  const layerRef = useRef<NetworkOptimizationLayer>();

  useEffect(() => {
    layerRef.current = new NetworkOptimizationLayer(config);

    const unsubscribe = layerRef.current.addListener(setMetrics);

    // Bandbreiten-Test beim Start
    layerRef.current.testBandwidth();

    return () => {
      unsubscribe();
      layerRef.current?.destroy();
    };
  }, []);

  const sendPacket = useCallback(async (packet: Omit<NetworkPacket, 'timestamp' | 'retries'>) => {
    if (!layerRef.current) {
      throw new Error('Network Optimization Layer not initialized');
    }

    const fullPacket: NetworkPacket = {
      ...packet,
      timestamp: Date.now(),
      retries: 0
    };

    return layerRef.current.sendPacket(fullPacket);
  }, []);

  const sendBatch = useCallback(async (packets: Omit<NetworkPacket, 'timestamp' | 'retries'>[]) => {
    if (!layerRef.current) {
      throw new Error('Network Optimization Layer not initialized');
    }

    const fullPackets: NetworkPacket[] = packets.map(packet => ({
      ...packet,
      timestamp: Date.now(),
      retries: 0
    }));

    return layerRef.current.sendBatch(fullPackets);
  }, []);

  const testBandwidth = useCallback(async () => {
    return layerRef.current?.testBandwidth() || 0;
  }, []);

  const getMetrics = useCallback(() => {
    return layerRef.current?.getMetrics() || metrics;
  }, [metrics]);

  return {
    metrics,
    sendPacket,
    sendBatch,
    testBandwidth,
    getMetrics
  };
}

export default NetworkOptimizationLayer;