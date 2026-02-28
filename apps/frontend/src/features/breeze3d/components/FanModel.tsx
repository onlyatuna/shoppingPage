import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Sphere, Torus, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';
import { FanProps, QUALITY_CONFIGS } from '@/features/breeze3d/types';
import { WindParticles } from './WindParticles';
import { getNatureFactor } from '@/features/breeze3d/naturalWindEngine';

// === 預定義材質：針對不同畫質等級進行優化 ===
const MATERIALS = {
  // 低畫質：使用基礎發光材質，無光影計算
  basic: {
    metal: new THREE.MeshBasicMaterial({ color: "#d1d5db" }),
    plastic: new THREE.MeshBasicMaterial({ color: "#f3f4f6" }),
    blade: new THREE.MeshBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.8 }),
    grill: new THREE.MeshBasicMaterial({ color: "#374151" }),
  },
  // 性能模式：使用 Phong 材質，提供簡單的光澤感
  phong: {
    metal: new THREE.MeshPhongMaterial({ color: "#d1d5db", specular: "#ffffff", shininess: 100 }),
    plastic: new THREE.MeshPhongMaterial({ color: "#f3f4f6", specular: "#111111", shininess: 30 }),
    blade: new THREE.MeshPhongMaterial({ color: "#38bdf8", transparent: true, opacity: 0.8, specular: "#ffffff", shininess: 50 }),
    grill: new THREE.MeshPhongMaterial({ color: "#374151", specular: "#222222", shininess: 10 }),
  },
  // 標準模式：使用標準 PBR 材質
  standard: {
    metal: new THREE.MeshStandardMaterial({ color: "#d1d5db", metalness: 0.6, roughness: 0.2 }),
    plastic: new THREE.MeshStandardMaterial({ color: "#f3f4f6", metalness: 0.1, roughness: 0.5 }),
    blade: new THREE.MeshStandardMaterial({ color: "#38bdf8", transparent: true, opacity: 0.9, metalness: 0.1, roughness: 0.1 }),
    grill: new THREE.MeshStandardMaterial({ color: "#374151", metalness: 0.8, roughness: 0.2 }),
  },
  // 高畫質模式：增強反射強度與環境光遮蔽細節
  standard_high: {
    metal: new THREE.MeshStandardMaterial({ color: "#d1d5db", metalness: 0.8, roughness: 0.15, envMapIntensity: 1.5 }),
    plastic: new THREE.MeshStandardMaterial({ color: "#f3f4f6", metalness: 0.2, roughness: 0.4, envMapIntensity: 1.2 }),
    blade: new THREE.MeshStandardMaterial({ color: "#38bdf8", transparent: true, opacity: 0.8, metalness: 0.5, roughness: 0.1, envMapIntensity: 2.0 }),
    grill: new THREE.MeshStandardMaterial({ color: "#374151", metalness: 0.8, roughness: 0.2, envMapIntensity: 1.2 }),
  },
  // 極致畫質 (WebGPU)：使用物理反射材質，開啟透光與清漆效果
  physical: {
    metal: new THREE.MeshPhysicalMaterial({ color: "#d1d5db", metalness: 0.9, roughness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.1 }),
    plastic: new THREE.MeshPhysicalMaterial({ color: "#f3f4f6", metalness: 0.2, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
    blade: new THREE.MeshPhysicalMaterial({ color: "#38bdf8", transparent: true, opacity: 0.7, metalness: 0.2, roughness: 0.05, transmission: 1.0, ior: 1.5, thickness: 0.1, clearcoat: 1.0 }),
    grill: new THREE.MeshStandardMaterial({ color: "#374151", metalness: 0.8, roughness: 0.2 }),
  }
};

// === 共享幾何體：所有實例共用，減少記憶體開銷 ===
const bladeSupportGeo = new THREE.BoxGeometry(0.08, 0.4, 0.08); // 扇葉根部支撐

// 螺旋網罩曲線生成器 (碗狀結構)
function createSpiralGrillGeo(radius: number, thickness: number, twistAngle: number, rimZ: number, centerZ: number, segments: number): THREE.TubeGeometry {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0.2, 0, centerZ), // 起點 (中心偏移)
    new THREE.Vector3(radius * 0.6 * Math.cos(twistAngle / 2), radius * 0.6 * Math.sin(twistAngle / 2), (centerZ + rimZ) * 0.8), // 控制點 (決定螺旋度與凸起度)
    new THREE.Vector3(radius * Math.cos(twistAngle), radius * Math.sin(twistAngle), rimZ) // 終點 (邊緣 Z 軸位置)
  );
  return new THREE.TubeGeometry(curve, Math.max(8, Math.floor(segments / 4)), thickness, 6, false);
}

// 移除全域靜態幾何體，改為在組件內動態生成
import { createBladeShape, createMotorPodPoints } from './geometries';

// === 預先計算好的網罩細線旋轉角度 ===
const backGrillSpokesCount = 24;
const frontGrillSpokesCount = 36;
const backGrillSpokes = Array.from({ length: backGrillSpokesCount }, (_, i) => (i * Math.PI * 2) / backGrillSpokesCount);
const frontGrillSpokes = Array.from({ length: frontGrillSpokesCount }, (_, i) => (i * Math.PI * 2) / frontGrillSpokesCount);
const NUM_BLADES = 7; // 扇葉數量

/**
 * GrillSpokes — 使用 InstancedMesh 批量渲染網罩細線，大幅減少 Draw Call。
 */
const BackGrill = React.memo(({ material, geometry }: { material: THREE.Material, geometry: THREE.BufferGeometry }) => {
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!meshRef.current) return;
    backGrillSpokes.forEach((rot, i) => {
      dummy.position.set(0, 0, 0.1);
      dummy.rotation.set(0, 0, rot);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy, material, geometry]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, backGrillSpokes.length]} />
  );
});
BackGrill.displayName = 'BackGrill';

const FrontGrill = React.memo(({ material, geometry }: { material: THREE.Material, geometry: THREE.BufferGeometry }) => {
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!meshRef.current) return;
    frontGrillSpokes.forEach((rot, i) => {
      dummy.position.set(0, 0, -0.1);
      dummy.rotation.set(0, 0, rot);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy, material, geometry]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, frontGrillSpokes.length]} />
  );
});
FrontGrill.displayName = 'FrontGrill';

// === 主實體組件：電風扇模型 ===
const FanModelInner: React.FC<FanProps> = ({ speed, isOscillating, natureMode = false, quality, motorType, natureFactorRef, rotationSpeedRef }) => {
  const bladeGroupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);

  const config = QUALITY_CONFIGS[quality];
  const materials = MATERIALS[config.materialType];
  const { metal, plastic, blade, grill } = materials;
  const segments = config.segments; // 根據畫質等級決定的幾何形狀細分程度

  // 根據畫質等級動態生成網罩細線幾何體
  const backSpokeGeo = useMemo(() => createSpiralGrillGeo(2.1, 0.02, Math.PI / 4, 0.1, 0.2, segments), [segments]);
  const frontSpokeGeo = useMemo(() => createSpiralGrillGeo(2.1, 0.015, -Math.PI / 3, -0.2, -0.6, segments), [segments]);

  // 根據畫質動態生成響應式幾何體 (扇葉)
  const bladeGeo = useMemo(() => {
    const shape = createBladeShape();
    const curveSegments = Math.max(2, Math.floor(segments / 8));
    const extrudeSettings = {
      depth: 1.75, // 葉片長度 (加長以填滿網罩空間)
      bevelEnabled: quality !== 'low' && quality !== 'perf',
      bevelSegments: Math.max(1, Math.floor(segments / 32)),
      steps: Math.max(2, Math.floor(segments / 16)), // 用於螺旋扭轉的細分係數
      bevelSize: 0.02,
      bevelThickness: 0.02,
      curveSegments
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.scale(0.8, 1, 1.2); // 大幅加寬扇葉，展現旗艦級份量感

    // 應用物理扭轉 (Pitch) 以模擬空氣動力學形狀
    geo.computeBoundingBox();
    if (geo.boundingBox) {
      const centerOffset = -0.5 * (geo.boundingBox.max.x - geo.boundingBox.min.x);
      const posAttribute = geo.attributes.position;
      const v = new THREE.Vector3();
      const pitchAngle = Math.PI / 4; // 增加扭轉至 45 度，提升立體動態
      const basePitch = Math.PI / 6; // 30 度的基礎攻角 (Attack Angle)

      for (let i = 0; i < posAttribute.count; i++) {
        v.fromBufferAttribute(posAttribute, i);
        v.x += centerOffset; // 將頂點移至局部中心

        // 計算標準化長度百分比 (0 到 1)
        const t = v.z / 1.75;

        // --- 有機寬度曲線 (柳葉形/花瓣形) ---
        // 寬度從根部 0.5 -> 中段 1.0 -> 末端 0.6 的正弦曲線過渡，消除方正感
        const organicWidthScale = 0.5 + Math.sin(t * Math.PI) * 0.5;
        v.x *= organicWidthScale;

        // --- 鐮刀型偏移 (Scimitar Sweep) ---
        // 隨著葉片伸長，向後方產生一個二次方曲線偏移，創造高級流線感
        const sweepOffset = Math.pow(t, 2) * 0.45;
        v.x += sweepOffset;

        // --- 葉尖圓滑化 (厚度與末端收縮) ---
        // 隨著接近葉尖，Y 軸 (厚度) 隨餘弦函數回歸零，模擬圓潤的外緣
        const tipTaperY = Math.cos(t * Math.PI * 0.5);
        v.y *= tipTaperY;

        // 計算頂點旋轉：攻角 + 隨長度增加的扭轉
        const twist = t * pitchAngle;
        const totalAngle = basePitch + twist;

        const nx = v.x * Math.cos(totalAngle) - v.y * Math.sin(totalAngle);
        const ny = v.x * Math.sin(totalAngle) + v.y * Math.cos(totalAngle);
        v.x = nx;
        v.y = ny;

        posAttribute.setXYZ(i, v.x, v.y, v.z);
      }
    }
    geo.computeVertexNormals();

    // 預轉換幾何體座標系以符合旋轉組件
    geo.rotateX(Math.PI / 2); // 將擠出方向朝外
    geo.rotateY(Math.PI / 2); // 讓葉片受風面朝前
    geo.translate(0, 0.25, 0); // 自旋軸中心偏移

    return geo;
  }, [segments, quality]);

  const bladeAngles = useMemo(() => Array.from({ length: NUM_BLADES }, (_, i) => (i * Math.PI * 2) / NUM_BLADES), []);

  // 根據畫質動態生成馬達殼 (Lathe 旋轉幾何體)
  const motorPodGeo = useMemo(() => {
    const points = createMotorPodPoints();
    const geo = new THREE.LatheGeometry(points, segments);
    geo.computeVertexNormals();
    return geo;
  }, [segments]);

  // 動態材質選擇：旋轉時使用 Phong 以提升效能，WebGPU 旗艦模式除外
  const activeBladeMaterial = (speed > 0 && quality !== 'flagship') ? MATERIALS.phong.blade : blade;

  // 物理與動畫狀態 (Ref 避免 Re-render 負擔)
  const currentRotationSpeed = useRef(0); // 當前轉速
  const oscillationAngle = useRef(0);    // 擺頭角度
  const oscillationDirection = useRef(1); // 擺頭方向
  const natureFactor = useRef(1);        // 自然風係數

  // 不同檔位的轉速映射：
  // 1 檔 (Low)：35%
  // 2 檔 (Mid)：55%
  // 3 檔 (High)：75%
  // 4 檔 (Turbo)：100% (工業模式可衝破上限至 1.5x)
  const speedArray = useMemo(() => {
    const baseSpeeds = [0, 0.35, 0.55, 0.75, 1.0];
    const multiplier = motorType === 'industrial' ? 1.5 : 0.82; // 家用模式下最高為 0.82x (原本邏輯)
    return baseSpeeds.map(s => s * multiplier);
  }, [motorType]);

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.1); // 防止分頁切換後的突發性跳躍

    // 性能優化：完全靜止時跳過計算
    if (speed === 0 && currentRotationSpeed.current < 0.001) {
      if (currentRotationSpeed.current > 0) currentRotationSpeed.current = 0;
      if (rotationSpeedRef) rotationSpeedRef.current = 0;
      return;
    }

    // 自然風模式：Perlin 雜訊調節
    if (natureMode && speed > 0) {
      natureFactor.current = getNatureFactor(state.clock.getElapsedTime());
    } else {
      natureFactor.current = 1;
    }
    natureFactorRef.current = natureFactor.current;

    const targetSpeed = speedArray[speed] * natureFactor.current;

    // 非對稱電機慣性模擬
    const isIndustrial = motorType === 'industrial';
    const accelRate = isIndustrial ? 3.0 : 1.0;
    const decelRate = isIndustrial ? 1.2 : 0.5;

    const lerpRate = targetSpeed > currentRotationSpeed.current ? safeDelta * accelRate : safeDelta * decelRate;

    currentRotationSpeed.current = THREE.MathUtils.lerp(currentRotationSpeed.current, targetSpeed, lerpRate);

    if (bladeGroupRef.current) {
      bladeGroupRef.current.rotation.z -= currentRotationSpeed.current;
    }
    if (rotationSpeedRef) {
      // 歸一化轉速以便外部 UI 或音效使用 (以工業 4 檔為 100% 基準)
      rotationSpeedRef.current = currentRotationSpeed.current / 1.5;
    }

    // 擺頭動畫計算
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
      headGroupRef.current.rotation.y = THREE.MathUtils.lerp(headGroupRef.current.rotation.y, oscillationAngle.current, safeDelta * 5);
    }
  });

  return (
    <group position={[0, -2, 0]} rotation={[0, 0, 0]}>
      {/* === 底座部分 === */}
      <group>
        {/* 分層底座盤 */}
        <Cylinder args={[1.4, 1.45, 0.15, segments]} position={[0, 0.075, 0]} material={plastic} receiveShadow={quality !== 'low'} />
        <Cylinder args={[1.2, 1.35, 0.15, segments]} position={[0, 0.225, 0]} material={plastic} receiveShadow={quality !== 'low'} />
        {/* 底座金屬裝飾環 */}
        <Torus args={[1.35, 0.02, Math.max(4, segments / 8), segments]} position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]} material={metal} />

        {/* 底座顯示區域 (Dashboard Area) */}
        <group position={[0, 0.35, -0.8]}>
          <Cylinder args={[0.55, 0.55, 0.05, segments]} position={[0, -0.05, 0]} material={plastic} />
        </group>

        {/* 支柱組件 - 位於後方 z=0.6 以對齊重心與搖頭結構 */}
        <group position={[0, 0, 0.6]}>
          <Cylinder args={[0.25, 0.3, 1.2, Math.max(8, segments / 2)]} position={[0, 0.9, 0]} material={metal} castShadow={quality !== 'low'} receiveShadow={quality !== 'low'} />
          <Cylinder args={[0.3, 0.3, 0.2, Math.max(12, segments / 2)]} position={[0, 1.6, 0]} material={plastic} />
          {/* 伸縮調節旋鈕 */}
          <Cylinder args={[0.1, 0.1, 0.3, Math.max(8, segments / 4)]} position={[0, 1.6, 0.25]} rotation={[Math.PI / 2, 0, 0]} material={plastic} />
          <Cylinder args={[0.2, 0.2, 1.2, Math.max(8, segments / 2)]} position={[0, 2.2, 0]} material={metal} castShadow={quality !== 'low'} receiveShadow={quality !== 'low'} />
        </group>
      </group>

      {/* === 風扇頭部組件 (受擺頭動畫驅動) === */}
      <group ref={headGroupRef} position={[0, 3, 0]}>

        {/* 風力粒子視覺效果 */}
        <group position={[0, 0, -1]}>
          <WindParticles speed={speed} active={speed > 0} natureFactorRef={natureFactorRef} quality={quality} />
        </group>

        {/* 馬達外殼 (流線型子彈頭) */}
        <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.6]}>
          <mesh geometry={motorPodGeo} material={plastic} castShadow={quality !== 'low'} position={[0, 0, 0]} />
          {/* 馬達後方散熱孔槽 */}
          <group position={[0, -0.4, 0]}>
            <Torus args={[0.39, 0.015, Math.max(4, segments / 8), segments]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={grill} />
            <Torus args={[0.36, 0.015, Math.max(4, segments / 8), segments]} position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]} material={grill} />
            <Torus args={[0.3, 0.015, Math.max(4, segments / 8), segments]} position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={grill} />
          </group>
        </group>

        {/* 搖頭關節結構 (Swivel Hinge) */}
        <group position={[0, -0.4, 0.45]}>
          <Cylinder args={[0.3, 0.3, 0.6, Math.max(12, segments / 2)]} rotation={[0, 0, Math.PI / 2]} material={plastic} />
          <Cylinder args={[0.32, 0.32, 0.1, Math.max(12, segments / 2)]} rotation={[0, 0, Math.PI / 2]} position={[0.3, 0, 0]} material={metal} />
          <Cylinder args={[0.32, 0.32, 0.1, Math.max(12, segments / 2)]} rotation={[0, 0, Math.PI / 2]} position={[-0.3, 0, 0]} material={metal} />
        </group>

        {/* 風扇籠與扇葉容器 */}
        <group position={[0, 0, -0.2]}>

          {/* 網罩中框 (連接前後網罩) */}
          <Cylinder args={[2.14, 2.14, 0.4, segments, 1, true]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.05]} material={plastic} />

          {/* 後方螺旋網罩 */}
          <BackGrill material={grill} geometry={backSpokeGeo} />
          <Torus args={[2.14, 0.05, Math.max(6, segments / 4), segments]} position={[0, 0, 0.1]} material={grill} />
          <Torus args={[1.2, 0.02, 4, segments]} position={[0, 0, 0.15]} material={grill} /> {/* 後網加強圈 */}

          {/* 旋轉葉片組 */}
          <group ref={bladeGroupRef} position={[0, 0, -0.05]}>
            {/* 中央轉軸 */}
            <Cylinder args={[0.35, 0.35, 0.45, Math.max(12, segments / 2)]} rotation={[Math.PI / 2, 0, 0]} material={metal} />
            {/* 轉軸頂蓋 - 平滑過渡 */}
            <Sphere args={[0.36, segments, segments / 2]} position={[0, 0, -0.2]} material={metal} />

            {/* 扇葉渲染 - 使用 Instanced 概念共享幾何體 */}
            {bladeAngles.map((angle, i) => (
              <group key={i} rotation={[0, 0, angle]}>
                <mesh geometry={bladeGeo} material={activeBladeMaterial} castShadow={false} />
                {/* 葉片根部物理支撐 */}
                <mesh position={[0, 0.15, 0]} geometry={bladeSupportGeo} material={metal} castShadow={false} />
              </group>
            ))}
          </group>

          {/* 前方網罩中心 Logo 區域 */}
          <group position={[0, 0, -0.7]}>
            <Cylinder args={[0.5, 0.5, 0.15, Math.max(16, segments / 2)]} rotation={[Math.PI / 2, 0, 0]} material={plastic} />
            <Cylinder args={[0.45, 0.45, 0.16, Math.max(16, segments / 2)]} rotation={[Math.PI / 2, 0, 0]} material={metal} />
            {/* 3D 浮雕 Logo (BREEZE) */}
            <Center position={[0, 0, -0.09]} scale={0.2} rotation={[0, Math.PI, 0]}>
              <Text3D
                font="/fonts/helvetiker_bold.typeface.json"
                size={0.8}
                height={0.2}
                curveSegments={Math.max(2, segments / 16)}
                bevelEnabled={quality !== 'low'}
                bevelSize={0.02}
                bevelThickness={0.02}
              >
                BREEZE
                <meshStandardMaterial color="#38bdf8" metalness={0.8} roughness={0.2} />
              </Text3D>
            </Center>
          </group>

          {/* 前方螺旋網罩外框 (三層結構) */}
          <Torus args={[2.14, 0.06, Math.max(6, segments / 4), segments]} position={[0, 0, -0.2]} material={grill} />
          <Torus args={[2.18, 0.04, Math.max(6, segments / 4), segments]} position={[0, 0, -0.22]} material={grill} />
          <Torus args={[2.22, 0.02, Math.max(6, segments / 4), segments]} position={[0, 0, -0.24]} material={grill} />
          <Torus args={[1.2, 0.02, 4, segments]} position={[0, 0, -0.3]} material={grill} /> {/* 前網加強圈 */}

          {/* 前方螺旋網罩細線 */}
          <FrontGrill material={grill} geometry={frontSpokeGeo} />

        </group>
      </group>
    </group>
  );
};

export const FanModel = React.memo(FanModelInner);
