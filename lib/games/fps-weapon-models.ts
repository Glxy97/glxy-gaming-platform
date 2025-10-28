/**
 * Realistic 3D Weapon Models for FPS Enhanced
 * Professional weapon models with detailed attachments and animations
 */

import * as THREE from 'three';

export interface WeaponModel {
  group: THREE.Group;
  fireAnimation: (muzzle?: THREE.Vector3) => void;
  reloadAnimation: () => Promise<void>;
  aimDownSights: (isAiming: boolean) => void;
  updateAttachmentState: (attachment: string, active: boolean) => void;
}

export class FPSWeaponModels {
  public static createAssaultRifle(): WeaponModel {
    const weaponGroup = new THREE.Group();

    // Main receiver body
    const receiverGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.35);
    const receiverMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial);
    receiver.position.z = 0;
    weaponGroup.add(receiver);

    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.4, 12);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.25;
    weaponGroup.add(barrel);

    // Handguard
    const handguardGeometry = new THREE.BoxGeometry(0.06, 0.08, 0.25);
    const handguardMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const handguard = new THREE.Mesh(handguardGeometry, handguardMaterial);
    handguard.position.z = 0.15;
    weaponGroup.add(handguard);

    // Pistol grip
    const gripGeometry = new THREE.BoxGeometry(0.04, 0.08, 0.12);
    const gripMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const grip = new THREE.Mesh(gripGeometry, gripMaterial);
    grip.position.y = -0.06;
    grip.position.z = -0.05;
    weaponGroup.add(grip);

    // Magazine
    const magazineGeometry = new THREE.BoxGeometry(0.03, 0.12, 0.08);
    const magazineMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial);
    magazine.position.y = -0.04;
    magazine.position.z = 0.05;
    weaponGroup.add(magazine);

    // Stock
    const stockGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.15);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.z = -0.25;
    weaponGroup.add(stock);

    // Rails and attachments
    const railGeometry = new THREE.BoxGeometry(0.02, 0.005, 0.2);
    const railMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const topRail = new THREE.Mesh(railGeometry, railMaterial);
    topRail.position.y = 0.065;
    topRail.position.z = 0.1;
    weaponGroup.add(topRail);

    // Red dot sight
    const sightBaseGeometry = new THREE.BoxGeometry(0.06, 0.02, 0.04);
    const sightBase = new THREE.Mesh(sightBaseGeometry, railMaterial);
    sightBase.position.y = 0.07;
    sightBase.position.z = 0.05;
    weaponGroup.add(sightBase);

    const sightLensGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.01, 16);
    const sightLensMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.6
    });
    const sightLens = new THREE.Mesh(sightLensGeometry, sightLensMaterial);
    sightLens.rotation.x = Math.PI / 2;
    sightLens.position.y = 0.08;
    sightLens.position.z = 0.05;
    weaponGroup.add(sightLens);

    // Forward grip
    const forwardGripGeometry = new THREE.BoxGeometry(0.03, 0.06, 0.08);
    const forwardGrip = new THREE.Mesh(forwardGripGeometry, gripMaterial);
    forwardGrip.position.y = -0.02;
    forwardGrip.position.z = 0.2;
    weaponGroup.add(forwardGrip);

    // Muzzle device
    const muzzleGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.04, 8);
    const muzzleMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const muzzle = new THREE.Mesh(muzzleGeometry, muzzleMaterial);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.z = 0.45;
    weaponGroup.add(muzzle);

    // Store original positions for animations
    const originalPositions = new Map();
    weaponGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        originalPositions.set(child, child.position.clone());
      }
    });

    // Animation functions
    let isAiming = false;
    let isReloading = false;

    const fireAnimation = (muzzle?: THREE.Vector3) => {
      if (isReloading) return;

      // Muzzle flash
      if (muzzle) {
        const flashGeometry = new THREE.SphereGeometry(0.03, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
          color: 0xffff00,
          transparent: true,
          opacity: 0.9
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(muzzle);
        weaponGroup.parent?.add(flash);

        setTimeout(() => {
          weaponGroup.parent?.remove(flash);
        }, 50);
      }

      // Weapon recoil animation
      const recoilDistance = 0.02;
      weaponGroup.position.z -= recoilDistance;
      weaponGroup.rotation.x += 0.05;

      setTimeout(() => {
        weaponGroup.position.z += recoilDistance;
        weaponGroup.rotation.x -= 0.05;
      }, 100);
    };

    const reloadAnimation = async (): Promise<void> => {
      if (isReloading) return;
      isReloading = true;

      // Remove magazine
      const magazine = weaponGroup.children.find(child =>
        child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry &&
        child.scale.x === 1 && child.scale.y === 1 && child.scale.z === 1 &&
        Math.abs(child.position.y + 0.04) < 0.01 && Math.abs(child.position.z - 0.05) < 0.01
      ) as THREE.Mesh;

      if (magazine) {
        // Animate magazine removal
        const startPos = magazine.position.clone();
        magazine.position.y -= 0.15;

        await new Promise(resolve => setTimeout(resolve, 300));

        // Animate magazine insertion
        magazine.position.copy(startPos);

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      isReloading = false;
    };

    const aimDownSights = (aiming: boolean) => {
      isAiming = aiming;

      if (aiming) {
        weaponGroup.position.set(0.08, -0.05, 0.15);
        weaponGroup.rotation.set(0.05, 0.02, 0);
      } else {
        weaponGroup.position.set(0.15, -0.08, 0.05);
        weaponGroup.rotation.set(0.1, 0.05, 0);
      }
    };

    const updateAttachmentState = (attachment: string, active: boolean) => {
      const attachmentMesh = weaponGroup.children.find(child =>
        child.name === attachment
      );
      if (attachmentMesh) {
        attachmentMesh.visible = active;
      }
    };

    // Set initial position
    aimDownSights(false);

    return {
      group: weaponGroup,
      fireAnimation,
      reloadAnimation,
      aimDownSights,
      updateAttachmentState
    };
  }

  public static createShotgun(): WeaponModel {
    const weaponGroup = new THREE.Group();

    // Receiver
    const receiverGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.3);
    const receiverMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial);
    receiver.position.z = 0;
    weaponGroup.add(receiver);

    // Barrels (double barrel shotgun)
    for (let i = -1; i <= 1; i += 2) {
      const barrelGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.5, 12);
      const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(i * 0.02, 0, 0.3);
      weaponGroup.add(barrel);
    }

    // Stock
    const stockGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.2);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x5a3a2a });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.z = -0.2;
    weaponGroup.add(stock);

    // Pistol grip
    const gripGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.1);
    const gripMaterial = new THREE.MeshLambertMaterial({ color: 0x3a2a2a });
    const grip = new THREE.Mesh(gripGeometry, gripMaterial);
    grip.position.y = -0.08;
    grip.position.z = -0.05;
    weaponGroup.add(grip);

    // Trigger guard
    const guardGeometry = new THREE.TorusGeometry(0.04, 0.005, 8, 16);
    const guardMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const guard = new THREE.Mesh(guardGeometry, guardMaterial);
    guard.rotation.x = Math.PI / 2;
    guard.position.set(0, -0.03, 0);
    weaponGroup.add(guard);

    const fireAnimation = (muzzle?: THREE.Vector3) => {
      // Stronger recoil for shotgun
      weaponGroup.position.z -= 0.04;
      weaponGroup.rotation.x += 0.1;

      setTimeout(() => {
        weaponGroup.position.z += 0.04;
        weaponGroup.rotation.x -= 0.1;
      }, 150);

      // Wider muzzle spread for shotgun
      if (muzzle) {
        for (let i = 0; i < 3; i++) {
          const flashGeometry = new THREE.SphereGeometry(0.02, 6, 6);
          const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.7
          });
          const flash = new THREE.Mesh(flashGeometry, flashMaterial);
          const offset = (Math.random() - 0.5) * 0.05;
          flash.position.set(muzzle.x + offset, muzzle.y + offset, muzzle.z);
          weaponGroup.parent?.add(flash);

          setTimeout(() => {
            weaponGroup.parent?.remove(flash);
          }, 60);
        }
      }
    };

    const reloadAnimation = async (): Promise<void> => {
      // Break open shotgun animation
      weaponGroup.rotation.x += 0.3;
      await new Promise(resolve => setTimeout(resolve, 500));
      weaponGroup.rotation.x -= 0.3;
    };

    const aimDownSights = (aiming: boolean) => {
      if (aiming) {
        weaponGroup.position.set(0.06, -0.04, 0.12);
        weaponGroup.rotation.set(0.03, 0.01, 0);
      } else {
        weaponGroup.position.set(0.12, -0.06, 0.03);
        weaponGroup.rotation.set(0.08, 0.03, 0);
      }
    };

    const updateAttachmentState = (attachment: string, active: boolean) => {
      // Shotgun has fewer attachments
    };

    aimDownSights(false);

    return {
      group: weaponGroup,
      fireAnimation,
      reloadAnimation,
      aimDownSights,
      updateAttachmentState
    };
  }

  public static createSniperRifle(): WeaponModel {
    const weaponGroup = new THREE.Group();

    // Long barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.008, 0.01, 0.8, 16);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.4;
    weaponGroup.add(barrel);

    // Bolt action receiver
    const receiverGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.25);
    const receiverMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial);
    receiver.position.z = 0;
    weaponGroup.add(receiver);

    // Bolt handle
    const boltGeometry = new THREE.TorusGeometry(0.015, 0.003, 6, 12);
    const boltMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
    bolt.rotation.z = Math.PI / 2;
    bolt.position.set(0.06, 0.05, 0);
    weaponGroup.add(bolt);

    // Scope mount
    const mountGeometry = new THREE.BoxGeometry(0.1, 0.02, 0.08);
    const mountMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const mount = new THREE.Mesh(mountGeometry, mountMaterial);
    mount.position.y = 0.06;
    mount.position.z = -0.05;
    weaponGroup.add(mount);

    // Scope body
    const scopeBodyGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 16);
    const scopeBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const scopeBody = new THREE.Mesh(scopeBodyGeometry, scopeBodyMaterial);
    scopeBody.rotation.x = Math.PI / 2;
    scopeBody.position.y = 0.08;
    scopeBody.position.z = 0;
    weaponGroup.add(scopeBody);

    // Scope lenses
    const lensGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.002, 16);
    const lensMaterial = new THREE.MeshBasicMaterial({
      color: 0x4444ff,
      transparent: true,
      opacity: 0.8
    });

    const frontLens = new THREE.Mesh(lensGeometry, lensMaterial);
    frontLens.rotation.x = Math.PI / 2;
    frontLens.position.y = 0.08;
    frontLens.position.z = 0.12;
    weaponGroup.add(frontLens);

    const rearLens = new THREE.Mesh(lensGeometry, lensMaterial);
    rearLens.rotation.x = Math.PI / 2;
    rearLens.position.y = 0.08;
    rearLens.position.z = -0.12;
    weaponGroup.add(rearLens);

    // Bipod
    const bipodBaseGeometry = new THREE.BoxGeometry(0.12, 0.02, 0.03);
    const bipodMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const bipodBase = new THREE.Mesh(bipodBaseGeometry, bipodMaterial);
    bipodBase.position.z = 0.6;
    weaponGroup.add(bipodBase);

    // Bipod legs
    for (let i = -1; i <= 1; i += 2) {
      const legGeometry = new THREE.BoxGeometry(0.005, 0.08, 0.005);
      const leg = new THREE.Mesh(legGeometry, bipodMaterial);
      leg.position.set(i * 0.05, 0.04, 0.6);
      leg.rotation.z = i * 0.1;
      weaponGroup.add(leg);
    }

    const fireAnimation = (muzzle?: THREE.Vector3) => {
      // Bolt action animation
      const bolt = weaponGroup.children.find(child =>
        child instanceof THREE.Mesh && child.geometry instanceof THREE.TorusGeometry
      ) as THREE.Mesh;

      if (bolt) {
        bolt.position.x += 0.03;
        setTimeout(() => {
          bolt.position.x -= 0.03;
        }, 200);
      }

      // Minimal recoil for sniper
      weaponGroup.position.z -= 0.01;
      weaponGroup.rotation.x += 0.02;

      setTimeout(() => {
        weaponGroup.position.z += 0.01;
        weaponGroup.rotation.x -= 0.02;
      }, 200);

      // Single muzzle flash
      if (muzzle) {
        const flashGeometry = new THREE.SphereGeometry(0.025, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(muzzle);
        weaponGroup.parent?.add(flash);

        setTimeout(() => {
          weaponGroup.parent?.remove(flash);
        }, 80);
      }
    };

    const reloadAnimation = async (): Promise<void> => {
      // Bolt action reload sequence
      const bolt = weaponGroup.children.find(child =>
        child instanceof THREE.Mesh && child.geometry instanceof THREE.TorusGeometry
      ) as THREE.Mesh;

      if (bolt) {
        bolt.position.x += 0.05;
        await new Promise(resolve => setTimeout(resolve, 300));
        bolt.position.x -= 0.05;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    };

    const aimDownSights = (aiming: boolean) => {
      if (aiming) {
        weaponGroup.position.set(0.02, -0.02, 0.25);
        weaponGroup.rotation.set(-0.02, 0, 0);
      } else {
        weaponGroup.position.set(0.08, -0.04, 0.08);
        weaponGroup.rotation.set(0.05, 0.02, 0);
      }
    };

    const updateAttachmentState = (attachment: string, active: boolean) => {
      // Sniper has limited attachments
    };

    aimDownSights(false);

    return {
      group: weaponGroup,
      fireAnimation,
      reloadAnimation,
      aimDownSights,
      updateAttachmentState
    };
  }

  public static createPistol(): WeaponModel {
    const weaponGroup = new THREE.Group();

    // Slide
    const slideGeometry = new THREE.BoxGeometry(0.03, 0.08, 0.15);
    const slideMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const slide = new THREE.Mesh(slideGeometry, slideMaterial);
    slide.position.z = 0.05;
    slide.position.y = 0.02;
    weaponGroup.add(slide);

    // Frame
    const frameGeometry = new THREE.BoxGeometry(0.035, 0.1, 0.12);
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.z = 0;
    weaponGroup.add(frame);

    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.006, 0.006, 0.12, 12);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.08;
    barrel.position.y = 0.02;
    weaponGroup.add(barrel);

    // Grip
    const gripGeometry = new THREE.BoxGeometry(0.04, 0.08, 0.06);
    const gripMaterial = new THREE.MeshLambertMaterial({ color: 0x3a2a2a });
    const grip = new THREE.Mesh(gripGeometry, gripMaterial);
    grip.position.y = -0.04;
    grip.position.z = -0.02;
    weaponGroup.add(grip);

    // Trigger
    const triggerGeometry = new THREE.BoxGeometry(0.02, 0.03, 0.01);
    const triggerMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
    trigger.position.set(0.015, -0.02, 0.02);
    trigger.rotation.z = 0.2;
    weaponGroup.add(trigger);

    // Magazine
    const magazineGeometry = new THREE.BoxGeometry(0.02, 0.08, 0.04);
    const magazineMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial);
    magazine.position.y = -0.02;
    magazine.position.z = 0.03;
    weaponGroup.add(magazine);

    const fireAnimation = (muzzle?: THREE.Vector3) => {
      // Slide animation
      const slide = weaponGroup.children.find(child =>
        child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry &&
        Math.abs(child.position.z - 0.05) < 0.01 && Math.abs(child.position.y - 0.02) < 0.01
      ) as THREE.Mesh;

      if (slide) {
        slide.position.z -= 0.03;
        setTimeout(() => {
          slide.position.z += 0.03;
        }, 100);
      }

      // Small recoil
      weaponGroup.rotation.x += 0.03;
      setTimeout(() => {
        weaponGroup.rotation.x -= 0.03;
      }, 80);

      // Pistol muzzle flash
      if (muzzle) {
        const flashGeometry = new THREE.SphereGeometry(0.015, 6, 6);
        const flashMaterial = new THREE.MeshBasicMaterial({
          color: 0xffaa00,
          transparent: true,
          opacity: 0.9
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(muzzle);
        weaponGroup.parent?.add(flash);

        setTimeout(() => {
          weaponGroup.parent?.remove(flash);
        }, 40);
      }
    };

    const reloadAnimation = async (): Promise<void> => {
      // Magazine drop and insert
      const magazine = weaponGroup.children.find(child =>
        child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry &&
        Math.abs(child.position.y + 0.02) < 0.01 && Math.abs(child.position.z - 0.03) < 0.01
      ) as THREE.Mesh;

      if (magazine) {
        magazine.position.y -= 0.12;
        await new Promise(resolve => setTimeout(resolve, 200));
        magazine.position.y += 0.12;
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    };

    const aimDownSights = (aiming: boolean) => {
      if (aiming) {
        weaponGroup.position.set(0.05, -0.02, 0.08);
        weaponGroup.rotation.set(0.02, 0, 0);
      } else {
        weaponGroup.position.set(0.08, -0.04, 0.04);
        weaponGroup.rotation.set(0.06, 0.02, 0);
      }
    };

    const updateAttachmentState = (attachment: string, active: boolean) => {
      // Pistol attachments (silencer, laser sight, etc.)
    };

    aimDownSights(false);

    return {
      group: weaponGroup,
      fireAnimation,
      reloadAnimation,
      aimDownSights,
      updateAttachmentState
    };
  }
}