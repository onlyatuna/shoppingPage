import { Terminal, Github, Linkedin, Mail, ChevronLeft } from 'lucide-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

export default function PortfolioLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    // Show back button if we are in a demo, case study, or lab page, but NOT the home page
    const isHomePage = location.pathname === '/';
    const showBackButton = !isHomePage;

    return (
        <div className="min-h-screen bg-[#f6f6f8] text-[#111418] font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col">

            {/* Global Navbar */}
            <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[#e2e8f0] bg-white/90 px-6 py-4 backdrop-blur-md lg:px-10">
                <div className="flex items-center gap-6">
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <div className="flex size-9 items-center justify-center rounded-xl bg-[#111621] text-white shadow-sm">
                            <Terminal size={20} />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-[#111418] hidden sm:block">Chen.dev</span>
                    </div>

                    {showBackButton && (
                        <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
                    )}

                    {showBackButton && (
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
                        >
                            <ChevronLeft size={16} />
                            Back
                        </button>
                    )}
                </div>

                {/* Desktop Nav Links (Only show on home or if we want standard nav everywhere) */}
                <div className="hidden gap-8 md:flex items-center">
                    <a href="/#work" onClick={(e) => { if (isHomePage) { e.preventDefault(); document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }) } }} className="text-sm font-medium text-[#111418] hover:text-blue-600 transition-colors">Work</a>
                    <a href="/#lab" onClick={(e) => { if (isHomePage) { e.preventDefault(); document.getElementById('lab')?.scrollIntoView({ behavior: 'smooth' }) } }} className="text-sm font-medium text-[#64748b] hover:text-blue-600 transition-colors">Lab</a>
                </div>

                <button
                    onClick={() => {
                        if (isHomePage) {
                            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                        } else {
                            window.location.href = "mailto:your@email.com";
                        }
                    }}
                    className="flex h-10 items-center justify-center rounded-lg bg-[#2463eb] px-5 text-sm font-bold text-white transition-all hover:bg-blue-700 shadow-sm shadow-blue-200"
                >
                    Contact Me
                </button>
            </nav>

            {/* Page Content */}
            <div className="flex-1 w-full">
                <Outlet />
            </div>

            {/* Global Footer */}
            <footer id="contact" className="mt-auto bg-white border-t border-gray-200 py-12 px-6 lg:px-10 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 w-full">
                <p>© {new Date().getFullYear()} Chen.dev. All rights reserved.</p>
                <div className="flex gap-8 mt-4 md:mt-0">
                    <a href="#" className="hover:text-blue-600 transition-colors"><Linkedin size={20} /></a>
                    <a href="https://github.com/onlyatuna" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors"><Github size={20} /></a>
                    <a href="mailto:your@email.com" className="hover:text-blue-600 transition-colors"><Mail size={20} /></a>
                </div>
            </footer>
        </div>
    );
}
