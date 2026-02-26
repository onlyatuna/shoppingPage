import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Terminal, ArrowDown, ExternalLink, ArrowRight,
    ChevronLeft, ChevronRight, Wrench, Github, Linkedin, Mail,
    User, Activity,
    // 👇 新增/確認這些圖示都在
    Sparkles, BrainCircuit, Landmark, Calculator, TrendingDown
} from 'lucide-react';

import TrustVaultModal from '@/features/portfolio/components/TrustVaultModal';
import BehavioralCompassCard from '@/features/portfolio/components/BehavioralCompassCard';
import { useAIConfig } from '@/contexts/AIConfigContext';

const PortfolioPage = () => {
    const navigate = useNavigate();
    const { apiKey, setApiKey } = useAIConfig();

    // Derive live mode from global context
    const isLiveMode = apiKey.trim().length > 10;
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleLiveModeToggle = () => {
        if (!isLiveMode) {
            setIsModalOpen(true);
        } else {
            // Disconnect global key
            setApiKey("");
        }
    };

    const handleVerifyKey = () => {
        // No need for local state, TrustVaultModal calls setApiKey internally
        console.log("Key verified on Portfolio page");
    };

    return (
        <div className="min-h-screen bg-[#f6f6f8] text-[#111418] font-sans selection:bg-blue-100 selection:text-blue-900">

            <TrustVaultModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onVerify={handleVerifyKey}
            />

            {/* --- Navigation --- */}
            <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[#e2e8f0] bg-white/90 px-6 py-4 backdrop-blur-md lg:px-10">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#111621] text-white shadow-sm">
                        <Terminal size={20} />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-[#111418]">Chen.dev</span>
                </div>
                <div className="hidden gap-8 md:flex">
                    <a href="#work" className="text-sm font-medium text-[#111418] hover:text-blue-600 transition-colors">Work</a>
                    <a href="#solutions" className="text-sm font-medium text-[#64748b] hover:text-blue-600 transition-colors">Solutions</a>
                    <a href="#lab" className="text-sm font-medium text-[#64748b] hover:text-blue-600 transition-colors">Lab</a>
                </div>
                <button
                    onClick={() => document.getElementById('contact')?.scrollIntoView()}
                    className="flex h-10 items-center justify-center rounded-lg bg-[#2463eb] px-5 text-sm font-bold text-white transition-all hover:bg-blue-700 shadow-sm shadow-blue-200"
                >
                    Contact Me
                </button>
            </nav>

            <main className="flex flex-1 flex-col items-center">
                <div className="w-full max-w-7xl px-4 lg:px-8 py-12 flex flex-col gap-16">

                    {/* ... Hero Section (保持不變) ... */}
                    <section className="relative overflow-hidden rounded-3xl bg-[#111621] min-h-[560px] flex items-center p-8 md:p-16 shadow-2xl shadow-gray-200">
                        <div className="absolute inset-0 bg-[url('/assets/images/hero_bg.png')] bg-cover bg-center opacity-30 mix-blend-overlay" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#111621] via-[#111621]/90 to-transparent" />
                        <div className="relative z-10 max-w-2xl flex flex-col gap-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 w-fit backdrop-blur-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Open for Work</span>
                            </div>
                            <h1 className="text-white text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
                                Building <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">AI-Native</span><br />
                                Web Solutions.
                            </h1>
                            <p className="text-gray-400 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
                                Bridging the gap between <span className="text-gray-200">Financial Intelligence</span> and <span className="text-gray-200">Interactive Frontend Experiences</span>.
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' })} className="h-12 px-8 rounded-xl bg-white text-[#111621] font-bold text-sm hover:bg-gray-100 transition-all flex items-center gap-2 shadow-lg shadow-white/10">
                                    View Work <ArrowDown size={18} />
                                </button>
                                <button className="h-12 px-8 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all backdrop-blur-sm">
                                    Resume / CV
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* ... Flagship Section (保持不變) ... */}
                    <section id="work" className="flex flex-col gap-8 scroll-mt-24">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Featured Flagship</h3>
                            <span className="h-px flex-1 bg-gray-200"></span>
                        </div>
                        <div className="group bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col lg:flex-row hover:border-blue-100 transition-colors duration-300">
                            <div className="lg:w-7/12 relative min-h-[360px] lg:min-h-[500px] bg-gray-50 overflow-hidden">
                                <div className="absolute inset-0 bg-[url('/preview.png')] bg-cover bg-top transition-transform duration-700 group-hover:scale-[1.02]" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
                            </div>
                            <div className="lg:w-5/12 p-8 lg:p-12 flex flex-col justify-center gap-8 bg-white relative z-10">
                                <div className="flex gap-2 flex-wrap">
                                    {['React 19', 'Gemini 3 Flash', 'Docker', 'Stripe'].map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">#{tag}</span>
                                    ))}
                                </div>
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-[#111418] mb-4 tracking-tight">AI ShopMaster</h2>
                                    <p className="text-slate-600 leading-relaxed text-lg">
                                        An intelligent e-commerce dashboard that automates product descriptions using Generative AI.
                                    </p>
                                </div>
                                <div className="flex gap-4 pt-4 border-t border-gray-100">
                                    <button onClick={() => navigate('/app')} className="flex-1 h-14 rounded-xl bg-[#2463eb] text-white font-bold text-base hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 hover:-translate-y-0.5">
                                        Launch Live App
                                    </button>
                                    <button className="h-14 w-14 rounded-xl border border-gray-200 flex items-center justify-center text-[#111418] hover:bg-gray-50 hover:border-gray-300 transition-all">
                                        <ExternalLink size={24} strokeWidth={1.5} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* --- FinTech & AI Solutions (大幅修改：Top-Down 佈局) --- */}
                    <section id="solutions" className="flex flex-col gap-8 scroll-mt-24">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-3xl font-bold text-[#111418] tracking-tight">FinTech & AI Solutions</h2>
                                <div className="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
                                    <button onClick={() => setApiKey("")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!isLiveMode ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Mock Mode</button>
                                    <button onClick={handleLiveModeToggle} className={`group px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${isLiveMode ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-100' : 'text-gray-500 hover:text-blue-600'}`}>
                                        <span className="relative flex h-2 w-2">
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75 ${!isLiveMode && 'hidden'}`}></span>
                                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveMode ? 'bg-blue-500' : 'bg-gray-400 group-hover:bg-blue-500'}`}></span>
                                        </span>
                                        Live Gemini
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 新的佈局容器：垂直排列 */}
                        <div className="flex flex-col gap-6">

                            {/* 1. Behavioral Compass (Full Width Hero Card) */}
                            <BehavioralCompassCard isLiveMode={isLiveMode} apiKey={apiKey} className="min-h-[600px]" />

                            {/* 2. Secondary Metrics Row (修正為 4 欄單行佈局，解決過大問題) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                                {/* [Card 1] Investor Persona */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col hover:border-blue-200 transition-colors group relative overflow-hidden h-[280px]">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-500 flex items-center gap-2">
                                                <User size={14} className="text-blue-500" />
                                                Investor Persona
                                            </h4>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-2xl font-bold text-gray-900">Balanced</span>
                                                <span className="text-xs text-gray-400 font-medium">Growth</span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                                            <Activity size={20} />
                                        </div>
                                    </div>

                                    {/* Visual: Charts */}
                                    <div className="flex-1 flex items-end gap-2 pb-2">
                                        {[40, 65, 45, 70, 55].map((h, i) => (
                                            <div key={i} className="flex-1 bg-blue-100 rounded-t-lg relative overflow-hidden group-hover:bg-blue-200 transition-colors" style={{ height: `${h}%` }}>
                                                <div className="absolute bottom-0 left-0 w-full bg-blue-500/20 h-full transform translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ transitionDelay: `${i * 50}ms` }}></div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Risk Score</span>
                                        <span className="text-xs font-bold text-blue-600">68/100</span>
                                    </div>
                                </div>

                                {/* [Card 2] Market Risk */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col hover:border-amber-200 transition-colors group relative overflow-hidden h-[280px]">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-500 flex items-center gap-2">
                                                <Activity size={14} className="text-amber-500" />
                                                Market Risk
                                            </h4>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-2xl font-bold text-gray-900">Moderate</span>
                                                <span className="text-xs text-amber-500 font-medium">+2.4%</span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                                            <ArrowDown size={20} className="rotate-45" />
                                        </div>
                                    </div>

                                    {/* Visual: Wave */}
                                    <div className="flex-1 flex items-center justify-center relative">
                                        <svg className="w-full h-24 text-amber-500/20 group-hover:text-amber-500/40 transition-colors" viewBox="0 0 100 40" preserveAspectRatio="none">
                                            <path d="M0 20 Q 25 5, 50 20 T 100 20" fill="none" stroke="currentColor" strokeWidth="3" />
                                            <path d="M0 20 Q 25 35, 50 20 T 100 20" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-50" />
                                        </svg>
                                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Volatility</span>
                                        <span className="text-xs font-bold text-amber-600">12.5%</span>
                                    </div>
                                </div>

                                {/* [Card 3] AI Diagnosis (修復版) */}
                                <div
                                    onClick={() => window.open('/diagnosis', '_blank')}
                                    className="bg-[#111621] rounded-3xl p-6 shadow-xl shadow-gray-200/50 flex flex-col relative overflow-hidden h-[280px] cursor-pointer group hover:-translate-y-1 transition-all duration-300"
                                >
                                    {/* 背景光暈 */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all"></div>
                                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-900/20 to-transparent"></div>

                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4 z-10">
                                        <div>
                                            <h4 className="text-sm font-bold text-blue-200 flex items-center gap-2">
                                                <Sparkles size={14} className="text-blue-400" />
                                                AI Diagnosis
                                            </h4>
                                            <p className="text-[10px] text-gray-400 mt-1">Behavioral Engine</p>
                                        </div>
                                        <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-white group-hover:scale-110 transition-transform duration-300">
                                            <BrainCircuit size={20} />
                                        </div>
                                    </div>

                                    {/* Visual: Scan Animation */}
                                    <div className="flex-1 flex items-center justify-center relative z-10">
                                        <div className="relative w-28 h-28">
                                            {/* 旋轉外圈 */}
                                            <div className="absolute inset-0 border-2 border-dashed border-blue-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                                            {/* 靜態內圈 */}
                                            <div className="absolute inset-4 border border-white/10 rounded-full"></div>
                                            {/* 掃描線效果 */}
                                            <div className="absolute inset-0 w-full h-full rounded-full overflow-hidden">
                                                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent to-blue-500/20 animate-scan"></div>
                                            </div>
                                            {/* 中心文字 */}
                                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                <span className="text-2xl font-bold text-white tracking-tighter">IQ</span>
                                                <span className="text-[9px] text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30 mt-1">Start</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-2 pt-4 border-t border-white/5 flex items-center justify-between z-10">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">
                                                Active
                                            </span>
                                        </div>
                                    </div>

                                    {/* Inline Style for Scan Animation */}
                                    <style>{`
            @keyframes scan {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(200%); }
            }
            .animate-scan {
                animation: scan 2s linear infinite;
            }
        `}</style>
                                </div>

                                {/* [Card 4] Pension Calculator (新增) */}
                                <div
                                    onClick={() => window.open('/pension', '_blank')}
                                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col hover:border-emerald-200 transition-colors group relative overflow-hidden h-[280px] cursor-pointer"
                                >
                                    {/* 背景裝飾 */}
                                    <div className="absolute -right-4 -bottom-4 text-emerald-50 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                        <Landmark size={180} />
                                    </div>

                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4 z-10">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-500 flex items-center gap-2">
                                                <Calculator size={14} className="text-emerald-500" />
                                                Pension Gap
                                            </h4>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-2xl font-bold text-gray-900">Calculator</span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                            <TrendingDown size={20} />
                                        </div>
                                    </div>

                                    {/* Visual: Three Pillars */}
                                    <div className="flex-1 flex items-end justify-center gap-4 pb-4 relative z-10">
                                        {/* T1 */}
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 bg-emerald-100 rounded-t-lg h-12 group-hover:h-16 transition-all duration-500"></div>
                                            <span className="text-[9px] font-bold text-gray-400">T1</span>
                                        </div>
                                        {/* T2 */}
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 bg-emerald-200 rounded-t-lg h-20 group-hover:h-24 transition-all duration-500 delay-75"></div>
                                            <span className="text-[9px] font-bold text-emerald-600">T2</span>
                                        </div>
                                        {/* T3 (Gap) */}
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 bg-gray-50 border border-dashed border-gray-300 rounded-t-lg h-28 group-hover:border-emerald-400 transition-colors delay-150 flex items-center justify-center">
                                                <span className="text-[10px] text-gray-300">?</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-400">Gap</span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between z-10">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Taiwan Edition</span>
                                        <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                            Start
                                            <ArrowRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ... Creative Lab Section & Footer (保持不變) ... */}
                    <section id="lab" className="flex flex-col gap-8 py-8">
                        <div className="flex items-end justify-between border-b border-gray-200 pb-6">
                            <div>
                                <h2 className="text-3xl font-black text-[#111418] tracking-tight">Creative Lab <span className="text-blue-600">.</span></h2>
                                <p className="text-gray-500 mt-2 font-medium">Experimental frontend & interactive prototypes.</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="h-10 w-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-colors">
                                    <ChevronLeft size={20} />
                                </button>
                                <button className="h-10 w-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { title: "Hand Gesture Zoom", tag: "TensorFlow.js", color: "purple", desc: "Control UI scale using webcam hand distance.", path: "/hand-gesture", image: "/assets/images/lab_hand.png" },
                                { title: "BREEZEMASTER 3D", tag: "Three.js", color: "orange", desc: "Interactive 3D fan simulation with real-time audio synthesis & dynamic nature-mode wind logic.", path: "/breeze", image: "/assets/images/lab_3d.png" },
                                { title: "Retro Arcade", tag: "Canvas API", color: "green", desc: "JS re-creations of Tetris and Pac-Man.", path: "/arcade", image: "/assets/images/lab_arcade.png" }
                            ].map((item, i) => {
                                const colorStyles = {
                                    purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
                                    orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
                                    green: "bg-green-500/20 text-green-300 border-green-500/30"
                                }[item.color] || "bg-gray-500/20 text-gray-300 border-gray-500/30";

                                return (
                                    <div
                                        key={i}
                                        onClick={() => item.path !== "#" && window.open(item.path, '_blank')}
                                        className="group relative overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer bg-[#111621] shadow-md"
                                    >
                                        <div
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                            style={{ backgroundImage: `url(${item.image})` }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/80 group-hover:from-gray-900/70 group-hover:to-black/60 transition-colors duration-500"></div>
                                        <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`px-2 py-0.5 border ${colorStyles} text-[10px] font-bold uppercase rounded tracking-wide`}>
                                                    {item.tag}
                                                </span>
                                            </div>
                                            <h3 className="text-white font-bold text-xl mb-2 group-hover:text-blue-400 transition-colors">{item.title}</h3>
                                            <p className="text-gray-400 text-sm line-clamp-2 group-hover:text-gray-200 transition-colors">
                                                {item.desc}
                                            </p>
                                        </div>
                                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/30 rounded-2xl transition-colors pointer-events-none"></div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="flex flex-col md:flex-row gap-12 py-12 items-center bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 w-fit">
                                <Wrench size={14} />
                                <span className="text-xs font-bold uppercase tracking-wide">Utility Tool</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-[#111418]">Smart Savings Tracker</h2>
                            <p className="text-slate-600 max-w-lg text-lg leading-relaxed">
                                A personal utility to track micro-savings goals. Designed with a skeuomorphic receipt aesthetic to bring a tangible feel to digital finance.
                            </p>
                            <button className="text-blue-600 font-bold hover:text-blue-700 flex items-center gap-2 text-lg group">
                                Try the Demo <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        <div className="relative">
                            <div className="relative w-80 bg-white drop-shadow-2xl rotate-3 transform hover:rotate-0 transition-transform duration-500 font-mono text-xs border-t-4 border-blue-600">
                                <div className="absolute -top-3 left-0 w-full h-3 bg-white" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }}></div>
                                <div className="p-8 pb-10 flex flex-col gap-5 text-gray-800">
                                    <div className="text-center border-b border-dashed border-gray-300 pb-5">
                                        <h3 className="text-xl font-bold uppercase tracking-widest text-[#111418]">Savings Goal</h3>
                                        <p className="text-gray-500 mt-2">Acme FinTech Bank</p>
                                        <p className="text-gray-400 text-[10px] mt-1">Oct 24, 2023 • 14:30 PM</p>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between"><span>Coffee Skip</span><span>$ 5.50</span></div>
                                        <div className="flex justify-between"><span>Round Up</span><span>$ 0.45</span></div>
                                        <div className="flex justify-between"><span>Wkly Deposit</span><span>$50.00</span></div>
                                    </div>
                                    <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between font-bold text-base text-[#111418]">
                                        <span>TOTAL SAVED</span>
                                        <span>$55.95</span>
                                    </div>
                                    <div className="text-center pt-6">
                                        <div className="w-20 h-20 mx-auto bg-[#111418] p-1">
                                            <div className="w-full h-full bg-white flex items-center justify-center">
                                                <span className="text-[10px] tracking-tighter">QR-CODE</span>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-[10px] text-gray-400 uppercase tracking-wide">Scan to deposit</p>
                                    </div>
                                </div>
                                <div className="absolute -bottom-3 left-0 w-full h-3 bg-white" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>
                            </div>
                        </div>
                    </section>

                    {/* --- Footer --- */}
                    <footer id="contact" className="mt-8 border-t border-gray-200 pt-12 pb-12 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                        <p>© 2026 Chen.dev. All rights reserved.</p>
                        <div className="flex gap-8 mt-4 md:mt-0">
                            <a href="#" className="hover:text-blue-600 transition-colors"><Linkedin size={20} /></a>
                            <a href="https://github.com/onlyatuna" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors"><Github size={20} /></a>
                            <a href="mailto:your@email.com" className="hover:text-blue-600 transition-colors"><Mail size={20} /></a>
                        </div>
                    </footer>

                </div>
            </main >
        </div >
    );
};

export default PortfolioPage;