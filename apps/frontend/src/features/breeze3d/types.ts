export type FanSpeed = 0 | 1 | 2 | 3 | 4; // 風扇檔位

export type QualityLevel = 'low' | 'perf' | 'med' | 'high' | 'flagship'; // 畫質等級

export type MotorType = 'home' | 'industrial'; // 電機類型 (家用 / 工業)
export type RenderEngine = 'webgpu' | 'webgl' | 'detecting'; // 渲染引擎狀態

// 畫質配置表：定義不同畫質下的渲染參數
export const QUALITY_CONFIGS = {
  low: {
    dpr: 0.5,            // 像素縮放比 (Device Pixel Ratio)
    shadowMapSize: 0,    // 陰影貼圖大小 (0 表示關閉)
    materialType: 'basic', // 材質類型 (基礎)
    segments: 16,        // 幾何細分度
    particles: 0,        // 風力粒子數量
    enginePreferred: 'webgl' // 首選引擎
  },
  perf: {
    dpr: 0.9,
    shadowMapSize: 256,
    materialType: 'phong', // 材質類型 (Phong 反光)
    segments: 32,
    particles: 40,
    enginePreferred: 'webgl'
  },
  med: {
    dpr: 1.0,
    shadowMapSize: 512,
    materialType: 'standard', // 材質類型 (標準 PBR)
    segments: 48,
    particles: 50,
    enginePreferred: 'webgl'
  },
  high: {
    dpr: 1.25,
    shadowMapSize: 1024,
    materialType: 'standard_high', // 材質類型 (加強版標準)
    segments: 80,
    particles: 80,
    enginePreferred: 'webgpu'
  },
  flagship: {
    dpr: 1.5,
    shadowMapSize: 2048,
    materialType: 'physical', // 材質類型 (頂級物理渲染)
    segments: 128,
    particles: 120,
    enginePreferred: 'webgpu'
  }
} as const;

/**
 * 共享的自然風係數 Ref (0–1)。
 * FanModel 每幀寫入此值，WindParticles 與 FanAudio 負責讀取，以實現步同步效果。
 */
export type NatureFactorRef = { current: number };

export interface FanState {
  speed: FanSpeed;
  isOscillating: boolean; // 是否擺頭
  power: boolean;        // 電源開關
  natureMode: boolean;   // 是否開啟自然風模式
  timerMinutes: number | null; // 定時器分鍾數
}

export interface FanProps {
  speed: FanSpeed;
  isOscillating: boolean;
  natureMode?: boolean;
  quality: QualityLevel;
  motorType: MotorType;
  natureFactorRef: NatureFactorRef;
  rotationSpeedRef?: NatureFactorRef; // 用於波形顯示的實時轉速 Ref
}
