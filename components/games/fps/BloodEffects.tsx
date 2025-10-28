// @ts-nocheck
'use client';

import React, { useEffect, useRef } from 'react';

interface BloodEffectsProps {
  isVisible: boolean;
}

interface BloodParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  velocityX: number;
  velocityY: number;
}

export const BloodEffects: React.FC<BloodEffectsProps> = ({ isVisible }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<BloodParticle[]>([]);
  const animationRef = useRef<number | null>(null);
  const nextId = useRef(0);

  useEffect(() => {
    if (!isVisible) return;

    // Create blood particle
    const createBloodParticle = (x: number, y: number, intensity = 1): BloodParticle => {
      return {
        id: nextId.current++,
        x,
        y,
        size: 2 + Math.random() * 4 * intensity,
        opacity: 0.8,
        life: 0,
        maxLife: 30 + Math.random() * 30, // 0.5-1 second at 60fps
        velocityX: (Math.random() - 0.5) * 4 * intensity,
        velocityY: (Math.random() - 0.5) * 4 * intensity
      };
    };

    // Handle blood splatter event
    const handleBloodSplatter = (event: CustomEvent) => {
      if (!containerRef.current) return;
      
      const { intensity = 1 } = event.detail;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const particleCount = Math.floor(5 + Math.random() * 10 * intensity);
      
      for (let i = 0; i < particleCount; i++) {
        const particle = createBloodParticle(
          centerX + (Math.random() - 0.5) * 100,
          centerY + (Math.random() - 0.5) * 100,
          intensity
        );
        particlesRef.current.push(particle);
      }
    };

    // Animation loop
    const animate = () => {
      if (!containerRef.current) return;
      
      // Update particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.life++;
        
        // Update position
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        
        // Apply gravity
        particle.velocityY += 0.2;
        
        // Fade out
        particle.opacity = 0.8 * (1 - particle.life / particle.maxLife);
        
        // Scale down
        const scale = 1 - (particle.life / particle.maxLife) * 0.5;
        
        // Remove dead particles
        return particle.life < particle.maxLife;
      });
      
      // Render particles
      renderParticles();
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Render particles to DOM
    const renderParticles = () => {
      if (!containerRef.current) return;
      
      // Clear existing particles
      const existingParticles = containerRef.current.querySelectorAll('.blood-particle');
      existingParticles.forEach(p => p.remove());
      
      // Add current particles
      particlesRef.current.forEach(particle => {
        const element = document.createElement('div');
        element.className = 'blood-particle absolute rounded-full pointer-events-none';
        element.style.left = `${particle.x}px`;
        element.style.top = `${particle.y}px`;
        element.style.width = `${particle.size}px`;
        element.style.height = `${particle.size}px`;
        element.style.backgroundColor = '#8B0000';
        element.style.opacity = particle.opacity.toString();
        element.style.transform = `scale(${1 - (particle.life / particle.maxLife) * 0.5})`;
        element.style.transition = 'all 0.1s ease-out';
        
        containerRef.current?.appendChild(element);
      });
    };

    // Start animation
    animate();

    // Add event listener
    window.addEventListener('bloodSplatter', handleBloodSplatter as EventListener);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Cleanup particles
      if (containerRef.current) {
        const existingParticles = containerRef.current.querySelectorAll('.blood-particle');
        existingParticles.forEach(p => p.remove());
      }
      
      particlesRef.current = [];
      
      window.removeEventListener('bloodSplatter', handleBloodSplatter as EventListener);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 10 }}
    />
  );
};