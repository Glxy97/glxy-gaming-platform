/**
 * Service Worker Manager
 * Verwaltet Service Worker für Caching und Offline-Funktionalität
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ServiceWorkerConfig {
  enableCaching: boolean;
  cacheName: string;
  cacheVersion: string;
  precacheAssets: string[];
  networkTimeout: number;
  retryAttempts: number;
}

export interface CacheStatus {
  enabled: boolean;
  cachedAssets: number;
  cacheSize: number; // in MB
  lastUpdate: number;
  isOnline: boolean;
}

class ServiceWorkerManager {
  private config: ServiceWorkerConfig;
  private registration: ServiceWorkerRegistration | null = null;
  private cacheStatus: CacheStatus;
  private listeners = new Set<(status: CacheStatus) => void>();

  constructor(config: ServiceWorkerConfig) {
    this.config = config;
    this.cacheStatus = {
      enabled: false,
      cachedAssets: 0,
      cacheSize: 0,
      lastUpdate: Date.now(),
      isOnline: navigator.onLine
    };

    this.initialize();
  }

  // Service Worker initialisieren
  private async initialize() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', this.registration);

        // Auf Updates warten
        this.registration.addEventListener('updatefound', () => {
          this.handleServiceWorkerUpdate();
        });

        // Online/Offline Status überwachen
        window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
        window.addEventListener('offline', this.handleOnlineStatusChange.bind(this));

        await this.setupCaching();
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    } else {
      console.warn('Service Worker not supported');
    }
  }

  // Caching einrichten
  private async setupCaching() {
    if (!this.config.enableCaching || !this.registration) return;

    try {
      const cache = await caches.open(this.config.cacheName);

      // Assets precachen
      if (this.config.precacheAssets.length > 0) {
        await cache.addAll(this.config.precacheAssets);
        console.log('Precached assets:', this.config.precacheAssets);
      }

      // Cache-Status aktualisieren
      await this.updateCacheStatus();

      this.cacheStatus.enabled = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Cache setup failed:', error);
    }
  }

  // Cache-Status aktualisieren
  private async updateCacheStatus() {
    try {
      const cache = await caches.open(this.config.cacheName);
      const keys = await cache.keys();

      let totalSize = 0;
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }

      this.cacheStatus = {
        ...this.cacheStatus,
        cachedAssets: keys.length,
        cacheSize: Math.round(totalSize / 1024 / 1024 * 100) / 100, // MB
        lastUpdate: Date.now()
      };
    } catch (error) {
      console.error('Failed to update cache status:', error);
    }
  }

  // Service Worker Update behandeln
  private handleServiceWorkerUpdate() {
    if (!this.registration) return;

    const newWorker = this.registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // Neuer Service Worker ist verfügbar
        console.log('New Service Worker available');
        this.notifyListeners();
      }
    });
  }

  // Online/Offline Status-Änderung behandeln
  private handleOnlineStatusChange() {
    this.cacheStatus.isOnline = navigator.onLine;
    this.notifyListeners();
  }

  // Netzwerk-Anfrage mit Fallback zu Cache
  async fetchWithFallback(request: Request): Promise<Response> {
    try {
      // Zuerst versuchen, vom Netzwerk zu laden
      const networkResponse = await this.fetchWithTimeout(request);

      // Erfolgreiche Antwort cachen
      if (this.config.enableCaching && networkResponse.ok) {
        const cache = await caches.open(this.config.cacheName);
        cache.put(request, networkResponse.clone());
      }

      return networkResponse;
    } catch (error) {
      console.warn('Network request failed, trying cache:', error);

      // Fallback zu Cache
      if (this.config.enableCaching) {
        const cache = await caches.open(this.config.cacheName);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }
      }

      throw error;
    }
  }

  // Netzwerk-Anfrage mit Timeout
  private async fetchWithTimeout(request: Request, attempt = 1): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.networkTimeout);

    try {
      const response = await fetch(request, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry bei Fehler
      if (attempt < this.config.retryAttempts && error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TypeError') {
          console.log(`Retrying request (attempt ${attempt + 1}/${this.config.retryAttempts}):`, request.url);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          return this.fetchWithTimeout(request, attempt + 1);
        }
      }

      throw error;
    }
  }

  // Cache leeren
  async clearCache(): Promise<void> {
    try {
      await caches.delete(this.config.cacheName);
      await this.updateCacheStatus();
      this.notifyListeners();
      console.log('Cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Assets precachen
  async precacheAssets(assets: string[]): Promise<void> {
    if (!this.config.enableCaching) return;

    try {
      const cache = await caches.open(this.config.cacheName);
      await cache.addAll(assets);
      await this.updateCacheStatus();
      this.notifyListeners();
      console.log('Precached additional assets:', assets);
    } catch (error) {
      console.error('Failed to precache assets:', error);
    }
  }

  // Service Worker aktivieren
  async activateServiceWorker(): Promise<void> {
    if (!this.registration) return;

    try {
      // Warten, bis der neue Service Worker aktiv ist
      await this.registration.update();

      const newWorker = this.registration.waiting;
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        console.log('Service Worker activated');
      }
    } catch (error) {
      console.error('Failed to activate Service Worker:', error);
    }
  }

  // Listener für Status-Änderungen
  addListener(listener: (status: CacheStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getCacheStatus()));
  }

  // Getter-Methoden
  getCacheStatus(): CacheStatus {
    return { ...this.cacheStatus };
  }

  isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  isCacheEnabled(): boolean {
    return this.cacheStatus.enabled;
  }

  isOnline(): boolean {
    return this.cacheStatus.isOnline;
  }

  // Aufräumen
  destroy() {
    window.removeEventListener('online', this.handleOnlineStatusChange);
    window.removeEventListener('offline', this.handleOnlineStatusChange);
    this.listeners.clear();
  }
}

// React Hook
export function useServiceWorkerManager(config: ServiceWorkerConfig) {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    enabled: false,
    cachedAssets: 0,
    cacheSize: 0,
    lastUpdate: Date.now(),
    isOnline: navigator.onLine
  });

  const managerRef = useRef<ServiceWorkerManager>();

  useEffect(() => {
    managerRef.current = new ServiceWorkerManager(config);

    const unsubscribe = managerRef.current.addListener(setCacheStatus);

    return () => {
      unsubscribe();
      managerRef.current?.destroy();
    };
  }, []);

  const fetchWithFallback = useCallback(async (request: Request | string): Promise<Response> => {
    if (!managerRef.current) {
      throw new Error('Service Worker Manager not initialized');
    }

    const requestObj = typeof request === 'string' ? new Request(request) : request;
    return managerRef.current.fetchWithFallback(requestObj);
  }, []);

  const clearCache = useCallback(async () => {
    await managerRef.current?.clearCache();
  }, []);

  const precacheAssets = useCallback(async (assets: string[]) => {
    await managerRef.current?.precacheAssets(assets);
  }, []);

  const activateServiceWorker = useCallback(async () => {
    await managerRef.current?.activateServiceWorker();
  }, []);

  const isServiceWorkerSupported = useCallback(() => {
    return managerRef.current?.isServiceWorkerSupported() || false;
  }, []);

  const isCacheEnabled = useCallback(() => {
    return managerRef.current?.isCacheEnabled() || false;
  }, []);

  const isOnline = useCallback(() => {
    return managerRef.current?.isOnline() || navigator.onLine;
  }, []);

  return {
    cacheStatus,
    fetchWithFallback,
    clearCache,
    precacheAssets,
    activateServiceWorker,
    isServiceWorkerSupported,
    isCacheEnabled,
    isOnline
  };
}

export default ServiceWorkerManager;