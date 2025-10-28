import * as THREE from 'three';

export class BloodEffect {
  private particles: THREE.Group;
  private scene: THREE.Scene;
  private particlePool: THREE.Mesh[] = [];
  private activeParticles: Set<THREE.Mesh> = new Set();
  private maxParticles: number = 100;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particles = new THREE.Group();
    this.scene.add(this.particles);
    
    // Initialize particle pool
    this.initializeParticlePool();
  }
  
  private initializeParticlePool(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      const particle = this.createBloodParticle();
      particle.visible = false;
      this.particlePool.push(particle);
      this.particles.add(particle);
    }
  }
  
  private createBloodParticle(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.05, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: 0x8B0000, // Dark red
      transparent: true,
      opacity: 0.8
    });
    return new THREE.Mesh(geometry, material);
  }
  
  createBloodSplatter(position: THREE.Vector3, intensity: number = 1.0): void {
    const particleCount = Math.floor(10 + Math.random() * 20 * intensity);
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.getParticleFromPool();
      if (!particle) continue;
      
      particle.position.copy(position);
      particle.visible = true;
      (particle.material as THREE.MeshBasicMaterial).opacity = 0.8;
      
      // Random velocity for splatter effect
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      
      // Animate particle
      this.animateParticle(particle, velocity, intensity);
    }
  }
  
  private getParticleFromPool(): THREE.Mesh | null {
    for (const particle of this.particlePool) {
      if (!particle.visible) {
        this.activeParticles.add(particle);
        return particle;
      }
    }
    return null;
  }
  
  private animateParticle(particle: THREE.Mesh, velocity: THREE.Vector3, intensity: number): void {
    const startTime = Date.now();
    const duration = 1000 + Math.random() * 1000; // 1-2 seconds
    const gravity = -0.01;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        // Return particle to pool
        particle.visible = false;
        this.activeParticles.delete(particle);
        return;
      }
      
      // Update position
      particle.position.x += velocity.x;
      particle.position.y += velocity.y;
      particle.position.z += velocity.z;
      
      // Apply gravity
      velocity.y += gravity;
      
      // Fade out
      (particle.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - progress);
      
      // Scale down
      const scale = 1 - progress * 0.5;
      particle.scale.set(scale, scale, scale);
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  createBloodPool(position: THREE.Vector3, size: number = 1.0): void {
    const poolGeometry = new THREE.CircleGeometry(size * 0.3, 8);
    const poolMaterial = new THREE.MeshBasicMaterial({
      color: 0x8B0000,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    
    const pool = new THREE.Mesh(poolGeometry, poolMaterial);
    pool.position.copy(position);
    pool.rotation.x = -Math.PI / 2; // Lay flat on ground
    pool.position.y += 0.01; // Slightly above ground to prevent z-fighting
    
    this.particles.add(pool);
    
    // Fade out blood pool over time
    setTimeout(() => {
      this.fadeOutBloodPool(pool, 5000); // 5 seconds to fade
    }, 100);
  }
  
  private fadeOutBloodPool(pool: THREE.Mesh, duration: number): void {
    const startTime = Date.now();
    const startOpacity = (pool.material as THREE.MeshBasicMaterial).opacity;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        this.particles.remove(pool);
        return;
      }
      
      (pool.material as THREE.MeshBasicMaterial).opacity = startOpacity * (1 - progress);
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  cleanup(): void {
    // Clean up all particles
    this.particlePool.forEach(particle => {
      this.particles.remove(particle);
    });
    this.particlePool = [];
    this.activeParticles.clear();
    
    if (this.scene.children.includes(this.particles)) {
      this.scene.remove(this.particles);
    }
  }
}