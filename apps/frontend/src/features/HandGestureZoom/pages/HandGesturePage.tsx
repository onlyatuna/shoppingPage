import React, { useState } from 'react';
import GestureController from '../components/GestureController';
import ImageWorkspace from '../components/ImageWorkspace';

const HandGesturePage: React.FC = () => {
    const [zoomLevel, setZoomLevel] = useState(1);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white flex flex-col">

            {/* Navbar / Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            GestureZoom
                        </h1>
                    </div>

                    <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">
                        Powered by MediaPipe
                    </a>
                </div>
            </header>

            <main className="flex-grow flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden">

                {/* Left Side: Image Workspace (Takes most space) */}
                <div className="flex-grow h-1/2 lg:h-full relative order-2 lg:order-1 overflow-y-auto lg:overflow-hidden p-4 lg:p-8 flex items-center justify-center">
                    <ImageWorkspace zoomLevel={zoomLevel} />
                </div>

                {/* Right Side: Webcam & Instructions (Fixed width on desktop) */}
                <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 p-6 flex flex-col gap-6 order-1 lg:order-2 z-20 shadow-2xl overflow-y-auto">

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">Gesture Control</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Use your thumb and index finger to control the zoom level of the image on the left.
                        </p>
                    </div>

                    <div className="flex justify-center bg-black/20 rounded-2xl p-2 border border-slate-800 shadow-inner">
                        <GestureController onZoomChange={setZoomLevel} />
                    </div>

                    <div className="space-y-4">
                        <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-4">
                            <h4 className="text-indigo-400 font-medium mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                How to use
                            </h4>
                            <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside marker:text-indigo-500">
                                <li>Show your hand to the camera.</li>
                                <li>Pinch thumb and index finger to zoom out (100%).</li>
                                <li>Spread them apart to zoom in (up to 500%).</li>
                                <li>Keep your hand steady for best results.</li>
                            </ul>
                        </div>

                        <div className="border-t border-slate-800 pt-4">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Debug Info</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                <div className="bg-slate-800 p-2 rounded">
                                    <span className="block text-slate-500">Mode</span>
                                    <span className="text-emerald-400">MediaPipe Hands</span>
                                </div>
                                <div className="bg-slate-800 p-2 rounded">
                                    <span className="block text-slate-500">FPS</span>
                                    <span className="text-white">30 (Auto)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default HandGesturePage;
