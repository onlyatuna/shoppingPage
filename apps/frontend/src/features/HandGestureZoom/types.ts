// MediaPipe Types (Simplified for global usage)

export interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}

export interface Results {
    multiHandLandmarks: Landmark[][];
    multiHandedness: any[];
    image: any;
}

export interface HandsOptions {
    maxNumHands?: number;
    modelComplexity?: number;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
}

export interface HandsConfig {
    locateFile: (file: string) => string;
}

export declare class Hands {
    constructor(config?: HandsConfig);
    setOptions(options: HandsOptions): Promise<void>;
    onResults(callback: (results: Results) => void): void;
    send(input: { image: HTMLVideoElement | HTMLCanvasElement }): Promise<void>;
    close(): Promise<void>;
}

// Augment window to include these globals loaded via script tags
declare global {
    interface Window {
        Hands: typeof Hands;
        drawConnectors: (ctx: CanvasRenderingContext2D, landmarks: Landmark[], connections: any[], options?: any) => void;
        drawLandmarks: (ctx: CanvasRenderingContext2D, landmarks: Landmark[], options?: any) => void;
        HAND_CONNECTIONS: any[];
    }
}

export interface Dimensions {
    width: number;
    height: number;
}
