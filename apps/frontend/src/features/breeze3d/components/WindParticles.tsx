import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { NatureFactorRef } from '@/features/breeze3d/types';

interface WindParticlesProps {
    speed: number;
    active: boolean;
    natureFactorRef: NatureFactorRef;
}

// Shared geometry & material (created once)
const particleGeo = new THREE.SphereGeometry(1, 4, 4);
const particleMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.3,
    emissive: '#38bdf8',
    emissiveIntensity: 2,
});

const WindParticlesInner: React.FC<WindParticlesProps> = ({ speed, active, natureFactorRef }) => {
    const count = 30;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Smoothed intensity that lerps toward the target (0 when off, speed-based when on)
    const currentIntensity = useRef(0);

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            temp.push({
                x: (Math.random() - 0.5) * 3,
                y: (Math.random() - 0.5) * 3,
                z: Math.random() * -2,
                velocity: 0.1 + Math.random() * 0.2,
                life: Math.random(),
            });
        }
        return temp;
    }, [count]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Clamp delta to prevent massive jumps after tab minimize/restore
        const safeDelta = Math.min(delta, 0.1);

        // Smooth transition: lerp intensity toward target
        // Apply nature factor from the shared ref (written by FanModel each frame)
        const natureMod = natureFactorRef.current;
        const targetIntensity = active && speed > 0 ? (speed / 4) * natureMod : 0;
        currentIntensity.current = THREE.MathUtils.lerp(
            currentIntensity.current,
            targetIntensity,
            safeDelta * 2 // Same acceleration factor as fan blades
        );

        // Snap to zero when very close (avoid infinite tiny particles)
        if (currentIntensity.current < 0.001) {
            currentIntensity.current = 0;
        }

        const intensity = currentIntensity.current;
        const t = state.clock.getElapsedTime();

        for (let i = 0; i < count; i++) {
            const particle = particles[i];

            if (intensity > 0) {
                // Update life — speed proportional to intensity
                particle.life += safeDelta * (0.3 + intensity * 0.5);
                if (particle.life > 1) {
                    particle.life = 0;
                    particle.x = (Math.random() - 0.5) * 3;
                    particle.y = (Math.random() - 0.5) * 3;
                    particle.z = -0.5;
                }

                // Move forward — velocity proportional to intensity
                particle.z -= particle.velocity * intensity * 30 * safeDelta;

                // Wobble noise
                const noise = Math.sin(t * 5 + i) * 0.1;
                dummy.position.set(
                    particle.x + noise,
                    particle.y + Math.cos(t * 3 + i) * 0.1,
                    particle.z
                );

                // Scale proportional to intensity & life phase
                const lifeScale = (1 - particle.life) * 0.1;
                const s = lifeScale * intensity;
                dummy.scale.set(s, s, s);
            } else {
                dummy.scale.set(0, 0, 0);
            }

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[particleGeo, particleMat, count]} frustumCulled={false} />
    );
};

export const WindParticles = React.memo(WindParticlesInner);
