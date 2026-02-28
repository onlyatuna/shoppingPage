import { RenderEngine, QualityLevel } from './types';

export interface SmartStrategy {
    engine: RenderEngine;
    defaultQuality: QualityLevel;
    reason: string;
    score: number;
    hasWebGPU: boolean;
}

/**
 * Capability Detection: Check if WebGPU is supported and available.
 * Performs a real requestAdapter call to verify hardware compatibility.
 */
export async function checkWebGPUSupport(): Promise<boolean> {
    // 1. Basic API check
    if (typeof navigator === 'undefined' || !navigator.gpu) {
        return false;
    }

    // 2. Hardware/Driver check
    try {
        const adapter = await navigator.gpu.requestAdapter();
        return !!adapter;
    } catch (e) {
        console.warn('WebGPU requestAdapter failed:', e);
        return false;
    }
}

/**
 * Browser Classification and Scoring.
 * 
 * Scoring System:
 * - Chromium (Chrome/Edge): 100 (Best WebGPU support)
 * - Firefox: 70 (Good support, potential shader diffs)
 * - Safari/Other: 30 (Experimental/Unstable, prefer WebGL)
 * - Mobile: 20 (Power/Thermal concerns, prefer WebGL)
 */
export function getBrowserEngineScore(): { name: string; score: number } {
    if (typeof navigator === 'undefined') return { name: 'Unknown', score: 0 };

    const ua = navigator.userAgent.toLowerCase();

    const isChrome = ua.includes('chrome') || ua.includes('chromium') || ua.includes('edg');
    const isFirefox = ua.includes('firefox');
    const isSafari = ua.includes('safari') && !ua.includes('chrome');
    const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);

    if (isMobile) {
        return { name: 'Mobile', score: 20 };
    }

    if (isChrome) {
        return { name: 'Chromium', score: 100 };
    }

    if (isFirefox) {
        return { name: 'Firefox', score: 70 };
    }

    if (isSafari) {
        return { name: 'Safari', score: 30 };
    }

    return { name: 'Unknown', score: 50 };
}

/**
 * Smart Engine Switching Strategy.
 * Threshold for WebGPU: Score >= 60
 */
export async function getSmartStrategy(): Promise<SmartStrategy> {
    const hasWebGPU = await checkWebGPUSupport();
    const context = getBrowserEngineScore();
    const threshold = 60;

    // Scenario A: WebGPU Available + Score >= Threshold
    if (hasWebGPU && context.score >= threshold) {
        return {
            engine: 'webgpu',
            defaultQuality: 'high', // "高级 (High-Optimized)"
            score: context.score,
            hasWebGPU: true,
            reason: `環境評分 ${context.score} (${context.name})，WebGPU 效能穩定。`
        };
    }

    // Scenario B: Other/No WebGPU
    return {
        engine: 'webgl',
        defaultQuality: 'med', // "中 (Medium)"
        score: context.score,
        hasWebGPU: hasWebGPU,
        reason: hasWebGPU
            ? `環境評分 ${context.score} 低於門檻 (${threshold})，自動回退 WebGL 以確保兼容性。`
            : `裝置硬體或瀏覽器不支援 WebGPU，已自動鎖定 WebGL 模式。`
    };
}
