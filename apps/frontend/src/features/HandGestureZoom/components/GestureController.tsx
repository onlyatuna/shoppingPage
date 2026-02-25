import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Landmark, Results } from '../types';
import { calculateDistance, lerp, clamp } from '../utils/mathUtils';

interface GestureControllerProps {
    onZoomChange: (zoomLevel: number) => void;
    debugMode?: boolean;
}

const GestureController: React.FC<GestureControllerProps> = ({ onZoomChange, debugMode = true }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraRunning, setIsCameraRunning] = useState(false);
    const [gestureState, setGestureState] = useState<'idle' | 'detecting' | 'pinching'>('idle');
    const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

    // Refs for logic to avoid re-renders
    const handsRef = useRef<any>(null);
    const currentZoomRef = useRef<number>(1);
    const targetZoomRef = useRef<number>(1);
    const requestRef = useRef<number>(0);
    const isComponentMounted = useRef(true);

    // Constants for gesture tuning
    const PINCH_THRESHOLD_LOW = 0.05; // Distance to consider "start of pinch"
    const PINCH_THRESHOLD_HIGH = 0.35; // Distance considered "max spread"
    const ZOOM_MIN = 1;
    const ZOOM_MAX = 5;
    const SMOOTHING_FACTOR = 0.15;

    const onResults = useCallback((results: Results) => {
        const canvasCtx = canvasRef.current?.getContext('2d');
        const width = canvasRef.current?.width || 320;
        const height = canvasRef.current?.height || 240;

        if (!canvasCtx) return;

        // Clear canvas
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, width, height);

        // Draw Camera feed if debug mode
        if (debugMode && results.image) {
            canvasCtx.drawImage(results.image, 0, 0, width, height);
        }

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            setGestureState('detecting');

            // Use the first detected hand
            const landmarks: Landmark[] = results.multiHandLandmarks[0];

            // Draw hand skeleton
            if (window.drawConnectors && window.drawLandmarks) {
                window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
                window.drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });
            }

            // 4 = Thumb Tip, 8 = Index Finger Tip
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];

            if (thumbTip && indexTip) {
                // Draw line between fingers
                canvasCtx.beginPath();
                canvasCtx.moveTo(thumbTip.x * width, thumbTip.y * height);
                canvasCtx.lineTo(indexTip.x * width, indexTip.y * height);
                canvasCtx.lineWidth = 3;

                // Calculate raw distance (normalized 0-1)
                const distance = calculateDistance(thumbTip, indexTip);

                // Clamp detection range to avoid jitter at extremes
                const clampedDist = clamp(distance, PINCH_THRESHOLD_LOW, PINCH_THRESHOLD_HIGH);
                const range = PINCH_THRESHOLD_HIGH - PINCH_THRESHOLD_LOW;
                const normalized = (clampedDist - PINCH_THRESHOLD_LOW) / range; // 0.0 to 1.0

                // Calculate target zoom
                const newTargetZoom = ZOOM_MIN + (normalized * (ZOOM_MAX - ZOOM_MIN));

                targetZoomRef.current = newTargetZoom;

                // Visual feedback
                let lineColor = '#eab308'; // Yellow (Active)
                if (normalized < 0.1) {
                    setGestureState('pinching'); // Close pinch
                    lineColor = '#3b82f6'; // Blue
                } else if (normalized > 0.9) {
                    lineColor = '#ef4444'; // Red (Max)
                }

                canvasCtx.strokeStyle = lineColor;
                canvasCtx.stroke();

                setDebugInfo(`Dist: ${distance.toFixed(3)} | Zoom: ${newTargetZoom.toFixed(1)}x`);
            }
        } else {
            setGestureState('idle');
            setDebugInfo('Processing...');
        }

        canvasCtx.restore();
    }, [debugMode]);

    // Animation loop for smooth zooming
    const updateZoom = useCallback(() => {
        // Smoothly interpolate current zoom towards target
        const diff = targetZoomRef.current - currentZoomRef.current;

        if (Math.abs(diff) > 0.001) {
            currentZoomRef.current = lerp(currentZoomRef.current, targetZoomRef.current, SMOOTHING_FACTOR);
            onZoomChange(currentZoomRef.current);
        }

        if (isComponentMounted.current) {
            requestRef.current = requestAnimationFrame(updateZoom);
        }
    }, [onZoomChange]);


    useEffect(() => {
        isComponentMounted.current = true;
        requestRef.current = requestAnimationFrame(updateZoom);
        return () => {
            isComponentMounted.current = false;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [updateZoom]);


    useEffect(() => {
        let activeStream: MediaStream | null = null;
        let animationFrameId: number;

        const processFrame = async () => {
            if (!isComponentMounted.current) return;

            if (videoRef.current && handsRef.current && videoRef.current.readyState >= 2) {
                try {
                    await handsRef.current.send({ image: videoRef.current });
                } catch (error) {
                    console.error("MediaPipe Send Error:", error);
                }
            }

            if (isComponentMounted.current) {
                // Using requestAnimationFrame to loop, but waiting for processing to finish
                // ensures we don't stack up calls if detection is slow.
                animationFrameId = requestAnimationFrame(processFrame);
            }
        };

        const setupCamera = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("Browser API navigator.mediaDevices.getUserMedia not available");
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user'
                    }
                });

                activeStream = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Wait for metadata to load before playing
                    videoRef.current.onloadedmetadata = () => {
                        if (videoRef.current) {
                            videoRef.current.play().catch(e => console.error("Video play error:", e));
                            setIsCameraRunning(true);
                            setDebugInfo('Camera active. Starting Hands...');

                            // Start processing loop once video is playing
                            processFrame();
                        }
                    };
                }
            } catch (error) {
                console.error("Camera setup error:", error);
                setDebugInfo(`Camera Error: ${error instanceof Error ? error.message : String(error)}`);
            }
        };

        const initMediaPipe = async () => {
            try {
                setDebugInfo('Loading MediaPipe...');
                const hands = new window.Hands({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                    }
                });

                hands.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                hands.onResults(onResults);
                handsRef.current = hands;

                // Only start camera after MediaPipe is ready
                await setupCamera();

            } catch (error) {
                console.error("Error initializing MediaPipe:", error);
                setDebugInfo('Error: ' + (error instanceof Error ? error.message : String(error)));
            }
        };

        // Initialize with a small delay to ensure scripts are loaded
        const timer = setTimeout(() => {
            if (window.Hands) {
                initMediaPipe();
            } else {
                setDebugInfo('Waiting for scripts...');
                setTimeout(initMediaPipe, 1000); // Retry
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(animationFrameId);

            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
            if (handsRef.current) {
                handsRef.current.close();
            }
        };
    }, [onResults]);

    return (
        <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-black shadow-2xl w-64 h-48 sm:w-80 sm:h-60 transition-all">
            {/* Video element (used for processing, needs to be technically 'visible' for some browsers but can be hidden visually) */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
                playsInline
                muted
                autoPlay
            />

            {/* Canvas for feedback */}
            <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="w-full h-full object-cover transform -scale-x-100" // Mirror effect
            />

            {/* Status Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2 text-xs text-slate-300 font-mono">
                <div className="flex justify-between items-center">
                    <span className={`flex items-center gap-1.5 ${gestureState === 'pinching' ? 'text-blue-400 font-bold' :
                        gestureState === 'detecting' ? 'text-green-400' : 'text-slate-500'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${gestureState !== 'idle' ? 'bg-current animate-pulse' : 'bg-slate-600'
                            }`} />
                        {gestureState.toUpperCase()}
                    </span>
                    <span className="truncate max-w-[150px]">{debugInfo.split('|')[1] || debugInfo}</span>
                </div>
            </div>

            {/* Guide Overlay (Visible when idle) */}
            {!isCameraRunning && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
                    <div className="text-center p-4">
                        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm">{debugInfo}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestureController;