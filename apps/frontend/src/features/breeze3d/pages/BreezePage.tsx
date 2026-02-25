
import React, { useState, Suspense, useEffect, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, PerspectiveCamera, AdaptiveDpr } from '@react-three/drei';
import { FanModel } from '@/features/breeze3d/components/FanModel';
import { Controls } from '@/features/breeze3d/components/Controls';
import { FanAudio } from '@/features/breeze3d/components/FanAudio';
import { FanSpeed } from '@/features/breeze3d/types';
import type { NatureFactorRef } from '@/features/breeze3d/types';
import { WaveformMonitor } from '@/features/breeze3d/components/WaveformMonitor';
import { Info, Activity } from 'lucide-react';
import { toast } from 'sonner';

const App: React.FC = () => {
  const [speed, setSpeed] = useState<FanSpeed>(0);
  const [isOscillating, setIsOscillating] = useState<boolean>(false);
  const [natureMode, setNatureMode] = useState<boolean>(false);
  const [timerLeft, setTimerLeft] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showWaveform, setShowWaveform] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const natureFactorRef = useMemo<NatureFactorRef>(() => ({ current: 1 }), []);
  const rotationSpeedRef = useMemo<NatureFactorRef>(() => ({ current: 0 }), []);

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
      toast.success(`定時器已設定：${seconds} 秒後關閉`);
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
      <Canvas shadows dpr={[1, 1.5]} className="z-10" performance={{ min: 0.5 }}>
        <AdaptiveDpr pixelated />
        <PerspectiveCamera makeDefault position={[0, 1, 8]} fov={50} />

        {/* Environment & Lighting (simplified: removed pointLight) */}
        <ambientLight intensity={0.5} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
          shadow-mapSize={512}
        />
        <Environment preset="city" />

        {/* The Fan */}
        <Suspense fallback={null}>
          <FanModel
            speed={speed}
            isOscillating={isOscillating}
            natureMode={natureMode}
            natureFactorRef={natureFactorRef}
            rotationSpeedRef={rotationSpeedRef}
          />
        </Suspense>

        {/* Floor Shadow */}
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} color="#000000" resolution={256} />

        {/* Camera Controls */}
        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          minDistance={4}
          maxDistance={12}
        />
      </Canvas>

      {/* Top Left Branding */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-20">
        <h1 className="text-lg sm:text-2xl font-black text-white tracking-tighter italic">
          BREEZE<span className="text-blue-500">MASTER</span>
        </h1>
        <p className="text-gray-400 text-[10px] sm:text-xs font-medium tracking-widest mt-0.5 sm:mt-1 hidden sm:block">3D 立體風扇模擬</p>
      </div>

      {/* Timer Indicator */}
      {timerLeft !== null && (
        <div className="absolute top-3 sm:top-6 left-1/2 -translate-x-1/2 z-20 bg-blue-600/20 backdrop-blur-md border border-blue-500/30 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full flex items-center gap-1.5 sm:gap-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-blue-400 text-[10px] sm:text-xs font-bold font-mono">{timerLeft}s</span>
        </div>
      )}

      {/* Help & Waveform Buttons */}
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20 flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => setShowWaveform(!showWaveform)}
          className={`p-1.5 sm:p-2 transition-colors rounded-full ${showWaveform
            ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/30'
            : 'text-white/50 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
        >
          <Activity size={16} className="sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-1.5 sm:p-2 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
        >
          <Info size={16} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      {showHelp && (
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
      )}

      {/* Waveform Monitor */}
      <WaveformMonitor
        natureFactorRef={natureFactorRef}
        rotationSpeedRef={rotationSpeedRef}
        speed={speed}
        natureMode={natureMode}
        visible={showWaveform}
      />

      {/* UI Controls */}
      <Controls
        speed={speed}
        isOscillating={isOscillating}
        natureMode={natureMode}
        timerLeft={timerLeft}
        onSpeedChange={setSpeed}
        onOscillationToggle={() => setIsOscillating(!isOscillating)}
        onNatureModeToggle={() => setNatureMode(!natureMode)}
        onSetTimer={handleSetTimer}
      />
    </div>
  );
};

export default App;
