import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Sphere, Torus, Html } from '@react-three/drei';
import * as THREE from 'three';
import { FanProps } from '@/features/breeze3d/types';
import { WindParticles } from './WindParticles';
import { getNatureFactor } from '@/features/breeze3d/naturalWindEngine';

// === Shared Materials (created once, reused everywhere) ===
const metalMaterial = new THREE.MeshStandardMaterial({
  color: "#d1d5db",
  metalness: 0.6,
  roughness: 0.2
});

const plasticMaterial = new THREE.MeshStandardMaterial({
  color: "#f3f4f6",
  metalness: 0.1,
  roughness: 0.5
});

const bladeMaterial = new THREE.MeshStandardMaterial({
  color: "#38bdf8",
  transparent: true,
  opacity: 0.9,
  metalness: 0.1,
  roughness: 0.1
});

const grillMaterial = new THREE.MeshStandardMaterial({
  color: "#374151",
  metalness: 0.8,
  roughness: 0.2,
});

// === Shared Geometries (created once, referenced by all instances) ===
const grillSpokeGeo = new THREE.BoxGeometry(0.02, 4.2, 0.02);
const frontSpokeGeo = new THREE.BoxGeometry(0.015, 4.2, 0.015);
const bladeGeo = new THREE.BoxGeometry(0.45, 1.6, 0.05);
const bladeSupportGeo = new THREE.BoxGeometry(0.08, 0.4, 0.08);

// === Pre-computed grill spoke rotations ===
const backGrillSpokes = Array.from({ length: 16 }, (_, i) => (i * Math.PI) / 8);
const frontGrillSpokes = Array.from({ length: 24 }, (_, i) => (i * Math.PI) / 12);
const NUM_BLADES = 7;
const bladeAngles = Array.from({ length: NUM_BLADES }, (_, i) => (i * Math.PI * 2) / NUM_BLADES);

/**
 * GrillSpokes — Uses InstancedMesh to batch all grill spokes into a single draw call.
 * Before: 16+24 = 40 individual meshes = 40 draw calls
 * After:  2 InstancedMesh = 2 draw calls  (20x reduction)
 */
const BackGrill = React.memo(() => {
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useMemo(() => {
    // Deferred — will apply in useEffect-like after mount
  }, []);

  React.useEffect(() => {
    if (!meshRef.current) return;
    backGrillSpokes.forEach((rot, i) => {
      dummy.position.set(0, 0, 0.2);
      dummy.rotation.set(0, 0, rot);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  return (
    <instancedMesh ref={meshRef} args={[grillSpokeGeo, grillMaterial, backGrillSpokes.length]} />
  );
});
BackGrill.displayName = 'BackGrill';

const FrontGrill = React.memo(() => {
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!meshRef.current) return;
    frontGrillSpokes.forEach((rot, i) => {
      dummy.position.set(0, 0, -0.4);
      dummy.rotation.set(0, 0, rot);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  return (
    <instancedMesh ref={meshRef} args={[frontSpokeGeo, grillMaterial, frontGrillSpokes.length]} />
  );
});
FrontGrill.displayName = 'FrontGrill';

// === Main Fan Model Component ===
const FanModelInner: React.FC<FanProps> = ({ speed, isOscillating, natureMode = false, natureFactorRef, rotationSpeedRef }) => {
  const bladeGroupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);

  // Physics state (refs for zero-allocation per frame)
  const currentRotationSpeed = useRef(0);
  const oscillationAngle = useRef(0);
  const oscillationDirection = useRef(1);
  const natureFactor = useRef(1);

  // Pre-computed outside useFrame to avoid GC pressure
  const targetSpeedMap: Record<number, number> = useMemo(() => ({
    0: 0, 1: 0.15, 2: 0.35, 3: 0.6, 4: 0.9
  }), []);

  useFrame((state, delta) => {
    // Clamp delta to prevent jumps after tab minimize/restore
    const safeDelta = Math.min(delta, 0.1);

    // Nature Mode: Perlin noise modulation (replaces simple sine wave)
    if (natureMode && speed > 0) {
      natureFactor.current = getNatureFactor(state.clock.elapsedTime);
    } else {
      natureFactor.current = 1;
    }

    // Write to shared ref so WindParticles & FanAudio stay in sync
    natureFactorRef.current = natureFactor.current;

    const targetSpeed = targetSpeedMap[speed] * natureFactor.current;

    // Asymmetric motor inertia:
    //   - Acceleration (electric motor driving): faster response
    //   - Deceleration (coasting on inertia):    slower, more natural
    const lerpRate = targetSpeed > currentRotationSpeed.current
      ? safeDelta * 1.5   // accelerating (soft-start ramp)
      : safeDelta * 1.2;  // decelerating (coasting)

    currentRotationSpeed.current = THREE.MathUtils.lerp(
      currentRotationSpeed.current,
      targetSpeed,
      lerpRate
    );

    if (bladeGroupRef.current) {
      bladeGroupRef.current.rotation.z -= currentRotationSpeed.current;
    }

    // Write normalized rotation speed (0-1) for waveform monitor
    if (rotationSpeedRef) {
      rotationSpeedRef.current = currentRotationSpeed.current / 0.9; // 0.9 = max speed
    }

    // Oscillation
    if (headGroupRef.current) {
      if (isOscillating && speed > 0) {
        const oscSpeed = safeDelta * 0.4;
        const maxAngle = 0.8;
        oscillationAngle.current += oscSpeed * oscillationDirection.current;

        if (oscillationAngle.current > maxAngle) {
          oscillationAngle.current = maxAngle;
          oscillationDirection.current = -1;
        } else if (oscillationAngle.current < -maxAngle) {
          oscillationAngle.current = -maxAngle;
          oscillationDirection.current = 1;
        }
      }

      headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        headGroupRef.current.rotation.y,
        oscillationAngle.current,
        safeDelta * 5
      );
    }
  });

  return (
    <group position={[0, -2, 0]} rotation={[0, Math.PI, 0]}>
      {/* --- BASE --- */}
      <group>
        {/* Base plate (reduced segments: 32→20) */}
        <Cylinder args={[1.4, 1.6, 0.3, 20]} position={[0, 0.1, 0]} material={plasticMaterial} receiveShadow />
        {/* Physical buttons on base (reduced segments: 16→8) */}
        <group position={[0, 0.2, 0.8]}>
          <Cylinder args={[0.1, 0.1, 0.1, 8]} position={[-0.4, 0, 0]} material={metalMaterial} />
          <Cylinder args={[0.1, 0.1, 0.1, 8]} position={[-0.2, 0, 0]} material={metalMaterial} />
          <Cylinder args={[0.1, 0.1, 0.1, 8]} position={[0, 0, 0]} material={metalMaterial} />
          <Cylinder args={[0.1, 0.1, 0.1, 8]} position={[0.2, 0, 0]} material={metalMaterial} />
          <Cylinder args={[0.1, 0.1, 0.1, 8]} position={[0.4, 0, 0]} material={metalMaterial} />
        </group>
        {/* Pole — shortened to stop below the motor housing */}
        <Cylinder args={[0.25, 0.35, 2.6, 8]} position={[0, 1.4, 0]} material={metalMaterial} castShadow receiveShadow />
      </group>

      {/* --- HEAD GROUP (Oscillates) --- */}
      <group ref={headGroupRef} position={[0, 3, -0.6]}>

        {/* Wind Particles */}
        <group position={[0, 0, -1]}>
          <WindParticles speed={speed} active={speed > 0} natureFactorRef={natureFactorRef} />
        </group>

        {/* Motor Housing (reduced segments: 32→16) */}
        <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.6]}>
          <Cylinder args={[0.65, 0.7, 1.4, 16]} material={plasticMaterial} castShadow />
          <Sphere args={[0.65, 16, 8]} position={[0, 0.7, 0]} scale={[1, 0.4, 1]} material={plasticMaterial} />
          {/* Back motor vent (reduced segments: 32→16) */}
          <Torus args={[0.4, 0.05, 6, 16]} position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]} material={grillMaterial} />
        </group>

        {/* Neck joint — bridges pole top to head assembly */}
        <Sphere args={[0.45, 12, 8]} position={[0, -0.25, 0.45]} material={plasticMaterial} />

        {/* Fan Cage & Blades Container */}
        <group position={[0, 0, -0.2]}>

          {/* Back Grill — InstancedMesh (was 24 individual Box → 1 draw call) */}
          <BackGrill />
          <Torus args={[2.1, 0.05, 6, 32]} position={[0, 0, 0.2]} material={grillMaterial} />

          {/* BLADES GROUP (Rotates) */}
          <group ref={bladeGroupRef} position={[0, 0, -0.05]}>
            <Cylinder args={[0.3, 0.3, 0.4, 12]} rotation={[Math.PI / 2, 0, 0]} material={metalMaterial} />

            {/* Blades — using shared geometry & material ref (no spread copy) */}
            {bladeAngles.map((angle, i) => (
              <group key={i} rotation={[0, 0, angle]}>
                <mesh position={[0, 0.9, 0]} rotation={[0.15, 0, 0]} geometry={bladeGeo} material={bladeMaterial} />
                <mesh position={[0, 0.25, 0]} geometry={bladeSupportGeo} material={metalMaterial} />
              </group>
            ))}
          </group>

          {/* Front Grill Center Logo (reduced segments: 32→16) */}
          <group position={[0, 0, -0.4]}>
            <Cylinder args={[0.5, 0.5, 0.15, 16]} rotation={[Math.PI / 2, 0, 0]} material={plasticMaterial} />
            <Html transform position={[0, 0, -0.08]} scale={0.25} occlude>
              <div style={{ transform: 'scaleX(-1)' }} className="text-[10px] font-black text-blue-500 tracking-widest pointer-events-none select-none drop-shadow-md">BREEZE</div>
            </Html>
          </group>

          {/* Front Grill Rims (reduced segments) */}
          <Torus args={[2.1, 0.08, 6, 48]} position={[0, 0, -0.4]} material={grillMaterial} />
          <Torus args={[1.5, 0.04, 6, 24]} position={[0, 0, -0.38]} material={grillMaterial} />
          <Torus args={[0.8, 0.03, 6, 16]} position={[0, 0, -0.36]} material={grillMaterial} />

          {/* Front Grill Spokes — InstancedMesh (was 36 individual Box → 1 draw call) */}
          <FrontGrill />

        </group>
      </group>
    </group>
  );
};

export const FanModel = React.memo(FanModelInner);
