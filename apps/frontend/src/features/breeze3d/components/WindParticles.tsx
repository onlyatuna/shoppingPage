import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { NatureFactorRef, QualityLevel } from '@/features/breeze3d/types';
import { QUALITY_CONFIGS } from '@/features/breeze3d/types';

interface WindParticlesProps {
    speed: number;
    active: boolean;
    natureFactorRef: NatureFactorRef;
    quality: QualityLevel;
}

/**
 * CPU 優化的風力粒子效果
 * 1. 在移動端減少數量。
 * 2. 靜態對象分配 (dummy) 以防止垃圾回收 (GC) 壓力。
 * 3. 簡化粒子更新的數學計算。
 */
const WindParticlesInner: React.FC<WindParticlesProps> = ({ speed, active, natureFactorRef, quality }) => {
    const config = QUALITY_CONFIGS[quality];
    const count = config.particles; // 位粒子總數

    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // 資源初始化與清理
    const geometry = useMemo(() => new THREE.SphereGeometry(1, 3, 3), []); // 低分段幾何體
    const material = useMemo(() => {
        if (quality === 'low') {
            return new THREE.MeshBasicMaterial({
                color: '#38bdf8',
                transparent: true,
                opacity: 0.3,
            });
        }
        return new THREE.MeshStandardMaterial({
            color: '#ffffff',
            transparent: true,
            opacity: quality === 'flagship' ? 0.4 : (quality === 'high' ? 0.5 : 0.3),
            emissive: '#38bdf8',
            emissiveIntensity: quality === 'flagship' ? 3 : (quality === 'high' ? 4 : 2),
        });
    }, [quality]);

    useEffect(() => {
        return () => {
            geometry.dispose();
            material.dispose();
        };
    }, [geometry, material]);

    const currentIntensity = useRef(0);
    const hasInitialized = useRef(false);

    useEffect(() => {
        // 掛載時強制隱藏所有實例
        if (meshRef.current) {
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
            for (let i = 0; i < count; i++) {
                meshRef.current.setMatrixAt(i, dummy.matrix);
            }
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [count, dummy]);

    // 粒子池：預計算隨機靜態值
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            temp.push({
                x: (Math.random() - 0.5) * 2.8,
                y: (Math.random() - 0.5) * 2.8,
                z: Math.random() * -2,
                velocity: 0.12 + Math.random() * 0.15,
                life: Math.random(),
                offset: Math.random() * 10, // 用於雜訊的隨機偏移
            });
        }
        return temp;
    }, [count]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // 初始化：第一幀隱藏所有內容，以防萬一
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

        // 漸變強度 (Lerp)
        currentIntensity.current += (targetIntensity - currentIntensity.current) * safeDelta * 4;

        if (currentIntensity.current < 0.001) {
            if (currentIntensity.current !== 0) {
                currentIntensity.current = 0;
                // 強制隱藏所有粒子一次
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

            // 速度與生命週期更新
            p.life += safeDelta * (0.3 + intensity * 0.6);
            if (p.life > 1) {
                p.life = 0;
                p.z = -0.4;
            }

            p.z -= p.velocity * intensity * 35 * safeDelta;

            // 簡化晃動效果
            const wobble = Math.sin(t * 4 + p.offset) * 0.08;
            dummy.position.set(p.x + wobble, p.y + wobble, p.z);

            // 根據生命週期縮放大小
            const s = (1 - p.life) * 0.14 * intensity;
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
