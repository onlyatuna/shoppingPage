import { ArrowRight, ExternalLink, Lightbulb, Server, Zap } from 'lucide-react';
import React from 'react';

interface CaseStudyCardProps {
    title: string;
    description: React.ReactNode;
    tags: string[];
    keyFeatures?: React.ReactNode;
    techStack?: React.ReactNode;
    impact?: React.ReactNode;
    imagePath?: string;
    linkTo: string;
    demoLink?: string;
    reverse?: boolean;
}

export default function CaseStudyCard({ title, description, tags, keyFeatures, techStack, impact, imagePath, linkTo, demoLink, reverse = false }: CaseStudyCardProps) {
    return (
        <div className={`group bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} hover:border-blue-100 transition-colors duration-300`}>
            <div
                className="lg:w-7/12 relative min-h-[360px] lg:min-h-[500px] bg-gray-50 overflow-hidden cursor-pointer"
                onClick={() => window.open(linkTo, '_blank')}
            >
                {imagePath ? (
                    <div
                        className="absolute inset-0 bg-cover bg-top transition-transform duration-700 group-hover:scale-[1.02]"
                        style={{ backgroundImage: `url(${imagePath})` }}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 font-bold text-xl transition-transform duration-700 group-hover:scale-[1.02]">
                        預覽圖片
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
            </div>
            <div className="lg:w-5/12 p-8 lg:p-12 flex flex-col justify-center gap-8 bg-white relative z-10">
                <div className="flex gap-2 flex-wrap">
                    {tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">#{tag}</span>
                    ))}
                </div>
                <div>
                    <h2
                        className="text-3xl md:text-4xl font-bold text-[#111418] mb-4 tracking-tight cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => window.open(linkTo, '_blank')}
                    >
                        {title}
                    </h2>
                    <p className="text-slate-600 leading-relaxed text-lg mb-6">
                        {description}
                    </p>

                    <div className="flex flex-col gap-4 text-sm text-gray-700 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                        {keyFeatures && (
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-amber-50 text-amber-500 rounded-lg shrink-0 mt-0.5 shadow-sm border border-amber-100/50"><Lightbulb size={20} strokeWidth={2} /></div>
                                <div>
                                    <span className="font-bold text-gray-900 block mb-1">核心亮點</span>
                                    <span className="text-gray-600 leading-relaxed block">{keyFeatures}</span>
                                </div>
                            </div>
                        )}
                        {techStack && (
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg shrink-0 mt-0.5 shadow-sm border border-indigo-100/50"><Server size={20} strokeWidth={2} /></div>
                                <div>
                                    <span className="font-bold text-gray-900 block mb-1">系統架構</span>
                                    <span className="text-gray-600 leading-relaxed block">{techStack}</span>
                                </div>
                            </div>
                        )}
                        {impact && (
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg shrink-0 mt-0.5 shadow-sm border border-emerald-100/50"><Zap size={20} strokeWidth={2} /></div>
                                <div>
                                    <span className="font-bold text-gray-900 block mb-1">商業效益</span>
                                    <span className="text-gray-600 leading-relaxed block">{impact}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <button onClick={() => window.open(linkTo, '_blank')} className="flex-1 h-14 rounded-xl bg-[#2463eb] text-white font-bold text-base hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 hover:-translate-y-0.5">
                        閱讀完整案例 <ArrowRight size={18} />
                    </button>
                    {demoLink && (
                        <button onClick={() => window.open(demoLink, '_blank')} className="h-14 w-14 flex-shrink-0 rounded-xl border border-gray-200 flex items-center justify-center text-[#111418] hover:bg-gray-50 hover:border-gray-300 transition-all">
                            <ExternalLink size={24} strokeWidth={1.5} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
