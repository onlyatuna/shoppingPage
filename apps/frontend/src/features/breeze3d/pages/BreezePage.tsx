
import React, { useState, Suspense, useEffect, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, PerspectiveCamera, AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';
import { FanModel } from '@/features/breeze3d/components/FanModel';
import { FanDashboard } from '@/features/breeze3d/components/FanDashboard';
import { FanAudio } from '@/features/breeze3d/components/FanAudio';
import { FanSpeed, QualityLevel, QUALITY_CONFIGS, MotorType, RenderEngine, NatureFactorRef } from '@/features/breeze3d/types';
import { WaveformMonitor } from '@/features/breeze3d/components/WaveformMonitor';
import { Info, Activity, Settings, Zap, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import { getSmartStrategy } from '../engineDetection';

const App: React.FC = () => {
  const [speed, setSpeed] = useState<FanSpeed>(0);
  const [isOscillating, setIsOscillating] = useState<boolean>(false);
  const [natureMode, setNatureMode] = useState<boolean>(false);
  const [timerLeft, setTimerLeft] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showWaveform, setShowWaveform] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState<QualityLevel>('high');
  const [motorType, setMotorType] = useState<MotorType>('home');
  const [engine, setEngine] = useState<RenderEngine>('detecting');
  const [engineReason, setEngineReason] = useState<string>('');
  const [isAuto, setIsAuto] = useState<boolean>(true);
  const [availableWebGPU, setAvailableWebGPU] = useState<boolean>(false);
  const [rendererInstance, setRendererInstance] = useState<any>(null);
  const [isWebGPUInitialized, setIsWebGPUInitialized] = useState<boolean>(false);
  const [displayOverride, setDisplayOverride] = useState<string | null>(null);
  const isReadyRef = useRef(false);

  // Sync ref with state for use in the gl factory closure
  useEffect(() => {
    isReadyRef.current = isWebGPUInitialized;
  }, [isWebGPUInitialized]);

  const config = QUALITY_CONFIGS[quality];

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const natureFactorRef = useMemo<NatureFactorRef>(() => ({ current: 1 }), []);
  const rotationSpeedRef = useMemo<NatureFactorRef>(() => ({ current: 0 }), []);

  // Smart Engine Detection
  useEffect(() => {
    const initEngine = async () => {
      const strategy = await getSmartStrategy();

      // Load and initialize renderer
      if (strategy.engine === 'webgpu') {
        try {
          const { WebGPURenderer } = await import('three/webgpu');
          // Create an offscreen canvas for initialization if need be, 
          // or just wait for Canvas to provide one. 
          // Actually, we can just return the class and handle it in the gl callback.
          // But to be 100% sure we wait for init, let's try a different approach.
          setRendererInstance(() => WebGPURenderer);
        } catch (e) {
          console.error("Failed to load WebGPURenderer, falling back to WebGL", e);
          strategy.engine = 'webgl';
          strategy.reason = "WebGPU 資源加載失敗，已切換至穩定模式。";
        }
      }

      setEngine(strategy.engine);
      setQuality(strategy.defaultQuality);
      setEngineReason(strategy.reason);
      setAvailableWebGPU(strategy.hasWebGPU);

      // Notify user of the smart optimization
      setTimeout(() => {
        toast(`智慧引擎：${strategy.engine.toUpperCase()} 模式`, {
          description: strategy.reason,
          icon: <Cpu size={16} className="text-blue-400" />,
          duration: 5000,
        });

        // If WebGPU is available but not selected (score low), remind user they can try manual override
        if (strategy.hasWebGPU && strategy.engine === 'webgl') {
          setTimeout(() => {
            toast.info("檢測到環境支援 WebGPU (實驗性)", {
              description: "您可以嘗試在設定中手動切換至極致模式以釋放完整效能。",
              duration: 8000,
            });
          }, 2000);
        }
      }, 1000);
    };
    initEngine();
  }, []);

  // Reset initialization state when engine changes
  useEffect(() => {
    setIsWebGPUInitialized(false);
  }, [engine]);

  // Timer logic
  useEffect(() => {
    if (timerLeft !== null && timerLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimerLeft(prev => {
          if (prev !== null && prev > 0) return prev - 1;
          return 0;
        });
      }, 1000); // Update every second
    } else if (timerLeft === 0) {
      setSpeed(0);
      setTimerLeft(null);
      toast.info("定時關閉：已進入待機模式");
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerLeft]);

  const handleSetTimer = (seconds: number | null) => {
    setTimerLeft(seconds);
    if (seconds) {
      setDisplayOverride(Math.ceil(seconds / 60).toString());
      setTimeout(() => setDisplayOverride(null), 2000);
      toast.success(`定時器已設定：${Math.ceil(seconds / 60)} 分鐘後關閉`);
    } else {
      toast.info("定時器已取消");
    }
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden selection:bg-blue-500 selection:text-white">
      <FanAudio speed={speed} rotationSpeedRef={rotationSpeedRef} />

      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-950 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent pointer-events-none" />

      {/* 3D Scene */}
      {engine === 'detecting' ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
          <p className="text-white font-mono text-xs tracking-widest animate-pulse">正在優化硬體加速環境 (Checking Capabilities...)</p>
        </div>
      ) : (
        <Canvas
          key={engine} // Key 變動觸發引擎物理切換 (WebGPU 與 WebGL 無法共存於同畫布)
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'block'
          }}
          gl={(props) => {
            const canvas = props.canvas;
            if (engine === 'webgpu' && rendererInstance) {
              const renderer = new rendererInstance({ canvas, antialias: true });

              const originalRender = renderer.render.bind(renderer);
              renderer.render = (scene: any, camera: any) => {
                if (isReadyRef.current) {
                  originalRender(scene, camera);
                }
              };

              renderer.init().then(() => {
                console.log("WebGPU Backend Initialized");
                requestAnimationFrame(() => {
                  setIsWebGPUInitialized(true);
                });
              }).catch((e: any) => {
                console.error("WebGPU Init Error:", e);
              });

              return renderer;
            }

            return new THREE.WebGLRenderer({
              canvas,
              antialias: true,
              powerPreference: 'high-performance',
              alpha: false,
              stencil: false
            });
          }}
          shadows={quality !== 'low' ? { type: THREE.PCFSoftShadowMap } : undefined}
          dpr={config.dpr}
          onCreated={({ gl }) => {
            if (engine === 'webgl') {
              setIsWebGPUInitialized(true);
            }
            if (!gl.domElement && (gl as any).canvas) {
              (gl as any).domElement = (gl as any).canvas;
            }
          }}
        >
          <Suspense fallback={null}>
            <SceneContent
              engine={engine}
              speed={speed}
              isOscillating={isOscillating}
              natureMode={natureMode}
              quality={quality}
              motorType={motorType}
              natureFactorRef={natureFactorRef}
              rotationSpeedRef={rotationSpeedRef}
              config={config}
              isWebGPUInitialized={isWebGPUInitialized}
              currentQualityState={quality}
              setQuality={setQuality}
              setEngine={setEngine}
              setIsAuto={setIsAuto}
            />
          </Suspense>
          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
            minDistance={4}
            maxDistance={12}
          />
        </Canvas>
      )}

      {/* Top Left Branding */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-20">
        <h1 className="text-lg sm:text-2xl font-black text-white tracking-tighter italic">
          BREEZE<span className="text-blue-500">MASTER</span>
        </h1>
        <p className="text-gray-400 text-[10px] sm:text-xs font-medium tracking-widest mt-0.5 sm:mt-1 hidden sm:block">3D 立體風扇模擬</p>
      </div>

      {/* Help & Settings Buttons */}
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20 flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => { setShowWaveform(!showWaveform); setShowSettings(false); setShowHelp(false); }}
          className={`p-1.5 sm:p-2 transition-colors rounded-full ${showWaveform
            ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/30'
            : 'text-white/50 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
        >
          <Activity size={16} className="sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={() => { setShowSettings(!showSettings); setShowHelp(false); setShowWaveform(false); }}
          className={`p-1.5 sm:p-2 transition-colors rounded-full ${showSettings
            ? 'text-white bg-white/20 border border-white/30'
            : 'text-white/50 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
        >
          <Settings size={16} className="sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={() => { setShowHelp(!showHelp); setShowSettings(false); setShowWaveform(false); }}
          className={`p-1.5 sm:p-2 transition-colors rounded-full ${showHelp
            ? 'text-white bg-white/20 border border-white/30'
            : 'text-white/50 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
        >
          <Info size={16} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      {
        showHelp && (
          <div className="absolute top-12 right-3 sm:top-20 sm:right-6 z-20 w-48 sm:w-64 bg-black/80 backdrop-blur-md p-2.5 sm:p-4 rounded-xl border border-white/10 text-[11px] sm:text-sm text-gray-300 shadow-xl animate-in fade-in slide-in-from-top-2">
            <p className="mb-1.5 sm:mb-2"><strong className="text-white">操作說明：</strong></p>
            <ul className="list-disc pl-3 sm:pl-4 space-y-0.5 sm:space-y-1">
              <li>拖曳旋轉視角</li>
              <li>滾輪縮放</li>
              <li>下方按鈕調整風速</li>
              <li>擺頭控制轉向</li>
              <li>自然風隨機變速</li>
              <li>定時自動關機</li>
            </ul>
          </div>
        )
      }

      {/* Settings Panel */}
      {
        showSettings && (
          <div className="absolute top-12 right-3 sm:top-20 sm:right-6 z-20 w-56 sm:w-72 bg-black/80 backdrop-blur-md p-3 sm:p-5 rounded-xl border border-white/10 shadow-xl animate-in fade-in slide-in-from-top-2">
            <p className="mb-3 text-[11px] sm:text-sm font-bold text-white flex items-center gap-2">
              <Settings size={14} /> 畫質設定
            </p>

            <div className="flex bg-white/5 rounded-lg p-1 mb-3">
              {(['low', 'perf', 'med', 'high', 'flagship'] as QualityLevel[]).map((q) => {
                const isFlagshipWebGL = q === 'flagship' && engine === 'webgl';
                return (
                  <button
                    key={q}
                    onClick={() => {
                      if (isFlagshipWebGL) {
                        toast.warning("此環境下開啟旗艦模式可能會掉幀，建議切換至支援 WebGPU 的瀏覽器！");
                      }
                      setQuality(q);
                      setIsAuto(false);
                      // Auto-switch engine if quality implies it and WebGPU is available
                      if (availableWebGPU) {
                        const preferred = QUALITY_CONFIGS[q].enginePreferred;
                        if (preferred !== engine) {
                          setEngine(preferred);
                          setEngineReason(preferred === 'webgpu' ? '手動切換至高效能加速' : '手動切換至穩定相容');
                        }
                      }
                    }}
                    className={`flex-1 py-1.5 px-0.5 text-[10px] sm:text-[11px] font-medium rounded-md transition-all ${quality === q
                      ? 'bg-blue-500 text-white shadow-md'
                      : isFlagshipWebGL
                        ? 'text-yellow-500/50 hover:text-yellow-400 hover:bg-white/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    {q === 'low' && '低'}
                    {q === 'perf' && '競速'}
                    {q === 'med' && '大眾'}
                    {q === 'high' && '高級'}
                    {q === 'flagship' && '旗艦'}
                  </button>
                )
              })}
            </div>

            <div className="text-[10px] sm:text-[11px] text-gray-400 leading-relaxed bg-black/40 p-2.5 rounded border border-white/5">
              {quality === 'low' && '⚡ 省電極簡 (Low): 關閉所有物理光影與後製。'}
              {quality === 'perf' && '🏎️ 效能競速 (Perf+): 最低延遲、精簡材質，壓榨高幀數。'}
              {quality === 'med' && '穩定標準 (Medium): 平衡畫質，高相容性，適合大多數配置。'}
              {quality === 'high' && '✨ 黃金平衡 (High-Opt): 強化材質與陰影，60FPS 視網膜甜點。'}
              {quality === 'flagship' && '🔥 頂級旗艦 (Flagship): 究極透光材質與物理粒子叢集，強力 GPU 限定。'}
            </div>

            <p className="mt-4 mb-3 text-[11px] sm:text-sm font-bold text-white flex items-center gap-2">
              <Zap size={14} /> 馬達模式
            </p>

            <div className="flex bg-white/5 rounded-lg p-1 mb-3">
              {(['home', 'industrial'] as MotorType[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMotorType(m)}
                  className={`flex-1 py-1 px-1 text-[9px] sm:text-xs font-medium rounded-md transition-all ${motorType === m
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {m === 'home' && '家用 (悠閒)'}
                  {m === 'industrial' && '工業風 (狂暴)'}
                </button>
              ))}
            </div>

            <div className="text-[10px] sm:text-xs text-gray-400 leading-relaxed bg-black/40 p-2.5 rounded border border-white/5">
              {motorType === 'home' && '🛋️ 啟動平緩，關機滑行時間長。'}
              {motorType === 'industrial' && '🏭 強大扭力直接爆發，加速極快。'}
            </div>

            <p className="mt-4 mb-2 text-[11px] sm:text-sm font-bold text-white flex items-center gap-2">
              <Cpu size={14} /> 運算核心
            </p>
            <div className="flex items-center justify-between bg-white/5 p-2.5 rounded border border-white/5">
              <span className="text-[10px] sm:text-xs text-blue-400 font-mono font-bold uppercase flex items-center gap-1.5">
                <Cpu size={12} /> {engine} {engine === 'webgpu' && <span className="text-[9px] text-green-400 bg-green-400/20 px-1 rounded ml-1 animate-pulse">Turbo</span>}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${isAuto ? 'text-green-400/80 bg-green-400/10' : 'text-amber-400/80 bg-amber-400/10'} italic`}>
                {isAuto ? 'Auto-Detected' : 'Manual Override'}
              </span>
            </div>
            <p className="mt-1.5 text-[9px] text-gray-500 leading-tight px-1 italic">
              {engineReason}
            </p>
          </div>
        )
      }

      {/* Waveform Monitor */}
      <WaveformMonitor
        natureFactorRef={natureFactorRef}
        rotationSpeedRef={rotationSpeedRef}
        speed={speed}
        natureMode={natureMode}
        visible={showWaveform}
      />

      {/* NEW UI Dashboard */}
      <div className="absolute bottom-4 sm:bottom-0 left-1/2 -translate-x-1/2 z-20 w-full flex justify-center">
        <FanDashboard
          power={speed > 0}
          speed={speed}
          natureMode={natureMode}
          isOscillating={isOscillating}
          timerMinutes={timerLeft !== null ? Math.ceil(timerLeft / 60) : null}
          displayOverride={displayOverride}
          onPowerToggle={() => {
            if (speed > 0) {
              setSpeed(0);
              setNatureMode(false);
            } else {
              setSpeed(1); // Default to 1
            }
          }}
          onSpeedCycle={() => {
            if (speed === 0) setSpeed(1);
            else if (speed === 4) setSpeed(1);
            else setSpeed((speed + 1) as FanSpeed);
            setNatureMode(false);
          }}
          onNatureToggle={() => {
            if (!natureMode) {
              setNatureMode(true);
              if (speed === 0) setSpeed(1);
            } else {
              setNatureMode(false);
            }
          }}
          onTimerCycle={() => {
            const options = [null, 1800, 3600, 7200]; // 0, 30m, 60m, 120m
            const currentIndex = options.indexOf(timerLeft);
            const nextIndex = (currentIndex + 1) % options.length;
            handleSetTimer(options[nextIndex]);
          }}
          onOscillationToggle={() => setIsOscillating(!isOscillating)}
        />
      </div>
    </div >
  );
};

/**
 * SceneContent handles the actual rendering of 3D elements.
 * It is guarded by isWebGPUInitialized to ensure the renderer backend is ready.
 */
const SceneContent: React.FC<any> = ({
  speed, isOscillating, natureMode, quality, motorType, natureFactorRef, rotationSpeedRef, config, isWebGPUInitialized, currentQualityState, setQuality, setEngine, setIsAuto
}) => {
  // Guard against rendering before WebGPU is ready
  if (!isWebGPUInitialized) return null;

  return (
    <>
      {currentQualityState !== 'perf' && currentQualityState !== 'low' && (
        <FpsMonitor onLowFps={() => {
          toast("偵測到效能下降，建議切換至競速模式以提高幀數！", {
            action: {
              label: "切換",
              onClick: () => { setQuality('perf'); setEngine('webgl'); setIsAuto(false); }
            },
            duration: 8000
          });
        }} />
      )}
      <AdaptiveDpr pixelated />
      <PerspectiveCamera makeDefault position={[0, 1, 8]} fov={50} />

      {/* Environment & Lighting */}
      <ambientLight intensity={0.5} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        intensity={1.5}
        castShadow={quality !== 'low'}
        shadow-mapSize={config.shadowMapSize}
      />
      {quality !== 'low' && <Environment files="/hdri/potsdamer_platz_1k.hdr" preset="city" />}

      {/* The Fan */}
      <FanModel
        speed={speed}
        isOscillating={isOscillating}
        natureMode={natureMode}
        quality={quality}
        motorType={motorType}
        natureFactorRef={natureFactorRef}
        rotationSpeedRef={rotationSpeedRef}
      />

      {/* Floor Shadow */}
      {quality !== 'low' && (
        <ContactShadows
          position={[0, -2, 0]}
          opacity={0.4}
          scale={10}
          blur={5.5}
          far={4}
          color="#000000"
          resolution={quality === 'perf' ? 64 : 128}
        />
      )}
    </>
  );
};

// --- FPS Monitor Component ---
import { useFrame } from '@react-three/fiber';

const FpsMonitor: React.FC<{ onLowFps: () => void }> = ({ onLowFps }) => {
  const lowFpsCount = useRef(0);
  const lastTime = useRef(performance.now());
  const frames = useRef(0);

  useFrame(() => {
    frames.current++;
    const now = performance.now();
    if (now - lastTime.current >= 1000) {
      if (frames.current < 30) {
        lowFpsCount.current++;
        if (lowFpsCount.current >= 5) {
          onLowFps();
          lowFpsCount.current = 0;
        }
      } else {
        lowFpsCount.current = 0;
      }
      frames.current = 0;
      lastTime.current = now;
    }
  });
  return null;
};

export default App;
