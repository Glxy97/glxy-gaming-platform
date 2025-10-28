import * as THREE from 'three';

export class DamageIndicator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private indicators: Map<string, {
    mesh: THREE.Mesh,
    velocity: THREE.Vector3,
    lifeTime: number,
    maxLifeTime: number
  }> = new Map();
  private nextId: number = 0;
  
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
  }
  
  showDamage(damage: number, position: THREE.Vector3, isHeadshot: boolean = false, isCritical: boolean = false): void {
    const id = `damage_${this.nextId++}`;
    
    // Create text sprite for damage number
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set canvas size
    canvas.width = 256;
    canvas.height = 128;
    
    // Configure text style
    const fontSize = isHeadshot ? 48 : 36;
    const fontWeight = isCritical ? 'bold' : 'normal';
    context.font = `${fontWeight} ${fontSize}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Set text color based on damage type
    let textColor = '#ffffff';
    if (isHeadshot) {
      textColor = '#ff4444';
    } else if (isCritical) {
      textColor = '#ffaa00';
    } else if (damage > 50) {
      textColor = '#ff6666';
    } else if (damage > 25) {
      textColor = '#ffaa66';
    }
    
    // Add text shadow for better visibility
    context.shadowColor = 'rgba(0, 0, 0, 0.8)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    
    // Draw damage text
    context.fillStyle = textColor;
    const damageText = isHeadshot ? `HEADSHOT\n${damage}` : damage.toString();
    const lines = damageText.split('\n');
    const lineHeight = fontSize * 1.2;
    const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
    
    lines.forEach((line, index) => {
      context.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      opacity: 1.0
    });
    
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 1; // Start above the hit position
    
    // Scale based on damage importance
    const scale = isHeadshot ? 0.8 : (isCritical ? 0.6 : 0.4);
    sprite.scale.set(scale, scale * 0.5, 1);
    
    this.scene.add(sprite);
    
    // Store indicator data
    this.indicators.set(id, {
      mesh: sprite as any,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        0.03 + Math.random() * 0.02,
        (Math.random() - 0.5) * 0.02
      ),
      lifeTime: 0,
      maxLifeTime: isHeadshot ? 2000 : 1500 // Headshots last longer
    });
    
    // Start animation
    this.animateIndicator(id);
  }
  
  private animateIndicator(id: string): void {
    const indicator = this.indicators.get(id);
    if (!indicator) return;
    
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      indicator.lifeTime = elapsed;
      
      if (elapsed >= indicator.maxLifeTime) {
        // Remove indicator
        this.scene.remove(indicator.mesh);
        this.indicators.delete(id);
        return;
      }
      
      // Update position
      indicator.mesh.position.add(indicator.velocity);
      
      // Apply gravity
      indicator.velocity.y -= 0.0005;
      
      // Update opacity (fade out)
      const progress = elapsed / indicator.maxLifeTime;
      const material = indicator.mesh.material as THREE.SpriteMaterial;
      material.opacity = 1 - progress;
      
      // Update scale (slight growth)
      const scale = 1 + progress * 0.2;
      const baseScale = indicator.mesh.scale.x / scale;
      indicator.mesh.scale.set(baseScale * scale, baseScale * scale * 0.5, 1);
      
      // Make indicator face camera
      indicator.mesh.lookAt(this.camera.position);
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  showCrosshairDamage(damage: number, isHeadshot: boolean = false, isCritical: boolean = false): void {
    // Show damage indicator near crosshair (center of screen)
    const crosshairPosition = new THREE.Vector3(0, 0, -1);
    crosshairPosition.unproject(this.camera);
    
    // Position slightly in front of camera
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    const distance = 5; // 5 units in front of camera
    const position = this.camera.position.clone().add(direction.multiplyScalar(distance));
    
    this.showDamage(damage, position, isHeadshot, isCritical);
  }
  
  cleanup(): void {
    // Remove all indicators
    this.indicators.forEach((indicator, id) => {
      this.scene.remove(indicator.mesh);
    });
    this.indicators.clear();
  }
}