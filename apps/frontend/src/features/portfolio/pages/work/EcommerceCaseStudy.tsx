import { ArrowLeft, ExternalLink, Activity, Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EcommerceCaseStudy() {
    const navigate = useNavigate();

    return (
        <article className="w-full bg-white min-h-screen pb-24">
            {/* Hero Image / Banner */}
            <div className="w-full h-[40vh] md:h-[50vh] bg-gray-900 relative overflow-hidden flex items-center justify-center">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
                    style={{ backgroundImage: `url('/preview.png')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                <div className="relative z-10 text-center px-6">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full border border-blue-500/30 mb-6 inline-block backdrop-blur-sm">
                        E-Commerce & AI
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
                        AI ShopMaster
                    </h1>
                    <p className="text-xl text-gray-300 font-medium max-w-2xl mx-auto">
                        An intelligent dashboard automating product workflows with Generative AI.
                    </p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 lg:px-8 -mt-16 relative z-20">
                {/* Info Card */}
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 mb-16 flex flex-col md:flex-row gap-8 justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Role</h3>
                        <p className="font-medium text-gray-900">Frontend Architect & UI Designer</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Timeline</h3>
                        <p className="font-medium text-gray-900">4 Weeks</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tech Stack</h3>
                        <p className="font-medium text-gray-900">React 19, Vite, Gemini API, Tailwind</p>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-20 text-lg leading-relaxed text-gray-600">

                    {/* Context */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Target size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">Context</h2>
                        </div>
                        <p>
                            Modern e-commerce merchants spend an inordinate amount of time manually drafting product descriptions, managing inventory states, and handling checkout flows. The goal of AI ShopMaster was to build an administrative dashboard that not only looks clean and professional, but actively assists the merchant.
                        </p>
                    </section>

                    {/* Challenge */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Activity size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">The Challenge</h2>
                        </div>
                        <p className="mb-4">
                            Integrating Generative AI (Google Gemini) into a standard CRUD interface without making it feel like an afterthought. The UI needed to clearly distinguish between AI-generated content and user-input content.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-gray-300">
                            <li>Maintain a blisteringly fast React frontend while waiting for AI generation streams.</li>
                            <li>Design a checkout flow that seamlessly transitions from cart to Stripe payment.</li>
                            <li>Ensure responsive design across massive data tables.</li>
                        </ul>
                    </section>

                    {/* Solution */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Zap size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">The Solution</h2>
                        </div>
                        <p className="mb-6">
                            We architected a dashboard using standard React patterns enhanced by Tailwind CSS for rapid styling. The Gemini AI integration was encapsulated into a custom hook, providing realtime streaming text directly into the description fields.
                        </p>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col items-center justify-center min-h-[300px] mb-6">
                            <img src="/preview.png" alt="Dashboard Dashboard" className="rounded-xl shadow-md max-w-full h-auto" />
                        </div>
                    </section>
                </div>

                {/* Bottom CTA */}
                <div className="mt-24 pt-12 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-500 hover:text-gray-900 font-bold flex items-center gap-2 transition-colors"
                    >
                        <ArrowLeft size={18} /> Back to Portfolio
                    </button>

                    <button
                        onClick={() => window.open('/work/ecommerce/demo', '_blank')}
                        className="h-14 px-8 rounded-xl bg-[#2463eb] text-white font-bold text-base hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 hover:-translate-y-0.5 w-full sm:w-auto"
                    >
                        Launch Direct Demo <ExternalLink size={18} />
                    </button>
                </div>
            </main>
        </article>
    );
}
