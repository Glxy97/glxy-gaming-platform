// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MilitaryRenderingSystem, MilitarySceneConfig, createMilitaryScene } from '@/lib/military-rendering-system';
import { RealisticMilitaryOperator, MilitaryOperatorFactory } from '@/lib/realistic-military-models';

interface MilitaryModelsDemoProps {
  className?: string;
  showControls?: boolean;
  autoRotate?: boolean;
}

export const RealisticMilitaryModelsDemo: React.FC<MilitaryModelsDemoProps> = ({
  className = '',
  showControls = true,
  autoRotate = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderingSystemRef = useRef<MilitaryRenderingSystem | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [sceneConfig, setSceneConfig] = useState<MilitarySceneConfig>({
    environment: 'training',
    timeOfDay: 'day',
    weather: 'clear',
    cameraMode: 'inspection'
  });

  const [currentOperators, setCurrentOperators] = useState<string[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [formation, setFormation] = useState<'line' | 'v' | 'wedge' | 'circle'>('line');
  const [team, setTeam] = useState<'alpha' | 'bravo'>('alpha');

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the rendering system
    const renderingSystem = createMilitaryScene(containerRef.current, sceneConfig);
    renderingSystemRef.current = renderingSystem;

    // Create initial squad
    const operatorIds = renderingSystem.createSquad({
      team,
      formation,
      spacing: 2
    });
    setCurrentOperators(operatorIds);

    // Handle window resize
    const handleResize = () => {
      if (containerRef.current && renderingSystemRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        renderingSystemRef.current.resize(clientWidth, clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Auto-rotation animation
    if (autoRotate) {
      const animate = () => {
        if (renderingSystemRef.current && renderingSystemRef.current.scene) {
          // Rotate all operators slowly
          renderingSystemRef.current.scene.children.forEach(child => {
            if (child instanceof THREE.Group && child.name.startsWith(team)) {
              child.rotation.y += 0.005;
            }
          });
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (renderingSystemRef.current) {
        renderingSystemRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (renderingSystemRef.current) {
      renderingSystemRef.current.setEnvironment(sceneConfig);
    }
  }, [sceneConfig]);

  const updateFormation = (newFormation: typeof formation) => {
    setFormation(newFormation);
    if (renderingSystemRef.current) {
      // Remove current operators
      currentOperators.forEach(id => {
        renderingSystemRef.current?.removeOperator(id);
      });

      // Create new squad with new formation
      const operatorIds = renderingSystemRef.current.createSquad({
        team,
        formation: newFormation,
        spacing: 2
      });
      setCurrentOperators(operatorIds);
    }
  };

  const updateTeam = (newTeam: typeof team) => {
    setTeam(newTeam);
    if (renderingSystemRef.current) {
      // Remove current operators
      currentOperators.forEach(id => {
        renderingSystemRef.current?.removeOperator(id);
      });

      // Create new squad with new team
      const operatorIds = renderingSystemRef.current.createSquad({
        team: newTeam,
        formation,
        spacing: 2
      });
      setCurrentOperators(operatorIds);
    }
  };

  const focusOnOperator = (operatorId: string) => {
    setSelectedOperator(operatorId);
    if (renderingSystemRef.current) {
      renderingSystemRef.current.focusOnOperator(operatorId);
    }
  };

  const takeScreenshot = () => {
    if (renderingSystemRef.current) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      renderingSystemRef.current.takeScreenshot(`military-models-${timestamp}.png`);
    }
  };

  const getPerformanceMetrics = () => {
    if (renderingSystemRef.current) {
      return renderingSystemRef.current.getPerformanceMetrics();
    }
    return null;
  };

  const operatorClasses = [
    { id: 'assault', name: 'Assault', description: 'Heavy weapons, grenades' },
    { id: 'recon', name: 'Recon', description: 'Sniper rifle, surveillance' },
    { id: 'marksman', name: 'Marksman', description: 'Battle rifle, spotting scope' },
    { id: 'engineer', name: 'Engineer', description: 'Carbine, toolkit' },
    { id: 'medic', name: 'Medic', description: 'SMG, medical kit' }
  ];

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* 3D Scene Container */}
      <div
        ref={containerRef}
        className="w-full h-full bg-gradient-to-b from-sky-400 to-sky-600 rounded-lg overflow-hidden"
      />

      {/* Control Panel */}
      {showControls && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg max-w-sm">
          <h3 className="text-lg font-bold mb-3">Military Models Controls</h3>

          {/* Environment Controls */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Environment</h4>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={sceneConfig.environment}
                onChange={(e) => setSceneConfig(prev => ({ ...prev, environment: e.target.value as any }))}
                className="bg-gray-800 text-xs px-2 py-1 rounded"
              >
                <option value="training">Training Ground</option>
                <option value="urban">Urban</option>
                <option value="forest">Forest</option>
                <option value="desert">Desert</option>
                <option value="indoor">Indoor</option>
              </select>

              <select
                value={sceneConfig.timeOfDay}
                onChange={(e) => setSceneConfig(prev => ({ ...prev, timeOfDay: e.target.value as any }))}
                className="bg-gray-800 text-xs px-2 py-1 rounded"
              >
                <option value="dawn">Dawn</option>
                <option value="day">Day</option>
                <option value="dusk">Dusk</option>
                <option value="night">Night</option>
              </select>

              <select
                value={sceneConfig.weather}
                onChange={(e) => setSceneConfig(prev => ({ ...prev, weather: e.target.value as any }))}
                className="bg-gray-800 text-xs px-2 py-1 rounded"
              >
                <option value="clear">Clear</option>
                <option value="overcast">Overcast</option>
                <option value="rain">Rain</option>
                <option value="fog">Fog</option>
              </select>

              <select
                value={sceneConfig.cameraMode}
                onChange={(e) => setSceneConfig(prev => ({ ...prev, cameraMode: e.target.value as any }))}
                className="bg-gray-800 text-xs px-2 py-1 rounded"
              >
                <option value="inspection">Inspection</option>
                <option value="cinematic">Cinematic</option>
                <option value="gameplay">Gameplay</option>
              </select>
            </div>
          </div>

          {/* Team Controls */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Team & Formation</h4>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => updateTeam('alpha')}
                className={`flex-1 text-xs px-2 py-1 rounded transition-colors ${
                  team === 'alpha'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Team Alpha
              </button>
              <button
                onClick={() => updateTeam('bravo')}
                className={`flex-1 text-xs px-2 py-1 rounded transition-colors ${
                  team === 'bravo'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Team Bravo
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateFormation('line')}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  formation === 'line'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => updateFormation('v')}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  formation === 'v'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                V-Formation
              </button>
              <button
                onClick={() => updateFormation('wedge')}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  formation === 'wedge'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Wedge
              </button>
              <button
                onClick={() => updateFormation('circle')}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  formation === 'circle'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Circle
              </button>
            </div>
          </div>

          {/* Operator Classes Display */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Operator Classes</h4>
            <div className="space-y-1">
              {operatorClasses.map((operatorClass, index) => (
                <div
                  key={operatorClass.id}
                  className={`text-xs p-2 rounded cursor-pointer transition-colors ${
                    selectedOperator === `${team}-operator-${index}`
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => focusOnOperator(`${team}-operator-${index}`)}
                >
                  <div className="font-semibold">{operatorClass.name}</div>
                  <div className="text-xs opacity-75">{operatorClass.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={takeScreenshot}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-2 rounded transition-colors"
            >
              📸 Screenshot
            </button>
            <button
              onClick={() => {
                const metrics = getPerformanceMetrics();
                if (metrics) {
                  console.log('Performance Metrics:', metrics);
                }
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-2 rounded transition-colors"
            >
              📊 Metrics
            </button>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg max-w-xs">
        <h3 className="text-lg font-bold mb-2">Realistic Military Models</h3>
        <div className="text-xs space-y-2">
          <p>
            <span className="font-semibold">Technology:</span> Advanced Three.js geometry combinations
          </p>
          <p>
            <span className="font-semibold">Anatomy:</span> Muscular definition, proper proportions
          </p>
          <p>
            <span className="font-semibold">Equipment:</span> Class-specific tactical gear
          </p>
          <p>
            <span className="font-semibold">Materials:</span> PBR rendering with realistic lighting
          </p>
          <p>
            <span className="font-semibold">Animation:</span> Skeletal system with blend shapes
          </p>
          <p>
            <span className="font-semibold">Performance:</span> LOD system, optimized rendering
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-600">
          <p className="text-xs">
            <span className="font-semibold">Controls:</span> Mouse to rotate view, scroll to zoom
          </p>
          <p className="text-xs">
            <span className="font-semibold">Operators:</span> {currentOperators.length} active
          </p>
          <p className="text-xs">
            <span className="font-semibold">Team:</span> <span className={team === 'alpha' ? 'text-blue-400' : 'text-red-400'}>{team.toUpperCase()}</span>
          </p>
        </div>
      </div>

      {/* Performance Monitor (optional) */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-80 text-white p-2 rounded text-xs">
        <div className="font-mono">
          FPS: <span id="fps">60</span> |
          Draw Calls: <span id="drawcalls">0</span> |
          Triangles: <span id="triangles">0</span>
        </div>
      </div>
    </div>
  );
};

export default RealisticMilitaryModelsDemo;