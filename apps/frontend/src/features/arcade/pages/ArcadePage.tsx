import React, { useState } from 'react';
import { ChevronLeft, Gamepad2, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// 這裡假設你已經將原先遊戲的 App.tsx 改名為組件導出
import TetrisGame from '../tetris/TetrisGame'; 
import PacmanGame from '../pacman/PacmanGame';

const ArcadePage = () => {
    const [activeGame, setActiveGame] = useState<'MENU' | 'TETRIS' | 'PACMAN'>('MENU');
    const navigate = useNavigate();

    // 如果正在遊戲中，顯示退出按鈕
    const BackToMenu = () => (
        <button 
            onClick={() => setActiveGame('MENU')}
            className="fixed top-6 left-6 z-50 bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full backdrop-blur-md border border-white/20 transition-all font-bold flex items-center gap-2"
        >
            <ChevronLeft size={18} /> 結束遊戲
        </button>
    );

    if (activeGame === 'TETRIS') return <><BackToMenu /><TetrisGame /></>;
    if (activeGame === 'PACMAN') return <><BackToMenu /><PacmanGame /></>;

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-8">
            <button 
                onClick={() => navigate('/')}
                className="absolute top-8 left-8 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
            >
                <ChevronLeft size={20} /> 返回作品集
            </button>

            <div className="text-center mb-16">
                <h1 className="text-5xl font-black text-white mb-4 tracking-tighter italic">
                    RETRO <span className="text-cyan-500">ARCADE</span>
                </h1>
                <p className="text-slate-500 uppercase tracking-[0.3em] text-xs">Select a classic to start</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* Tetris 入口 */}
                <div 
                    onClick={() => setActiveGame('TETRIS')}
                    className="group cursor-pointer relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all p-10 flex flex-col items-center gap-6 shadow-2xl"
                >
                    <div className="w-20 h-20 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                        <LayoutGrid size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Neon Tetris</h2>
                </div>

                {/* Pacman 入口 */}
                <div 
                    onClick={() => setActiveGame('PACMAN')}
                    className="group cursor-pointer relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 hover:border-yellow-500/50 transition-all p-10 flex flex-col items-center gap-6 shadow-2xl"
                >
                    <div className="w-20 h-20 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform">
                        <Gamepad2 size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Pac-Man Classic</h2>
                </div>
            </div>
        </div>
    );
};

export default ArcadePage;