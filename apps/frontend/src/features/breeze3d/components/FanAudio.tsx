import React, { useEffect, useRef } from 'react';
import type { NatureFactorRef } from '@/features/breeze3d/types';

interface FanAudioProps {
    speed: number;
    rotationSpeedRef: NatureFactorRef;
}

/**
 * FanAudio — DC fan sound synthesis driven by actual blade RPM.
 *
 * Instead of tracking speed-setting + nature-factor independently,
 * this component reads `rotationSpeedRef.current` (0–1, normalised,
 * written by FanModel after asymmetric lerp) every frame.
 *
 * This means:
 *   ✅ Soft-start ramp is built in (RPM lerps up gradually)
 *   ✅ Nature mode fluctuations are built in (RPM follows factor)
 *   ✅ Motor inertia is built in (RPM uses asymmetric lerp)
 *   ✅ Audio perfectly matches the visual blade speed
 *
 * Audio graph (three layers):
 *   Layer 1 (90%):  White noise → LowPass → Gain  (wind turbulence)
 *   Layer 2 (~8%):  Sine osc → Gain               (DC motor hum)
 *   Layer 3 (~2%):  HF sine osc → Gain            (PWM whine)
 */

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

export const FanAudio: React.FC<FanAudioProps> = ({ speed, rotationSpeedRef }) => {
    const ctxRef = useRef<AudioContext | null>(null);

    const noiseGainRef = useRef<GainNode | null>(null);
    const noiseFilterRef = useRef<BiquadFilterNode | null>(null);
    const motorOscRef = useRef<OscillatorNode | null>(null);
    const motorGainRef = useRef<GainNode | null>(null);
    const pwmOscRef = useRef<OscillatorNode | null>(null);
    const pwmGainRef = useRef<GainNode | null>(null);

    const rafIdRef = useRef<number | null>(null);

    // ── Build audio graph (once, on first power-on) ─────────────────
    useEffect(() => {
        if (speed > 0 && !ctxRef.current) {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            ctxRef.current = ctx;
            const now = ctx.currentTime;

            // Layer 1: White noise → LowPass → Gain
            const noiseSrc = ctx.createBufferSource();
            noiseSrc.buffer = createNoiseBuffer(ctx);
            noiseSrc.loop = true;

            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(200, now);
            noiseFilter.Q.setValueAtTime(0.7, now);

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0, now);

            noiseSrc.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noiseSrc.start();

            noiseFilterRef.current = noiseFilter;
            noiseGainRef.current = noiseGain;

            // Layer 2: Sine → Gain (motor hum)
            const motorOsc = ctx.createOscillator();
            motorOsc.type = 'sine';
            motorOsc.frequency.setValueAtTime(40, now);
            const motorGain = ctx.createGain();
            motorGain.gain.setValueAtTime(0, now);
            motorOsc.connect(motorGain);
            motorGain.connect(ctx.destination);
            motorOsc.start();

            motorOscRef.current = motorOsc;
            motorGainRef.current = motorGain;

            // Layer 3: HF Sine → Gain (PWM whine)
            const pwmOsc = ctx.createOscillator();
            pwmOsc.type = 'sine';
            pwmOsc.frequency.setValueAtTime(3500, now);
            const pwmGain = ctx.createGain();
            pwmGain.gain.setValueAtTime(0, now);
            pwmOsc.connect(pwmGain);
            pwmGain.connect(ctx.destination);
            pwmOsc.start();

            pwmOscRef.current = pwmOsc;
            pwmGainRef.current = pwmGain;
        }
    }, [speed]);

    // ── Continuous RAF loop: drive audio from actual RPM ─────────────
    useEffect(() => {
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }

        const ctx = ctxRef.current;
        const noiseGain = noiseGainRef.current;
        const noiseFilter = noiseFilterRef.current;
        const motorOsc = motorOscRef.current;
        const motorGain = motorGainRef.current;
        const pwmOsc = pwmOscRef.current;
        const pwmGain = pwmGainRef.current;

        if (!ctx || !noiseGain || !noiseFilter || !motorOsc || !motorGain || !pwmOsc || !pwmGain) return;

        const animate = () => {
            const rpm = rotationSpeedRef.current; // 0–1, already lerped with inertia
            const now = ctx.currentTime;

            // Exponential curve: low RPMs ≈ silent, high RPMs ≈ loud
            const intensity = Math.pow(rpm, 2);

            // Layer 1: wind noise (main presence)
            noiseGain.gain.linearRampToValueAtTime(0.08 * intensity, now + 0.05);
            noiseFilter.frequency.linearRampToValueAtTime(300 + 2500 * intensity, now + 0.05);

            // Layer 2: motor hum
            motorGain.gain.linearRampToValueAtTime(0.008 * intensity, now + 0.05);
            motorOsc.frequency.linearRampToValueAtTime(40 + 32 * rpm, now + 0.05);

            // Layer 3: PWM whine
            pwmGain.gain.linearRampToValueAtTime(0.002 * intensity, now + 0.05);
            pwmOsc.frequency.linearRampToValueAtTime(3500 + 1600 * rpm, now + 0.05);

            rafIdRef.current = requestAnimationFrame(animate);
        };

        rafIdRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        };
    }, [speed, rotationSpeedRef]);

    // ── Cleanup ─────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
            if (ctxRef.current) ctxRef.current.close();
        };
    }, []);

    return null;
};
