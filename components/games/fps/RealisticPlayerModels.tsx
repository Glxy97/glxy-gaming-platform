// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RealisticMilitaryOperator, MilitaryOperatorFactory, OperatorConfig } from '@/lib/realistic-military-models';

interface RealisticPlayerModelsProps {
  scene: THREE.Scene;
  onModelLoad?: (operator: RealisticMilitaryOperator) => void;
  initialClass?: OperatorConfig['class'];
  team?: 'alpha' | 'bravo';
  position?: THREE.Vector3;
  isLocalPlayer?: boolean;
  showWeapon?: boolean;
  animationState?: 'idle' | 'running' | 'shooting' | 'reloading' | 'crouching';
}

export const RealisticPlayerModels: React.FC<RealisticPlayerModelsProps> = ({
  scene,
  onModelLoad,
  initialClass = 'assault',
  team = 'alpha',
  position = new THREE.Vector3(0, 0, 0),
  isLocalPlayer = false,
  showWeapon = true,
  animationState = 'idle'
}) => {
  const operatorRef = useRef<RealisticMilitaryOperator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAnimation, setCurrentAnimation] = useState(animationState);

  useEffect(() => {
    if (!scene) return;

    setIsLoading(true);

    // Create the military operator
    const operator = MilitaryOperatorFactory.createOperator(
      initialClass,
      team,
      'operator',
      1.8
    );

    // Set initial position
    operator.group.position.copy(position);

    // Configure for local player or remote player
    if (isLocalPlayer) {
      // For local player, we might want different settings
      operator.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = false; // Local player typically doesn't receive shadows
        }
      });
    } else {
      // For remote players
      operator.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }

    // Add to scene
    scene.add(operator.group);
    operatorRef.current = operator;

    // Notify parent component
    if (onModelLoad) {
      onModelLoad(operator);
    }

    setIsLoading(false);

    // Cleanup
    return () => {
      if (operatorRef.current) {
        scene.remove(operatorRef.current.group);
        operatorRef.current.dispose();
        operatorRef.current = null;
      }
    };
  }, [scene, initialClass, team, position, isLocalPlayer, onModelLoad]);

  // Animation updates
  useEffect(() => {
    if (!operatorRef.current) return;

    const operator = operatorRef.current;

    // Update animations based on state
    switch (currentAnimation) {
      case 'idle':
        // Breathing animation
        const breathAnimation = () => {
          const breathAmount = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
          operator.setBlendShape('breath', breathAmount * 0.3);
        };
        const breathInterval = setInterval(breathAnimation, 50);
        return () => clearInterval(breathInterval);

      case 'running':
        // Running animation would require more complex skeletal animation
        // For now, we'll just adjust the breathing
        operator.setBlendShape('breath', 0.8);
        break;

      case 'shooting':
        // Recoil animation
        operator.group.rotation.x = -0.1;
        setTimeout(() => {
          if (operator.group) {
            operator.group.rotation.x = 0;
          }
        }, 100);
        break;

      case 'reloading':
        // Reloading animation
        operator.group.rotation.z = 0.2;
        setTimeout(() => {
          if (operator.group) {
            operator.group.rotation.z = 0;
          }
        }, 1000);
        break;

      case 'crouching':
        // Crouching pose
        operator.group.scale.y = 0.7;
        break;
    }

    return () => {}; // Default cleanup for other cases
  }, [currentAnimation]);

  // Update position
  useEffect(() => {
    if (operatorRef.current) {
      operatorRef.current.group.position.copy(position);
    }
  }, [position]);

  // Update weapon visibility
  useEffect(() => {
    if (operatorRef.current && operatorRef.current.equipment.weapon) {
      operatorRef.current.equipment.weapon.visible = showWeapon;
    }
  }, [showWeapon]);

  // Public methods for parent component
  const updateAnimation = (newState: typeof animationState) => {
    setCurrentAnimation(newState);
  };

  const updatePosition = (newPosition: THREE.Vector3) => {
    if (operatorRef.current) {
      operatorRef.current.group.position.copy(newPosition);
    }
  };

  const updateRotation = (rotation: THREE.Euler) => {
    if (operatorRef.current) {
      operatorRef.current.group.rotation.copy(rotation);
    }
  };

  const playFacialExpression = (expression: 'neutral' | 'angry' | 'focused' | 'hurt') => {
    if (!operatorRef.current) return;

    switch (expression) {
      case 'neutral':
        operatorRef.current.setBlendShape('frown', 0);
        operatorRef.current.setBlendShape('smile', 0);
        break;
      case 'angry':
        operatorRef.current.setBlendShape('frown', 0.8);
        operatorRef.current.setBlendShape('jawOpen', 0.2);
        break;
      case 'focused':
        operatorRef.current.setBlendShape('frown', 0.3);
        break;
      case 'hurt':
        operatorRef.current.setBlendShape('frown', 1);
        operatorRef.current.setBlendShape('jawOpen', 0.5);
        break;
    }
  };

  const blink = () => {
    if (!operatorRef.current) return;

    operatorRef.current.setBlendShape('blinkLeft', 1);
    operatorRef.current.setBlendShape('blinkRight', 1);

    setTimeout(() => {
      operatorRef.current?.setBlendShape('blinkLeft', 0);
      operatorRef.current?.setBlendShape('blinkRight', 0);
    }, 150);
  };

  // Random blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (Math.random() < 0.1) {
        blink();
      }
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-white text-sm">Loading military model...</div>
      </div>
    );
  }

  // This component doesn't render anything directly
  // It manages the 3D model in the Three.js scene
  return null;
};

// Hook for using realistic player models
export const useRealisticPlayerModel = (
  scene: THREE.Scene,
  config: {
    class: OperatorConfig['class'];
    team: 'alpha' | 'bravo';
    position: THREE.Vector3;
    isLocalPlayer?: boolean;
  }
) => {
  const [operator, setOperator] = useState<RealisticMilitaryOperator | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!scene) return;

    const militaryOperator = MilitaryOperatorFactory.createOperator(
      config.class,
      config.team,
      'operator',
      1.8
    );

    militaryOperator.group.position.copy(config.position);

    // Configure shadows
    militaryOperator.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = !config.isLocalPlayer;
      }
    });

    scene.add(militaryOperator.group);
    setOperator(militaryOperator);
    setIsLoaded(true);

    return () => {
      scene.remove(militaryOperator.group);
      militaryOperator.dispose();
    };
  }, [scene, config.class, config.team, config.position, config.isLocalPlayer]);

  const updatePosition = (position: THREE.Vector3) => {
    if (operator) {
      operator.group.position.copy(position);
    }
  };

  const updateRotation = (rotation: THREE.Euler) => {
    if (operator) {
      operator.group.rotation.copy(rotation);
    }
  };

  const playAnimation = (animation: string) => {
    if (operator) {
      operator.playAnimation(animation);
    }
  };

  const setFacialExpression = (expression: 'neutral' | 'angry' | 'focused' | 'hurt') => {
    if (!operator) return;

    switch (expression) {
      case 'neutral':
        operator.setBlendShape('frown', 0);
        operator.setBlendShape('smile', 0);
        break;
      case 'angry':
        operator.setBlendShape('frown', 0.8);
        operator.setBlendShape('jawOpen', 0.2);
        break;
      case 'focused':
        operator.setBlendShape('frown', 0.3);
        break;
      case 'hurt':
        operator.setBlendShape('frown', 1);
        operator.setBlendShape('jawOpen', 0.5);
        break;
    }
  };

  return {
    operator,
    isLoaded,
    updatePosition,
    updateRotation,
    playAnimation,
    setFacialExpression
  };
};

// Factory for creating complete player squads
export class PlayerSquadManager {
  private scene: THREE.Scene;
  private squads: Map<string, RealisticMilitaryOperator[]> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createSquad(
    squadId: string,
    config: {
      team: 'alpha' | 'bravo';
      operatorClasses: OperatorConfig['class'][];
      positions: THREE.Vector3[];
      formation?: 'line' | 'v' | 'wedge' | 'circle';
    }
  ): RealisticMilitaryOperator[] {
    const squad: RealisticMilitaryOperator[] = [];

    config.operatorClasses.forEach((operatorClass, index) => {
      const operator = MilitaryOperatorFactory.createOperator(
        operatorClass,
        config.team,
        index === 0 ? 'team-lead' : 'operator',
        1.8
      );

      const position = config.positions[index] || new THREE.Vector3(0, 0, 0);
      operator.group.position.copy(position);

      // Configure shadows
      operator.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(operator.group);
      squad.push(operator);
    });

    this.squads.set(squadId, squad);
    return squad;
  }

  removeSquad(squadId: string): void {
    const squad = this.squads.get(squadId);
    if (squad) {
      squad.forEach(operator => {
        this.scene.remove(operator.group);
        operator.dispose();
      });
      this.squads.delete(squadId);
    }
  }

  getSquad(squadId: string): RealisticMilitaryOperator[] | undefined {
    return this.squads.get(squadId);
  }

  updateSquadFormation(
    squadId: string,
    formation: 'line' | 'v' | 'wedge' | 'circle',
    centerPosition: THREE.Vector3,
    spacing: number = 2
  ): void {
    const squad = this.squads.get(squadId);
    if (!squad) return;

    squad.forEach((operator, index) => {
      const position = this.calculateFormationPosition(
        index,
        squad.length,
        formation,
        spacing,
        centerPosition
      );
      operator.group.position.copy(position);
    });
  }

  private calculateFormationPosition(
    index: number,
    total: number,
    formation: string,
    spacing: number,
    center: THREE.Vector3
  ): THREE.Vector3 {
    const position = new THREE.Vector3();

    switch (formation) {
      case 'line':
        position.x = center.x + (index - Math.floor(total / 2)) * spacing;
        position.z = center.z;
        break;

      case 'v':
        if (index === 0) {
          position.set(center.x, center.y, center.z + spacing);
        } else {
          const angle = (Math.PI / 4) * (index % 2 === 0 ? 1 : -1);
          position.x = center.x + Math.sin(angle) * spacing * Math.ceil(index / 2);
          position.z = center.z + Math.cos(angle) * spacing * Math.ceil(index / 2);
        }
        break;

      case 'wedge':
        if (index === 0) {
          position.set(center.x, center.y, center.z + spacing * 2);
        } else {
          const row = Math.floor((index - 1) / 2) + 1;
          const side = (index - 1) % 2 === 0 ? -1 : 1;
          position.x = center.x + side * row * spacing * 0.5;
          position.z = center.z + spacing * (2 - row * 0.5);
        }
        break;

      case 'circle':
        const angle = (index / total) * Math.PI * 2;
        position.x = center.x + Math.cos(angle) * spacing;
        position.z = center.z + Math.sin(angle) * spacing;
        break;
    }

    position.y = center.y;
    return position;
  }

  dispose(): void {
    this.squads.forEach(squad => {
      squad.forEach(operator => {
        this.scene.remove(operator.group);
        operator.dispose();
      });
    });
    this.squads.clear();
  }
}

export default RealisticPlayerModels;