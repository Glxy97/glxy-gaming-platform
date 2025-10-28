/**
 * Loading States Management
 * Verwaltet Ladezustände für verschiedene Assets und Komponenten
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface AssetLoadingState {
  id: string;
  name: string;
  url?: string;
  type: 'model' | 'texture' | 'audio' | 'shader' | 'scene';
  progress: number;
  loaded: boolean;
  error?: string;
  startTime: number;
  endTime?: number;
  object?: THREE.Object3D | THREE.Texture | THREE.Material;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface LoadingManagerConfig {
  enableLogging: boolean;
  maxConcurrentLoads: number;
  timeoutMs: number;
  retryAttempts: number;
}

class LoadingStatesManager {
  private loadingStates = new Map<string, AssetLoadingState>();
  private listeners = new Set<(states: AssetLoadingState[]) => void>();
  private config: LoadingManagerConfig;
  private loadingPromises = new Map<string, Promise<any>>();
  private activeLoads = 0;

  constructor(config: LoadingManagerConfig) {
    this.config = config;
  }

  // Ladezustand erstellen oder aktualisieren
  createOrUpdateLoadingState(
    id: string,
    updates: Partial<AssetLoadingState>
  ): AssetLoadingState {
    const existing = this.loadingStates.get(id);

    const state: AssetLoadingState = existing || {
      id,
      name: updates.name || id,
      type: updates.type || 'model',
      progress: 0,
      loaded: false,
      startTime: Date.now(),
      priority: updates.priority || 'medium'
    };

    // Aktualisiere den State
    Object.assign(state, updates);

    this.loadingStates.set(id, state);
    this.notifyListeners();

    if (this.config.enableLogging) {
      console.log(`Loading State [${id}]:`, state.progress, state.loaded ? '✅' : '⏳');
    }

    return state;
  }

  // Asset laden
  async loadAsset(
    id: string,
    loader: () => Promise<THREE.Object3D | THREE.Texture | THREE.Material>,
    options?: Partial<AssetLoadingState>
  ): Promise<THREE.Object3D | THREE.Texture | THREE.Material> {
    // Prüfen ob bereits geladen
    const existing = this.loadingStates.get(id);
    if (existing?.loaded && existing.object) {
      return existing.object;
    }

    // Prüfen ob bereits am Laden
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!;
    }

    // Prüfen ob maximale gleichzeitige Ladeprozesse erreicht
    if (this.activeLoads >= this.config.maxConcurrentLoads) {
      await this.waitForSlot();
    }

    const state = this.createOrUpdateLoadingState(id, {
      ...options,
      loaded: false,
      error: undefined,
      progress: 0
    });

    const loadPromise = this.performLoad(id, loader, state);
    this.loadingPromises.set(id, loadPromise);

    try {
      this.activeLoads++;
      const result = await loadPromise;

      this.createOrUpdateLoadingState(id, {
        loaded: true,
        progress: 100,
        endTime: Date.now(),
        object: result,
        error: undefined
      });

      return result;
    } catch (error) {
      this.createOrUpdateLoadingState(id, {
        loaded: false,
        error: error instanceof Error ? error.message : 'Unknown loading error',
        endTime: Date.now()
      });
      throw error;
    } finally {
      this.activeLoads--;
      this.loadingPromises.delete(id);
    }
  }

  // Führt den eigentlichen Ladevorgang durch
  private async performLoad(
    id: string,
    loader: () => Promise<THREE.Object3D | THREE.Texture | THREE.Material>,
    state: AssetLoadingState
  ): Promise<THREE.Object3D | THREE.Texture | THREE.Material> {
    let attempt = 0;
    const maxAttempts = this.config.retryAttempts;

    while (attempt <= maxAttempts) {
      try {
        // Simuliere Fortschritt während des Ladens
        const progressInterval = setInterval(() => {
          const currentProgress = this.loadingStates.get(id)?.progress || 0;
          if (currentProgress < 90) {
            this.createOrUpdateLoadingState(id, {
              progress: Math.min(currentProgress + 10, 90)
            });
          }
        }, 100);

        const result = await Promise.race([
          loader(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Loading timeout')), this.config.timeoutMs)
          )
        ]);

        clearInterval(progressInterval);

        // Finalen Fortschritt setzen
        this.createOrUpdateLoadingState(id, { progress: 100 });

        return result;
      } catch (error) {
        attempt++;
        if (attempt > maxAttempts) {
          throw error;
        }

        // Warte vor dem Retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  // Warte auf einen freien Lade-Slot
  private async waitForSlot(): Promise<void> {
    return new Promise(resolve => {
      const checkSlot = () => {
        if (this.activeLoads < this.config.maxConcurrentLoads) {
          resolve();
        } else {
          setTimeout(checkSlot, 100);
        }
      };
      checkSlot();
    });
  }

  // Listener für State-Änderungen
  addListener(listener: (states: AssetLoadingState[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Listener benachrichtigen
  private notifyListeners(): void {
    const states = Array.from(this.loadingStates.values());
    this.listeners.forEach(listener => listener(states));
  }

  // Ladezustände abrufen
  getLoadingStates(): AssetLoadingState[] {
    return Array.from(this.loadingStates.values());
  }

  // Ladezustand abrufen
  getLoadingState(id: string): AssetLoadingState | undefined {
    return this.loadingStates.get(id);
  }

  // Ladezustand entfernen
  removeLoadingState(id: string): boolean {
    return this.loadingStates.delete(id);
  }

  // Alle Ladezustände leeren
  clear(): void {
    this.loadingStates.clear();
    this.loadingPromises.clear();
    this.activeLoads = 0;
    this.notifyListeners();
  }

  // Statistiken abrufen
  getStats(): {
    total: number;
    loaded: number;
    failed: number;
    loading: number;
    averageLoadTime: number;
  } {
    const states = this.getLoadingStates();
    const loaded = states.filter(s => s.loaded);
    const failed = states.filter(s => s.error);
    const loading = states.filter(s => !s.loaded && !s.error);

    const averageLoadTime = loaded.length > 0
      ? loaded.reduce((sum, state) => {
          const loadTime = (state.endTime || Date.now()) - state.startTime;
          return sum + loadTime;
        }, 0) / loaded.length
      : 0;

    return {
      total: states.length,
      loaded: loaded.length,
      failed: failed.length,
      loading: loading.length,
      averageLoadTime
    };
  }
}

// React Hook
export function useLoadingStatesManager(config: LoadingManagerConfig) {
  const [loadingStates, setLoadingStates] = useState<AssetLoadingState[]>([]);
  const managerRef = useRef<LoadingStatesManager>();

  useEffect(() => {
    managerRef.current = new LoadingStatesManager(config);

    const unsubscribe = managerRef.current.addListener(setLoadingStates);

    return () => {
      unsubscribe();
      managerRef.current?.clear();
    };
  }, []);

  const loadAsset = useCallback(async (
    id: string,
    loader: () => Promise<THREE.Object3D | THREE.Texture | THREE.Material>,
    options?: Partial<AssetLoadingState>
  ) => {
    if (!managerRef.current) {
      throw new Error('Loading States Manager not initialized');
    }
    return managerRef.current.loadAsset(id, loader, options);
  }, []);

  const updateLoadingState = useCallback((
    id: string,
    updates: Partial<AssetLoadingState>
  ) => {
    managerRef.current?.createOrUpdateLoadingState(id, updates);
  }, []);

  const getLoadingState = useCallback((id: string) => {
    return managerRef.current?.getLoadingState(id);
  }, []);

  const removeLoadingState = useCallback((id: string) => {
    return managerRef.current?.removeLoadingState(id);
  }, []);

  const clear = useCallback(() => {
    managerRef.current?.clear();
  }, []);

  const getStats = useCallback(() => {
    return managerRef.current?.getStats() || {
      total: 0,
      loaded: 0,
      failed: 0,
      loading: 0,
      averageLoadTime: 0
    };
  }, []);

  return {
    loadingStates,
    loadAsset,
    updateLoadingState,
    getLoadingState,
    removeLoadingState,
    clear,
    getStats
  };
}

export default LoadingStatesManager;