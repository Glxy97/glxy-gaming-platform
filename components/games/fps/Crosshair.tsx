// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface CrosshairProps {
  className?: string;
  size?: number;
  color?: string;
  thickness?: number;
  gap?: number;
  dot?: boolean;
  circle?: boolean;
  dynamic?: boolean;
  isAiming?: boolean;
  isMoving?: boolean;
  accuracy?: number;
}

export const Crosshair: React.FC<CrosshairProps> = ({
  className,
  size = 20,
  color = 'white',
  thickness = 2,
  gap = 4,
  dot = true,
  circle = true,
  dynamic = true,
  isAiming = false,
  isMoving = false,
  accuracy = 1.0
}) => {
  const crosshairRef = useRef<HTMLDivElement>(null);
  const [currentSize, setCurrentSize] = useState(size);
  const [currentGap, setCurrentGap] = useState(gap);
  const [currentThickness, setCurrentThickness] = useState(thickness);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (!dynamic) return;

    // Dynamic crosshair behavior based on game state
    let targetSize = size;
    let targetGap = gap;
    let targetThickness = thickness;
    let targetOpacity = 1;

    if (isAiming) {
      targetSize = size * 0.6;
      targetGap = gap * 0.5;
      targetThickness = thickness * 1.5;
      targetOpacity = 0.8;
    } else if (isMoving) {
      targetSize = size * 1.3;
      targetGap = gap * 1.2;
      targetThickness = thickness * 0.8;
      targetOpacity = 0.9;
    }

    // Apply accuracy modifier
    const accuracyModifier = Math.max(0.5, Math.min(1.5, accuracy));
    targetSize *= accuracyModifier;
    targetGap *= accuracyModifier;

    // Smooth transitions
    const transitionDuration = 100; // ms
    const startTime = Date.now();
    const startSize = currentSize;
    const startGap = currentGap;
    const startThickness = currentThickness;
    const startOpacity = opacity;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / transitionDuration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      setCurrentSize(startSize + (targetSize - startSize) * easeProgress);
      setCurrentGap(startGap + (targetGap - startGap) * easeProgress);
      setCurrentThickness(startThickness + (targetThickness - startThickness) * easeProgress);
      setOpacity(startOpacity + (targetOpacity - startOpacity) * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [dynamic, isAiming, isMoving, accuracy, size, gap, thickness]);

  const crosshairStyle = {
    width: `${currentSize}px`,
    height: `${currentSize}px`,
    opacity,
    '--crosshair-color': color,
    '--crosshair-thickness': `${currentThickness}px`,
    '--crosshair-gap': `${currentGap}px`,
  } as React.CSSProperties;

  return (
    <div
      ref={crosshairRef}
      className={cn(
        'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50',
        'transition-all duration-100 ease-out',
        className
      )}
      style={crosshairStyle}
    >
      <svg
        width={currentSize}
        height={currentSize}
        viewBox={`0 0 ${currentSize} ${currentSize}`}
        className="drop-shadow-lg"
      >
        {/* Top line */}
        <line
          x1={currentSize / 2}
          y1="0"
          x2={currentSize / 2}
          y2={currentSize / 2 - currentGap}
          stroke={color}
          strokeWidth={currentThickness}
          strokeLinecap="round"
        />
        
        {/* Bottom line */}
        <line
          x1={currentSize / 2}
          y1={currentSize / 2 + currentGap}
          x2={currentSize / 2}
          y2={currentSize}
          stroke={color}
          strokeWidth={currentThickness}
          strokeLinecap="round"
        />
        
        {/* Left line */}
        <line
          x1="0"
          y1={currentSize / 2}
          x2={currentSize / 2 - currentGap}
          y2={currentSize / 2}
          stroke={color}
          strokeWidth={currentThickness}
          strokeLinecap="round"
        />
        
        {/* Right line */}
        <line
          x1={currentSize / 2 + currentGap}
          y1={currentSize / 2}
          x2={currentSize}
          y2={currentSize / 2}
          stroke={color}
          strokeWidth={currentThickness}
          strokeLinecap="round"
        />
        
        {/* Center dot */}
        {dot && (
          <circle
            cx={currentSize / 2}
            cy={currentSize / 2}
            r={currentThickness * 0.8}
            fill={color}
          />
        )}
        
        {/* Outer circle */}
        {circle && (
          <circle
            cx={currentSize / 2}
            cy={currentSize / 2}
            r={currentSize / 2 - currentGap}
            fill="none"
            stroke={color}
            strokeWidth={currentThickness * 0.5}
            opacity={0.5}
          />
        )}
      </svg>
    </div>
  );
};

// Preset crosshair styles
export const CrosshairPresets = {
  classic: (props: Omit<CrosshairProps, 'className'>) => (
    <Crosshair {...props} size={20} thickness={2} gap={4} dot={true} circle={false} />
  ),
  
  dot: (props: Omit<CrosshairProps, 'className'>) => (
    <Crosshair {...props} size={8} thickness={1} gap={0} dot={true} circle={false} />
  ),
  
  circle: (props: Omit<CrosshairProps, 'className'>) => (
    <Crosshair {...props} size={24} thickness={1} gap={6} dot={false} circle={true} />
  ),
  
  cross: (props: Omit<CrosshairProps, 'className'>) => (
    <Crosshair {...props} size={16} thickness={2} gap={2} dot={false} circle={false} />
  ),
  
  tactical: (props: Omit<CrosshairProps, 'className'>) => (
    <Crosshair {...props} size={18} thickness={1.5} gap={5} dot={true} circle={true} />
  ),
};