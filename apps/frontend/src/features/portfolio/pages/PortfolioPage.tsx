import CaseStudyCard from '@/features/portfolio/components/CaseStudyCard';
import LabCard from '@/features/portfolio/components/LabCard';

import { ArrowDown, Monitor, Database, Cpu } from 'lucide-react';

export default function PortfolioPage() {
    return (
        <div className="flex flex-col items-center">
            <div className="w-full max-w-7xl px-4 lg:px-8 py-12 flex flex-col gap-24">

                {/* Hero Section */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#f0f4f8] to-[#e6eaf0] min-h-[560px] flex items-center justify-center p-8 md:p-16 shadow-xl shadow-gray-200/50 text-center md:text-left md:justify-start border border-gray-100">
                    <div className="absolute inset-0 bg-[url('/assets/images/hero_bg.png')] bg-cover bg-center opacity-5 mix-blend-overlay" />
                    <div className="relative z-10 max-w-3xl flex flex-col gap-8 md:items-start items-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 w-fit">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">開放新機會</span>
                        </div>
                        <h1 className="text-[#111418] text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-center md:text-left">
                            專注於 AI 應用整合與複雜系統架構的全端工程師。
                        </h1>
                        <p className="text-gray-600 text-lg md:text-xl font-medium leading-relaxed max-w-xl text-center md:text-left">
                            結合生成式 AI 與全端技術，打造次世代金融與電商自動化系統。
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' })} className="h-12 px-8 rounded-xl bg-[#2463eb] text-white font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 w-full sm:w-auto hover:-translate-y-0.5">
                                查看作品 <ArrowDown size={18} />
                            </button>
                            <button className="h-12 px-8 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all hidden sm:flex items-center hover:-translate-y-0.5 shadow-sm">
                                個人履歷
                            </button>
                        </div>
                    </div>
                </section>

                {/* Tech Stack Section */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Monitor size={20} /></div>
                            <h3 className="text-xl font-bold text-[#111418]">前端開發 (Frontend)</h3>
                        </div>
                        <p className="text-gray-600 font-medium">React 19, TypeScript, Tailwind CSS, Vite, Zustand, Three.js</p>
                    </div>
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Database size={20} /></div>
                            <h3 className="text-xl font-bold text-[#111418]">後端與 API (Backend)</h3>
                        </div>
                        <p className="text-gray-600 font-medium">Node.js, Express, MySQL, RESTful APIs, Docker</p>
                    </div>
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Cpu size={20} /></div>
                            <h3 className="text-xl font-bold text-[#111418]">AI 與系統整合 (Integrations)</h3>
                        </div>
                        <p className="text-gray-600 font-medium">Gemini / OpenAI API, Instagram Graph API, Stripe Payments</p>
                    </div>
                </section>

                {/* Core Work Section */}
                <section id="work" className="flex flex-col gap-8 scroll-mt-24">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">精選專案 (Featured Work)</h3>
                        <span className="h-px flex-1 bg-gray-200"></span>
                    </div>

                    <div className="flex flex-col gap-12">
                        {/* E-commerce Case Study */}
                        <CaseStudyCard
                            title="AI ShopMaster"
                            description={<>結合<strong className="text-gray-900">生成式 AI</strong> 與社群自動化的全端電商系統，提供 SaaS 級智慧編輯器與無縫結帳體驗。</>}
                            tags={['AI-Automation', 'System-Architecture', 'Node.js', 'React 19']}
                            keyFeatures={<>實作 SaaS 級圖文編輯器，並串接 <strong className="text-gray-900">Gemini AI</strong> 與 <strong className="text-gray-900">IG Graph API</strong> 達成從生成到發文的端到端自動化。</>}
                            techStack={<><strong className="text-gray-900">Node.js (MVC)</strong>, Express, Prisma, MySQL, React 19, Vite, Zustand</>}
                            impact="減少 80% 商家上架文案與作圖時間，大幅降低社群營運成本。"
                            imagePath="/assets/images/ecommerce_preview.png"
                            containImage={true}
                            linkTo="/work/ecommerce"
                            demoLink="/work/ecommerce/demo"
                        />

                        {/* Pension Case Study */}
                        <CaseStudyCard
                            title="退休金缺口試算器 (Pension Gap Calculator)"
                            description={<>全方位的金融工具，協助使用者透過互動式<strong className="text-gray-900">多層次視覺化</strong>系統，預見退休軌跡並了解潛在的儲蓄缺口。</>}
                            tags={['FinTech', 'Data-Viz', 'Financial-Security', 'React']}
                            keyFeatures="互動式多層次退休軌跡視覺化系統"
                            techStack={<>React, TypeScript, <strong className="text-gray-900">Recharts</strong>, RESTful APIs</>}
                            impact="提供數據驅動的洞察，幫助使用者掌握退休金缺口"
                            imagePath="/assets/images/pension_preview.png"
                            linkTo="/work/pension"
                            demoLink="/work/pension/demo"
                            reverse={true}
                        />

                        {/* 行為決策導航儀 (原 Behavioral & FinTech Lab) */}
                        <CaseStudyCard
                            title="行為決策導航儀 (Behavioral Compass)"
                            description={<>結合行為科學與數據視覺化的<strong className="text-gray-900">互動式決策工具</strong>，幫助使用者直觀地識別並校正投資心理偏誤。</>}
                            tags={['Behavioral-Finance', 'Data-Viz', 'React UI']}
                            keyFeatures="即時心理偏誤雷達圖、動態風險評估、視覺化決策校正提示"
                            techStack="React 19, Recharts, Tailwind CSS, Zustand"
                            impact="將抽象的心理學概念轉化為直觀的互動圖表，有效提升使用者的自我風險認知。"
                            imagePath="/assets/images/placeholder_abstract.png"
                            linkTo="/work/behavioral-lab"
                            demoLink="/lab/behavioral"
                        />
                    </div>
                </section>

                {/* Lab Section (絕對對齊的 4 欄佈局) */}
                <section id="lab" className="flex flex-col gap-8 scroll-mt-24 mb-16 w-full">
                    <div className="flex items-end justify-between border-b border-gray-200 pb-6">
                        <div>
                            <h2 className="text-3xl font-black text-[#111418] tracking-tight">工程實驗室與概念驗證 (PoCs) <span className="text-blue-600">.</span></h2>
                            <p className="text-gray-500 mt-2 font-medium">實驗性前端介面、3D 渲染與 AI 互動原型。</p>
                        </div>
                    </div>

                    {/* lg:grid-cols-4 確保在大螢幕上剛好 4 個一排，大小完全相同 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* 1. AI 投資行為診斷室 */}
                        <LabCard
                            title="AI 投資行為診斷室"
                            tag="Gemini API"
                            color="blue"
                            description="透過互動式問卷與生成式 AI，深度解析投資者的心理特質與潛在認知偏誤。"
                            linkTo="/lab/diagnosis"
                            imagePath="/assets/images/diagnosis_thumb.png"
                        />

                        {/* 2. Hand Gesture Zoom */}
                        <LabCard
                            title="Hand Gesture Zoom"
                            tag="TensorFlow.js"
                            color="purple"
                            description="利用視訊鏡頭即時追蹤手部距離邏輯，實現無接觸控制 UI 縮放。"
                            linkTo="/lab/hand-gesture"
                            imagePath="/assets/images/lab_hand.png"
                        />

                        {/* 3. BREEZEMASTER 3D */}
                        <LabCard
                            title="BREEZEMASTER 3D"
                            tag="Three.js"
                            color="orange"
                            description="結合 WebGL 渲染與動態自然風運算邏輯的互動式 3D 風扇模擬器。"
                            linkTo="/lab/breeze3d"
                            imagePath="/assets/images/lab_3d.png"
                        />

                        {/* 4. Retro Arcade */}
                        <LabCard
                            title="Retro Arcade"
                            tag="Canvas API"
                            color="green"
                            description="使用純 JavaScript 重現經典小精靈與俄羅斯方塊，實踐核心渲染迴圈。"
                            linkTo="/lab/pacman"
                            imagePath="/assets/images/lab_arcade.png"
                        />
                    </div>
                </section>

            </div>
        </div>
    );
}