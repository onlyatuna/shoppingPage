import CaseStudyCard from '@/features/portfolio/components/CaseStudyCard';
import LabCard from '@/features/portfolio/components/LabCard';
import { ArrowDown } from 'lucide-react';

export default function PortfolioPage() {
    return (
        <div className="flex flex-col items-center">
            <div className="w-full max-w-7xl px-4 lg:px-8 py-12 flex flex-col gap-24">

                {/* Hero Section */}
                <section className="relative overflow-hidden rounded-3xl bg-[#111621] min-h-[560px] flex items-center justify-center p-8 md:p-16 shadow-2xl shadow-gray-200 text-center md:text-left md:justify-start">
                    <div className="absolute inset-0 bg-[url('/assets/images/hero_bg.png')] bg-cover bg-center opacity-30 mix-blend-overlay" />
                    <div className="absolute md:inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#111621] via-[#111621]/90 to-transparent inset-0" />
                    <div className="relative z-10 max-w-3xl flex flex-col gap-8 md:items-start items-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 w-fit backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Open for Work</span>
                        </div>
                        <h1 className="text-white text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-center md:text-left">
                            打造高轉換率的商務體驗，與探索前衛互動技術的產品設計師 / 前端工程師。
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl font-medium leading-relaxed max-w-xl text-center md:text-left">
                            Bridging the gap between <span className="text-gray-200">Financial Intelligence</span> and <span className="text-gray-200">Interactive Frontend Experiences</span>.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' })} className="h-12 px-8 rounded-xl bg-white text-[#111621] font-bold text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/10 w-full sm:w-auto">
                                View Work <ArrowDown size={18} />
                            </button>
                            <button className="h-12 px-8 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all backdrop-blur-sm hidden sm:flex items-center">
                                Resume / CV
                            </button>
                        </div>
                    </div>
                </section>

                {/* Core Work Section */}
                <section id="work" className="flex flex-col gap-8 scroll-mt-24">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Featured Flagships</h3>
                        <span className="h-px flex-1 bg-gray-200"></span>
                    </div>

                    <div className="flex flex-col gap-12">
                        {/* E-commerce Case Study */}
                        <CaseStudyCard
                            title="AI ShopMaster"
                            description="An intelligent e-commerce dashboard that automates product descriptions using Generative AI and provides a seamless checkout experience."
                            tags={['React 19', 'Gemini AI', 'Tailwind', 'Stripe']}
                            imagePath="/preview.png"
                            linkTo="/work/ecommerce"
                            demoLink="/work/ecommerce/demo"
                        />

                        {/* Pension Case Study */}
                        <CaseStudyCard
                            title="Pension Gap Calculator"
                            description="A comprehensive financial tool designed to help users visualize their retirement trajectory and understand potential savings gaps through an interactive, multi-pillar visualization system."
                            tags={['FinTech', 'Data Viz', 'React', 'TypeScript']}
                            imagePath="/assets/images/pension_preview.png"
                            linkTo="/work/pension"
                            demoLink="/work/pension/demo"
                        />
                    </div>
                </section>

                {/* Lab Section */}
                <section id="lab" className="flex flex-col gap-8 scroll-mt-24 mb-16">
                    <div className="flex items-end justify-between border-b border-gray-200 pb-6">
                        <div>
                            <h2 className="text-3xl font-black text-[#111418] tracking-tight">Creative Lab <span className="text-blue-600">.</span></h2>
                            <p className="text-gray-500 mt-2 font-medium">Experimental frontend & interactive prototypes.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <LabCard
                            title="Hand Gesture Zoom"
                            tag="TensorFlow.js"
                            color="purple"
                            description="Control UI scale utilizing webcam hand distance tracking logic."
                            linkTo="/lab/hand-gesture"
                            imagePath="/assets/images/lab_hand.png"
                        />
                        <LabCard
                            title="BREEZEMASTER 3D"
                            tag="Three.js"
                            color="orange"
                            description="Interactive 3D fan simulation with dynamic nature-mode wind logic."
                            linkTo="/lab/breeze3d"
                            imagePath="/assets/images/lab_3d.png"
                        />
                        <LabCard
                            title="Retro Arcade"
                            tag="Canvas API"
                            color="green"
                            description="JavaScript re-creations of classic Tetris and Pac-Man mechanics."
                            linkTo="/lab/pacman"
                            imagePath="/assets/images/lab_arcade.png"
                        />
                        <LabCard
                            title="Behavioral Engine"
                            tag="FinTech UI"
                            color="blue"
                            description="AI-driven investment persona diagnosis and market risk visualization."
                            linkTo="/lab/behavioral"
                            imagePath="/assets/images/hero_bg.png"
                        />
                    </div>
                </section>

            </div>
        </div>
    );
}