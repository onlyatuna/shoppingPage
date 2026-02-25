import React, { useRef, useEffect, useCallback } from 'react';
import type { NatureFactorRef } from '@/features/breeze3d/types';

interface WaveformMonitorProps {
    natureFactorRef: NatureFactorRef;
    rotationSpeedRef: NatureFactorRef;
    speed: number;
    natureMode: boolean;
    visible: boolean;
}

/**
 * Real-time dual-channel oscilloscope for natural wind debugging.
 *
 *   Cyan line  → Nature Factor (Perlin noise output, 0–1)
 *   Amber line → Actual blade rotation speed (after asymmetric lerp, 0–1)
 *
 * The lag between the two lines visualises the motor inertia effect.
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

    const BUFFER = 200;
    const W = 420;
    const H = 130;
    const PAD_L = 26;

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Sample
        factorBuf.current.push(natureFactorRef.current);
        rpmBuf.current.push(rotationSpeedRef.current);
        if (factorBuf.current.length > BUFFER) factorBuf.current.shift();
        if (rpmBuf.current.length > BUFFER) rpmBuf.current.shift();

        // Clear
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const y = (H / 4) * i;
            ctx.beginPath();
            ctx.moveTo(PAD_L, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Y labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('1.0', 3, 12);
        ctx.fillText('0.5', 3, H / 2 + 4);
        ctx.fillText('0', 3, H - 4);

        const drawW = W - PAD_L;
        const stepX = drawW / (BUFFER - 1);

        // Helper: draw a buffered line
        const drawLine = (
            buf: number[],
            color1: string,
            color2: string,
            fillColor: string,
            lineWidth: number
        ) => {
            if (buf.length < 2) return;

            const grad = ctx.createLinearGradient(PAD_L, 0, W, 0);
            grad.addColorStop(0, color1);
            grad.addColorStop(1, color2);

            ctx.strokeStyle = grad;
            ctx.lineWidth = lineWidth;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();

            for (let i = 0; i < buf.length; i++) {
                const x = PAD_L + i * stepX;
                const y = H - buf[i] * (H - 10) - 5;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Fill
            const lastX = PAD_L + (buf.length - 1) * stepX;
            ctx.lineTo(lastX, H);
            ctx.lineTo(PAD_L, H);
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();
        };

        // ── Channel 1: Nature Factor (cyan) ──
        drawLine(
            factorBuf.current,
            'rgba(34, 211, 238, 0.15)',
            'rgba(34, 211, 238, 0.9)',
            'rgba(34, 211, 238, 0.06)',
            2
        );

        // ── Channel 2: Rotation Speed (amber) ──
        drawLine(
            rpmBuf.current,
            'rgba(251, 191, 36, 0.15)',
            'rgba(251, 191, 36, 0.9)',
            'rgba(251, 191, 36, 0.04)',
            1.5
        );

        // ── Current values ──
        const fVal = factorBuf.current[factorBuf.current.length - 1];
        const rVal = rpmBuf.current[rpmBuf.current.length - 1];

        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'right';

        // Factor value
        ctx.fillStyle = '#22d3ee';
        ctx.fillText(fVal.toFixed(2), W - 6, 14);

        // RPM value
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(rVal.toFixed(2), W - 6, 28);

        // Dot on factor line head
        const fDotX = PAD_L + (factorBuf.current.length - 1) * stepX;
        const fDotY = H - fVal * (H - 10) - 5;
        ctx.beginPath();
        ctx.arc(fDotX, fDotY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(fDotX, fDotY, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#22d3ee';
        ctx.fill();

        // Dot on RPM line head
        const rDotX = PAD_L + (rpmBuf.current.length - 1) * stepX;
        const rDotY = H - rVal * (H - 10) - 5;
        ctx.beginPath();
        ctx.arc(rDotX, rDotY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rDotX, rDotY, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();

        rafRef.current = requestAnimationFrame(draw);
    }, [natureFactorRef, rotationSpeedRef]);

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
    }, [visible, draw]);

    if (!visible) return null;

    // Mode label
    const modeLabel = speed === 0
        ? '待機 · Standby'
        : natureMode
            ? '自然風 · Perlin 3-Layer'
            : '恆定 · Constant';

    return (
        <div className="absolute bottom-44 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_6px] ${speed > 0 ? 'bg-cyan-400 shadow-cyan-400 animate-pulse' : 'bg-gray-600 shadow-gray-600'
                            }`} />
                        <span className="text-[10px] font-bold text-white/70 tracking-widest uppercase">
                            {modeLabel}
                        </span>
                    </div>
                </div>

                {/* Canvas */}
                <canvas
                    ref={canvasRef}
                    style={{ width: W, height: H }}
                    className="rounded-lg"
                />

                {/* Legend */}
                <div className="flex items-center justify-between mt-1.5 px-1">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-0.5 bg-cyan-400 rounded" />
                            <span className="text-[9px] text-cyan-400/70">Factor</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-0.5 bg-amber-400 rounded" />
                            <span className="text-[9px] text-amber-400/70">RPM</span>
                        </div>
                    </div>
                    <span className="text-[9px] text-gray-500">Speed {speed}</span>
                </div>
            </div>
        </div>
    );
};
