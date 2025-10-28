import * as THREE from 'three';

export class HitAnimation {
  private scene: THREE.Scene;
  private activeAnimations: Map<string, {
    type: 'screen_shake' | 'hit_flash' | 'slow_motion',
    startTime: number,
    duration: number,
    intensity: number,
    data?: any
  }> = new Map();
  private nextId: number = 0;
  
  // Screen shake properties
  private originalCameraPosition: THREE.Vector3 = new THREE.Vector3();
  private camera: THREE.PerspectiveCamera;
  
  // Hit flash properties
  private flashOverlay: HTMLDivElement | null = null;
  
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
    this.originalCameraPosition.copy(camera.position);
    
    // Create flash overlay
    this.createFlashOverlay();
  }
  
  private createFlashOverlay(): void {
    if (typeof document === 'undefined') return;
    
    this.flashOverlay = document.createElement('div');
    this.flashOverlay.style.position = 'fixed';
    this.flashOverlay.style.top = '0';
    this.flashOverlay.style.left = '0';
    this.flashOverlay.style.width = '100%';
    this.flashOverlay.style.height = '100%';
    this.flashOverlay.style.pointerEvents = 'none';
    this.flashOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0)';
    this.flashOverlay.style.zIndex = '9999';
    this.flashOverlay.style.transition = 'background-color 0.1s ease-out';
    
    document.body.appendChild(this.flashOverlay);
  }
  
  triggerScreenShake(intensity: number = 1.0, duration: number = 200): void {
    const id = `screen_shake_${this.nextId++}`;
    
    this.activeAnimations.set(id, {
      type: 'screen_shake',
      startTime: Date.now(),
      duration,
      intensity
    });
    
    this.animateScreenShake(id);
  }
  
  private animateScreenShake(id: string): void {
    const animation = this.activeAnimations.get(id);
    if (!animation) return;
    
    const startTime = animation.startTime;
    const duration = animation.duration;
    const intensity = animation.intensity;
    
    const shake = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        // Reset camera position
        this.camera.position.copy(this.originalCameraPosition);
        this.activeAnimations.delete(id);
        return;
      }
      
      // Calculate shake intensity (decreases over time)
      const currentIntensity = intensity * (1 - progress);
      
      // Apply random offset
      const offsetX = (Math.random() - 0.5) * currentIntensity * 0.1;
      const offsetY = (Math.random() - 0.5) * currentIntensity * 0.1;
      const offsetZ = (Math.random() - 0.5) * currentIntensity * 0.05;
      
      this.camera.position.set(
        this.originalCameraPosition.x + offsetX,
        this.originalCameraPosition.y + offsetY,
        this.originalCameraPosition.z + offsetZ
      );
      
      requestAnimationFrame(shake);
    };
    
    shake();
  }
  
  triggerHitFlash(color: string = '#ff4444', intensity: number = 1.0, duration: number = 100): void {
    if (!this.flashOverlay) return;
    
    const id = `hit_flash_${this.nextId++}`;
    
    this.activeAnimations.set(id, {
      type: 'hit_flash',
      startTime: Date.now(),
      duration,
      intensity,
      data: { color }
    });
    
    this.animateHitFlash(id);
  }
  
  private animateHitFlash(id: string): void {
    const animation = this.activeAnimations.get(id);
    if (!animation || !this.flashOverlay) return;
    
    const startTime = animation.startTime;
    const duration = animation.duration;
    const intensity = animation.intensity;
    const color = animation.data?.color || '#ff4444';
    
    // Convert hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    // Set initial flash
    this.flashOverlay.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${intensity * 0.3})`;
    
    // Fade out
    setTimeout(() => {
      this.flashOverlay!.style.backgroundColor = 'rgba(255, 255, 255, 0)';
    }, 50);
    
    // Clean up after duration
    setTimeout(() => {
      this.activeAnimations.delete(id);
    }, duration);
  }
  
  triggerSlowMotion(intensity: number = 0.5, duration: number = 500): void {
    const id = `slow_motion_${this.nextId++}`;
    
    this.activeAnimations.set(id, {
      type: 'slow_motion',
      startTime: Date.now(),
      duration,
      intensity
    });
    
    this.animateSlowMotion(id);
  }
  
  private animateSlowMotion(id: string): void {
    const animation = this.activeAnimations.get(id);
    if (!animation) return;
    
    const startTime = animation.startTime;
    const duration = animation.duration;
    const intensity = animation.intensity;
    
    // Store original time scale if it exists
    const originalTimeScale = (window as any).gameTimeScale || 1.0;
    
    // Apply slow motion
    (window as any).gameTimeScale = intensity;
    
    // Restore normal time after duration
    setTimeout(() => {
      (window as any).gameTimeScale = originalTimeScale;
      this.activeAnimations.delete(id);
    }, duration);
  }
  
  // Combined hit effect
  triggerHitEffect(hitType: 'normal' | 'headshot' | 'critical' = 'normal'): void {
    switch (hitType) {
      case 'headshot':
        this.triggerScreenShake(1.5, 300);
        this.triggerHitFlash('#ff4444', 0.8, 150);
        this.triggerSlowMotion(0.3, 200);
        break;
      case 'critical':
        this.triggerScreenShake(1.2, 250);
        this.triggerHitFlash('#ffaa00', 0.6, 120);
        this.triggerSlowMotion(0.5, 150);
        break;
      default:
        this.triggerScreenShake(0.8, 200);
        this.triggerHitFlash('#ffffff', 0.4, 100);
        break;
    }
  }
  
  updateCameraPosition(newPosition: THREE.Vector3): void {
    this.originalCameraPosition.copy(newPosition);
  }
  
  cleanup(): void {
    // Clean up flash overlay
    if (this.flashOverlay && this.flashOverlay.parentNode) {
      this.flashOverlay.parentNode.removeChild(this.flashOverlay);
      this.flashOverlay = null;
    }
    
    // Clear all animations
    this.activeAnimations.clear();
  }
}