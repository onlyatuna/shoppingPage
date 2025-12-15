import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, MapPin } from 'lucide-react';
import SakuraPetal from './SakuraPetal';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#5A9EA3] text-white pt-16 pb-8 relative overflow-hidden">
            {/* Sakura Petals Decoration - Removed */}

            {/* [New] Falling Sakura Petals */}
            <SakuraPetal className="absolute -top-10 left-[20%] opacity-40" size={24} delay={0} duration={10} color="text-pink-300" animationType="fall" />
            <SakuraPetal className="absolute -top-10 right-[30%] opacity-40" size={18} delay={4} duration={12} color="text-pink-200" animationType="fall" />
            <SakuraPetal className="absolute -top-10 left-[60%] opacity-30" size={26} delay={2} duration={15} color="text-pink-100" animationType="fall" />

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 mb-12">
                    {/* Brand Section */}
                    <div className="col-span-2 md:col-span-1 space-y-4">
                        <Link to="/" className="text-2xl font-extrabold tracking-tighter flex items-center gap-2">
                            <img src="/icon.png" alt="Logo" className="w-8 h-8 object-contain rounded" />
                            <span className="text-[#F5F0E6]">MiniShop</span>
                        </Link>
                        <p className="text-white/90 text-sm leading-relaxed">
                            我們致力於提供最優質的商品與服務，為您的生活增添品味與質感。探索我們的精選系列，發現更多美好。
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-white/80 hover:text-pale-cyan transition-colors transform hover:scale-110 duration-200">
                                <Facebook size={20} />
                            </a>
                            <a href="#" className="text-white/80 hover:text-pale-cyan transition-colors transform hover:scale-110 duration-200">
                                <Instagram size={20} />
                            </a>
                            <a href="#" className="text-white/80 hover:text-pale-cyan transition-colors transform hover:scale-110 duration-200">
                                <Twitter size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-white mb-4">探索商店</h3>
                        <ul className="space-y-2">
                            <li><Link to="/?sort=new" className="text-white/90 hover:text-pale-cyan text-sm transition-colors">最新商品</Link></li>
                            <li><Link to="/?sort=popular" className="text-white/90 hover:text-pale-cyan text-sm transition-colors">熱銷排行</Link></li>
                            <li><Link to="/categories" className="text-white/90 hover:text-pale-cyan text-sm transition-colors">所有分類</Link></li>
                            <li><Link to="/about" className="text-white/90 hover:text-pale-cyan text-sm transition-colors">關於我們</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-bold text-white mb-4">客戶服務</h3>
                        <ul className="space-y-2">
                            <li><Link to="/faq/shipping" className="text-white/90 hover:text-pale-cyan text-sm transition-colors">運送說明</Link></li>
                            <li><Link to="/faq/return" className="text-white/90 hover:text-pale-cyan text-sm transition-colors">退換貨政策</Link></li>
                            <li><Link to="/faq/privacy" className="text-white/90 hover:text-pale-cyan text-sm transition-colors">隱私權條款</Link></li>
                            <li><Link to="/contact" className="text-white/90 hover:text-pale-cyan text-sm transition-colors">聯絡我們</Link></li>
                        </ul>
                    </div>

                    {/* Contact & Newsletter */}
                    <div className="col-span-2 md:col-span-1">
                        <h3 className="font-bold text-white mb-4">訂閱電子報</h3>
                        <p className="text-white/90 text-sm mb-4">訂閱以獲得第一手優惠資訊與新品通知。</p>
                        <form className="flex mb-6 gap-2" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="您的 Email"
                                className="flex-1 h-9 bg-white text-sm border-2 border-[#1A2B42] rounded-lg px-3 text-[#1A2B42] placeholder-gray-400 outline-none shadow-[4px_4px_0px_#1A2B42] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_#1A2B42] transition-all"
                            />
                            <button type="submit" className="h-9 w-20 flex items-center justify-between px-4 bg-[#E85D3F] text-white rounded-lg border-2 border-[#1A2B42] text-sm font-bold shadow-[4px_4px_0px_#1A2B42] hover:opacity-90 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#1A2B42] transition-all">
                                <span>訂</span>
                                <span>閱</span>
                            </button>
                        </form>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-white/90 text-sm">
                                <MapPin size={16} />
                                <span>台北市信義區快樂路 123 號</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/90 text-sm">
                                <Mail size={16} />
                                <span>support@minishop.com.tw</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-white opacity-60 text-xs">
                        &copy; {currentYear} MiniShop Inc. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link to="/terms" className="text-white opacity-60 hover:opacity-100 hover:text-pale-cyan text-xs transition-all">服務條款</Link>
                        <Link to="/privacy" className="text-white opacity-60 hover:opacity-100 hover:text-pale-cyan text-xs transition-all">隱私政策</Link>
                        <Link to="/cookie" className="text-white opacity-60 hover:opacity-100 hover:text-pale-cyan text-xs transition-all">Cookie 政策</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
