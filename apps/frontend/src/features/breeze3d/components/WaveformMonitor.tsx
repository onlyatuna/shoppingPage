import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { NatureFactorRef } from '@/features/breeze3d/types';

interface WaveformMonitorProps {
    natureFactorRef: NatureFactorRef;
    rotationSpeedRef: NatureFactorRef;
    speed: number;
    natureMode: boolean;
    visible: boolean;
}

/**
 * Optimized real-time waveform monitor.
 * Fixed "Context Lost" issues by:
 * 1. Removing per-frame Canvas Gradient creation (the GPU killer).
 * 2. Throttling update rate to 30fps.
 * 3. Proper lifecycle cleanup.
 */
export const WaveformMonitor: React.FC<WaveformMonitorProps> = ({
    natureFactorRef,
    rotationSpeedRef,
    speed,
    natureMode,
    visible,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const factorBuf = useRef<number[]>([]);
    const rpmBuf = useRef<number[]>([]);
    const rafRef = useRef<number | null>(null);
    const lastDrawTime = useRef<number>(0);

    // FPS State
    const [fps, setFps] = useState<number>(60);
    const fpsTracker = useRef({ frames: 0, lastTime: 0 });

    useEffect(() => {
        if (!visible) return;
        fpsTracker.current = { frames: 0, lastTime: performance.now() };
        let fpsRaf: number;

        const loop = () => {
            const now = performance.now();
            fpsTracker.current.frames++;

            if (now - fpsTracker.current.lastTime >= 500) {
                setFps(Math.round((fpsTracker.current.frames * 1000) / (now - fpsTracker.current.lastTime)));
                fpsTracker.current.frames = 0;
                fpsTracker.current.lastTime = now;
            }
            fpsRaf = requestAnimationFrame(loop);
        };

        fpsRaf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(fpsRaf);
    }, [visible]);

    // Constants (responsive)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const BUFFER = isMobile ? 80 : 200; // Further reduced for CPU
    const W = isMobile ? 260 : 420;
    const H = isMobile ? 70 : 130;
    const PAD_L = isMobile ? 18 : 26;

    const draw = useCallback((timestamp: number) => {
        // 30fps Throttle: (1000ms / 30fps) ≈ 33ms
        if (timestamp - lastDrawTime.current < 33) {
            rafRef.current = requestAnimationFrame(draw);
            return;
        }
        lastDrawTime.current = timestamp;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false }); // Optimization: opaque canvas
        if (!ctx) return;

        // 1. Data Sampling (Always push to keep the waves moving)
        factorBuf.current.push(natureFactorRef.current);
        rpmBuf.current.push(rotationSpeedRef.current);
        if (factorBuf.current.length > BUFFER) factorBuf.current.shift();
        if (rpmBuf.current.length > BUFFER) rpmBuf.current.shift();

        // 2. Clear Scene
        ctx.fillStyle = '#111827'; // Tailwind gray-900 (matches background)
        ctx.fillRect(0, 0, W, H);

        // 3. Draw Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const y = (H / 4) * i;
            ctx.beginPath();
            ctx.moveTo(PAD_L, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Y Axis Labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = isMobile ? '7px monospace' : '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('1.0', 2, 8);
        ctx.fillText('0.5', 2, H / 2 + 3);
        ctx.fillText('0', 2, H - 3);

        const drawW = W - PAD_L;
        const stepX = drawW / (BUFFER - 1);

        // 4. Helper: Draw Line (Optimized: No gradients)
        const drawLine = (buf: number[], color: string, lineWidth: number) => {
            if (buf.length < 2) return;
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            for (let i = 0; i < buf.length; i++) {
                const x = PAD_L + i * stepX;
                const y = H - buf[i] * (H - 10) - 5;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        };

        // Nature Factor (Cyan)
        drawLine(factorBuf.current, '#22d3ee', isMobile ? 1.5 : 2);
        // RPM (Amber)
        drawLine(rpmBuf.current, '#fbbf24', isMobile ? 1 : 1.5);

        // 5. Head Point Decor
        if (factorBuf.current.length > 0) {
            const fVal = factorBuf.current[factorBuf.current.length - 1];
            const rVal = rpmBuf.current[rpmBuf.current.length - 1];
            const dotX = PAD_L + (factorBuf.current.length - 1) * stepX;

            // Cyan Dot
            ctx.fillStyle = '#22d3ee';
            ctx.beginPath();
            ctx.arc(dotX, H - fVal * (H - 10) - 5, isMobile ? 1.5 : 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Amber Dot
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(dotX, H - rVal * (H - 10) - 5, isMobile ? 1.5 : 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Current values in corner
            ctx.font = `bold ${isMobile ? 8 : 10}px monospace`;
            ctx.textAlign = 'right';
            ctx.fillStyle = '#22d3ee';
            ctx.fillText(fVal.toFixed(2), W - 5, isMobile ? 10 : 14);
            ctx.fillStyle = '#fbbf24';
            ctx.fillText(rVal.toFixed(2), W - 5, isMobile ? 20 : 28);
        }

        rafRef.current = requestAnimationFrame(draw);
    }, [natureFactorRef, rotationSpeedRef, isMobile, BUFFER, W, H, PAD_L]);

    useEffect(() => {
        if (visible) {
            const canvas = canvasRef.current;
            if (canvas) {
                const dpr = window.devicePixelRatio || 1;
                canvas.width = W * dpr;
                canvas.height = H * dpr;
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.scale(dpr, dpr);
            }
            factorBuf.current = [];
            rpmBuf.current = [];
            rafRef.current = requestAnimationFrame(draw);
        }

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [visible, draw, W, H]);

    if (!visible) return null;

    const modeLabel = speed === 0
        ? '待機'
        : natureMode
            ? isMobile ? '自然風' : '自然風 · Perlin'
            : isMobile ? '恆定' : '恆定 · Constant';

    return (
        <div className={`absolute z-50 animate-in fade-in duration-300 ${isMobile
            ? 'top-14 left-1/2 -translate-x-1/2'
            : 'bottom-44 right-6'
            }`}>
            <div className={`${isMobile ? 'p-1.5' : 'p-3'
                } bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-1 px-1">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${speed > 0 ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'
                            }`} />
                        <span className="text-[9px] font-bold text-white/70 tracking-tight uppercase">
                            {modeLabel}
                        </span>
                    </div>
                    {/* FPS Monitor */}
                    <div className={`text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded ${fps >= 60 ? 'text-green-400 bg-green-400/10' :
                            fps >= 30 ? 'text-yellow-400 bg-yellow-400/10' :
                                'text-red-400 bg-red-400/10 animate-pulse'
                        }`}>
                        {fps} FPS
                    </div>
                </div>

                {/* Canvas */}
                <canvas
                    ref={canvasRef}
                    style={{ width: W, height: H }}
                    className="rounded-lg"
                />

                {/* Legend */}
                <div className="flex items-center justify-between mt-1 px-1">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-0.5 bg-cyan-400 rounded" />
                            <span className="text-[8px] text-cyan-400/70">{isMobile ? 'F' : 'Factor'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-0.5 bg-amber-400 rounded" />
                            <span className="text-[8px] text-amber-400/70">{isMobile ? 'RPM' : 'RPM'}</span>
                        </div>
                    </div>
                    <span className="text-[8px] text-gray-500">SPD {speed}</span>
                </div>
            </div>
        </div>
    );
};
