// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

interface DamageIndicator {
  id: string;
  position: THREE.Vector3;
  damage: number;
  isHeadshot: boolean;
  isCritical: boolean;
  timestamp: number;
  color: string;
}

interface DamageDisplayProps {
  camera?: THREE.Camera;
  container?: HTMLDivElement;
}

export function DamageDisplay({ camera, container }: DamageDisplayProps) {
  const [damageIndicators, setDamageIndicators] = useState<DamageIndicator[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Add a new damage indicator
  const addDamageIndicator = (
    position: THREE.Vector3,
    damage: number,
    isHeadshot: boolean = false,
    isCritical: boolean = false
  ) => {
    const id = `damage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const color = isHeadshot ? '#ff4444' : isCritical ? '#ffaa00' : '#ffffff';
    
    const indicator: DamageIndicator = {
      id,
      position: position.clone(),
      damage,
      isHeadshot,
      isCritical,
      timestamp: Date.now(),
      color
    };
    
    setDamageIndicators(prev => [...prev, indicator]);
    
    // Remove indicator after 2 seconds
    setTimeout(() => {
      setDamageIndicators(prev => prev.filter(item => item.id !== id));
    }, 2000);
  };

  // Expose the function globally so other systems can call it
  useEffect(() => {
    (window as any).showDamageIndicator = addDamageIndicator;
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Animation loop to render damage indicators
  useEffect(() => {
    if (!camera || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update canvas size to match container
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }

      const now = Date.now();
      
      damageIndicators.forEach(indicator => {
        const elapsed = now - indicator.timestamp;
        const progress = Math.min(elapsed / 2000, 1); // 2 second animation
        
        // Project 3D position to 2D screen coordinates
        const vector = indicator.position.clone();
        vector.project(camera);
        
        const x = (vector.x * 0.5 + 0.5) * canvas.width;
        const y = (vector.y * -0.5 + 0.5) * canvas.height;
        
        // Check if the point is in front of the camera
        if (vector.z < 1) {
          // Calculate animation properties
          const opacity = 1 - progress;
          const offsetY = progress * 50; // Float upward
          const scale = 1 + progress * 0.5; // Scale up slightly
          
          // Save context state
          ctx.save();
          
          // Set up text properties
          ctx.font = `${indicator.isCritical ? 'bold ' : ''}${16 * scale}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = indicator.color;
          ctx.globalAlpha = opacity;
          
          // Add shadow for better visibility
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          // Draw damage number
          const damageText = indicator.isHeadshot ? `${indicator.damage} HS` : indicator.damage.toString();
          ctx.fillText(damageText, x, y - offsetY);

          // Draw headshot indicator
          if (indicator.isHeadshot) {
            ctx.font = '12px Arial';
            ctx.fillText('🎯', x, y - offsetY - 20);
          }
          
          // Draw critical hit indicator
          if (indicator.isCritical) {
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = '#ffaa00';
            ctx.fillText('!', x - 15, y - offsetY);
            ctx.fillText('!', x + 15, y - offsetY);
          }
          
          // Restore context state
          ctx.restore();
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [camera, container, damageIndicators]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1000 }}
    />
  );
}

// Global type declaration for the exposed function
declare global {
  interface Window {
    showDamageIndicator?: (
      position: THREE.Vector3,
      damage: number,
      isHeadshot?: boolean,
      isCritical?: boolean
    ) => void;
  }
}