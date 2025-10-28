// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface MinimapProps {
  playerPosition?: THREE.Vector3;
  isVisible?: boolean;
}

interface MinimapBlip {
  id: string;
  position: THREE.Vector3;
  type: 'player' | 'enemy' | 'teammate';
  color: string;
}

export const Minimap: React.FC<MinimapProps> = ({ 
  playerPosition = new THREE.Vector3(0, 0, 0), 
  isVisible = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blips, setBlips] = useState<MinimapBlip[]>([]);

  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = 150;
    canvas.width = size;
    canvas.height = size;

    // Animation loop
    const animate = () => {
      if (!isVisible) return;

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Draw background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, size, size);

      // Draw border
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, size, size);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const pos = (size / 4) * i;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, size);
        ctx.moveTo(0, pos);
        ctx.lineTo(size, pos);
        ctx.stroke();
      }

      // Draw player at center
      const centerX = size / 2;
      const centerY = size / 2;
      
      // Player triangle (pointing up)
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 8);
      ctx.lineTo(centerX - 6, centerY + 6);
      ctx.lineTo(centerX + 6, centerY + 6);
      ctx.closePath();
      ctx.fill();

      // Draw other blips
      blips.forEach(blip => {
        const relativeX = (blip.position.x - playerPosition.x) * 2 + centerX;
        const relativeZ = (blip.position.z - playerPosition.z) * 2 + centerY;

        // Only draw if within minimap bounds
        if (relativeX >= 0 && relativeX <= size && relativeZ >= 0 && relativeZ <= size) {
          ctx.fillStyle = blip.color;
          
          if (blip.type === 'enemy') {
            // Enemy square
            ctx.fillRect(relativeX - 4, relativeZ - 4, 8, 8);
          } else if (blip.type === 'teammate') {
            // Teammate circle
            ctx.beginPath();
            ctx.arc(relativeX, relativeZ, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Draw direction indicator (North arrow)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, 10);
      ctx.lineTo(centerX - 5, 20);
      ctx.moveTo(centerX, 10);
      ctx.lineTo(centerX + 5, 20);
      ctx.stroke();

      requestAnimationFrame(animate);
    };

    animate();

    // Simulate some enemy positions (in real implementation, this would come from game state)
    const updateBlips = () => {
      const time = Date.now() * 0.001; // Convert to seconds
      const newBlips: MinimapBlip[] = [
        {
          id: 'enemy1',
          position: new THREE.Vector3(
            playerPosition.x + Math.sin(time * 0.5) * 20, // Smooth circular movement
            0,
            playerPosition.z + Math.cos(time * 0.5) * 20
          ),
          type: 'enemy',
          color: '#ff0000'
        },
        {
          id: 'enemy2',
          position: new THREE.Vector3(
            playerPosition.x + Math.sin(time * 0.3 + Math.PI) * 15, // Different frequency and phase
            0,
            playerPosition.z + Math.cos(time * 0.3 + Math.PI) * 15
          ),
          type: 'enemy',
          color: '#ff0000'
        }
      ];
      setBlips(newBlips);
    };

    // Update blips every 100ms for smooth movement
    const blipInterval = setInterval(updateBlips, 100);
    updateBlips();

    return () => {
      clearInterval(blipInterval);
    };
  }, [playerPosition, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none z-10">
      <canvas
        ref={canvasRef}
        className="border border-gray-600 rounded-lg shadow-lg"
        style={{ width: '150px', height: '150px' }}
      />
    </div>
  );
};