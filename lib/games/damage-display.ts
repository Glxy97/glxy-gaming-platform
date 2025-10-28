import * as THREE from 'three';

/**
 * Show damage indicator at a specific position
 * This function can be called from anywhere in the game
 */
export function showDamageIndicator(
  position: THREE.Vector3,
  damage: number,
  isHeadshot: boolean = false,
  isCritical: boolean = false
): void {
  if (typeof window !== 'undefined' && (window as any).showDamageIndicator) {
    (window as any).showDamageIndicator(position, damage, isHeadshot, isCritical);
  }
}

/**
 * Show damage indicator for player damage
 */
export function showPlayerDamage(
  damage: number,
  isHeadshot: boolean = false,
  isCritical: boolean = false
): void {
  // Show damage indicator at player's crosshair position (center of screen)
  const centerPosition = new THREE.Vector3(0, 1.8, 0); // Approximate player position
  showDamageIndicator(centerPosition, damage, isHeadshot, isCritical);
}

/**
 * Show damage indicator for bot damage
 */
export function showBotDamage(
  botPosition: THREE.Vector3,
  damage: number,
  isHeadshot: boolean = false,
  isCritical: boolean = false
): void {
  showDamageIndicator(botPosition, damage, isHeadshot, isCritical);
}