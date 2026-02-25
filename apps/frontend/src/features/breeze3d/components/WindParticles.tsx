import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { NatureFactorRef } from '@/features/breeze3d/types';

interface WindParticlesProps {
    speed: number;
    active: boolean;
    natureFactorRef: NatureFactorRef;
}

/**
 * CPU Optimized Wind Particles
 * 1. Reduced count on mobile.
 * 2. Static object allocation (dummy) to prevent GC pressure.
 * 3. Simplified math for particle updates.
 */
const WindParticlesInner: React.FC<WindParticlesProps> = ({ speed, active, natureFactorRef }) => {
    // Optimization: detect mobile to cut CPU load
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const count = isMobile ? 12 : 30;

    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Resources with cleanup
    const geometry = useMemo(() => new THREE.SphereGeometry(1, 3, 3), []); // Lower segments
    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.2,
        emissive: '#38bdf8',
        emissiveIntensity: 1.5,
    }), []);

    useEffect(() => {
        return () => {
            geometry.dispose();
            material.dispose();
        };
    }, [geometry, material]);

    const currentIntensity = useRef(0);
    const hasInitialized = useRef(false);

    useEffect(() => {
        // Force hide all instances on mount
        if (meshRef.current) {
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
            for (let i = 0; i < count; i++) {
                meshRef.current.setMatrixAt(i, dummy.matrix);
            }
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [count, dummy]);

    // Particle pool with pre-calculated static values
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            temp.push({
                x: (Math.random() - 0.5) * 2.8,
                y: (Math.random() - 0.5) * 2.8,
                z: Math.random() * -2,
                velocity: 0.12 + Math.random() * 0.15,
                life: Math.random(),
                offset: Math.random() * 10, // Pre-randomized for noise
            });
        }
        return temp;
    }, [count]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Initialize: hide everything on first frame just in case
        if (!hasInitialized.current) {
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
            for (let i = 0; i < count; i++) {
                meshRef.current.setMatrixAt(i, dummy.matrix);
            }
            meshRef.current.instanceMatrix.needsUpdate = true;
            hasInitialized.current = true;
        }

        const safeDelta = Math.min(delta, 0.1);
        const natureMod = natureFactorRef.current;
        const targetIntensity = active && speed > 0 ? (speed / 4) * natureMod : 0;

        // Lerp intensity
        currentIntensity.current += (targetIntensity - currentIntensity.current) * safeDelta * 4;

        if (currentIntensity.current < 0.001) {
            if (currentIntensity.current !== 0) {
                currentIntensity.current = 0;
                // Force-hide all particles once
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                for (let i = 0; i < count; i++) {
                    meshRef.current.setMatrixAt(i, dummy.matrix);
                }
                meshRef.current.instanceMatrix.needsUpdate = true;
            }
            return;
        }

        const intensity = currentIntensity.current;
        const t = state.clock.getElapsedTime();

        for (let i = 0; i < count; i++) {
            const p = particles[i];

            // Speed & Life update
            p.life += safeDelta * (0.3 + intensity * 0.6);
            if (p.life > 1) {
                p.life = 0;
                p.z = -0.4;
            }

            p.z -= p.velocity * intensity * 35 * safeDelta;

            // Simplified wobble (one sin instead of two)
            const wobble = Math.sin(t * 4 + p.offset) * 0.08;
            dummy.position.set(p.x + wobble, p.y + wobble, p.z);

            // Scale based on life phase
            const s = (1 - p.life) * 0.08 * intensity;
            dummy.scale.setScalar(s);

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[geometry, material, count]} frustumCulled={false} />
    );
};

export const WindParticles = React.memo(WindParticlesInner);
