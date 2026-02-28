import * as THREE from 'three';

// 1. 扇葉橫切面 (翼型/水滴形狀)
export function createBladeShape(): THREE.Shape {
  const shape = new THREE.Shape();
  // 典型的翼型形狀，縮放以符合扇葉邊界 (~0.45 寬 x 1.75 長)
  // 我們以 1 單位寬度繪製橫切面，後續由 scale 處理精確尺寸。
  // 使用指向右側 (X+) 的簡化水滴形。

  shape.moveTo(0, 0);
  // 非對稱上曲線：進氣邊 (Leading Edge) 較圓且峰值靠前，排氣邊 (Trailing Edge) 較尖且平緩
  shape.bezierCurveTo(0.1, 0.25, 0.3, 0.25, 1.0, 0);
  // 下曲線：微凹的翼底設計，增進物理真實感
  shape.bezierCurveTo(0.6, -0.05, 0.2, -0.05, 0, 0);

  return shape;
}

// 2. 電機外殼 (工業風倒角圓柱體 / 倒角與分件線設計)
export function createMotorPodPoints(): THREE.Vector2[] {
  const points: THREE.Vector2[] = [];
  // 繞 Y 軸旋轉。Vector2(x, y) 數組，其中 x 是半徑，y 是高度/深度
  // 設計構思：倒角圓柱體能產生精緻的高光帶，並透過「分件線」增加機械構造質感。

  // --- 後蓋部 (Tail Section) ---
  points.push(new THREE.Vector2(0, -0.7));      // 1. 尾端中心點 (封閉)
  points.push(new THREE.Vector2(0.6, -0.7));    // 2. 尾平面的邊緣
  points.push(new THREE.Vector2(0.7, -0.6));    // 3. 尾部倒角轉折點

  // --- 關鍵細節：分件線 (Parting Line) ---
  // 在倒角與主體交界處設計一個 0.02 單位的極小凹槽，模擬外殼組裝縫隙
  points.push(new THREE.Vector2(0.68, -0.58));  // 凹槽進
  points.push(new THREE.Vector2(0.7, -0.56));   // 凹槽回

  // --- 主側面 (Main Cylinder Body) ---
  points.push(new THREE.Vector2(0.7, 0.6));     // 4. 側面垂直延伸至前段

  // --- 前蓋部 (Front Nose Section) ---
  points.push(new THREE.Vector2(0.6, 0.7));     // 5. 前部倒角轉折點
  points.push(new THREE.Vector2(0, 0.7));       // 6. 前端中心點 (封閉)

  return points;
}
