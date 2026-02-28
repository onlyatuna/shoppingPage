import { ArrowLeft, ExternalLink, Activity, Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PensionCaseStudy() {
    const navigate = useNavigate();

    return (
        <article className="w-full bg-white min-h-screen pb-24">
            {/* Hero Banner */}
            <div className="w-full h-[40vh] md:h-[50vh] bg-emerald-900 relative overflow-hidden flex items-center justify-center">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
                    style={{ backgroundImage: `url('/assets/images/pension_preview.png')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 to-transparent" />
                <div className="relative z-10 text-center px-6">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30 mb-6 inline-block backdrop-blur-sm">
                        FinTech & Data Viz
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
                        Pension Gap Calculator
                    </h1>
                    <p className="text-xl text-emerald-100/80 font-medium max-w-2xl mx-auto">
                        Visualizing retirement trajectories and saving gaps through interactive analytics.
                    </p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 lg:px-8 -mt-16 relative z-20">
                {/* Info Card */}
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-emerald-50 mb-16 flex flex-col md:flex-row gap-8 justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Role</h3>
                        <p className="font-medium text-gray-900">Frontend Engineer</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Timeline</h3>
                        <p className="font-medium text-gray-900">2 Weeks</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tech Stack</h3>
                        <p className="font-medium text-gray-900">React, Recharts, TailwindCSS</p>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-20 text-lg leading-relaxed text-gray-600">

                    {/* Context */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Target size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">Context</h2>
                        </div>
                        <p>
                            Retirement planning is often abstract and heavily jargon-laden. The Pension Gap Calculator aims to demystify to users exactly how much they need to save versus what their mandatory state and occupational pensions will provide.
                        </p>
                    </section>

                    {/* Challenge */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Activity size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">The Challenge</h2>
                        </div>
                        <p className="mb-4">
                            Creating an intuitive interface for a complex, progressive tax/pension calculating engine.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-gray-300">
                            <li>Translating statutory calculation formulas into frontend logic accurately.</li>
                            <li>Building responsive, dynamic charts that auto-scale based on salary inputs.</li>
                            <li>Ensuring the "Gap" visualization felt alarming enough to act upon, but not overwhelmingly discouraging.</li>
                        </ul>
                    </section>

                    {/* Solution */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Zap size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">The Solution</h2>
                        </div>
                        <p className="mb-6">
                            Using Recharts, we developed a stacked bar system representing the "Three Pillars". A clean multi-step form gathers the necessary user data progressively to avoid cognitive overload.
                        </p>
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
                        onClick={() => window.open('/work/pension/demo', '_blank')}
                        className="h-14 px-8 rounded-xl bg-emerald-600 text-white font-bold text-base hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:-translate-y-0.5 w-full sm:w-auto"
                    >
                        Launch Direct Demo <ExternalLink size={18} />
                    </button>
                </div>
            </main>
        </article>
    );
}
