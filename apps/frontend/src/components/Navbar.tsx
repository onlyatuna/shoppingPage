//Navbar.tsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Cart, Category } from '../types';
import {
    ShoppingBag, Menu, X, LogOut, Settings,
    Package, Shield, Users, ChevronDown, Tag, Search, User
} from 'lucide-react';
import SakuraPetal from './SakuraPetal';

const FAQS = [
    { id: 1, title: '如何購買？', link: '/faq/how-to-buy' },
    { id: 2, title: '運送方式', link: '/faq/shipping' },
    { id: 3, title: '退換貨政策', link: '/faq/return' },
];

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    // UI 狀態
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchInput, setSearchInput] = useState('');

    // 手機版折疊選單狀態
    const [mobileExpandCategory, setMobileExpandCategory] = useState(false);
    const [mobileExpandFaq, setMobileExpandFaq] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: cart } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Cart }>('/cart');
            return res.data.data;
        },
        enabled: !!user,
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Category[] }>('/categories');
            return res.data.data;
        }
    });

    const cartCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;
    const isStaff = user?.role === 'ADMIN' || user?.role === 'DEVELOPER';

    const handleLogout = async () => {
        await logout();
        setIsUserDropdownOpen(false);
        setIsMobileMenuOpen(false);
        navigate('/login');
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(`/?search=${encodeURIComponent(searchInput)}`);
        setIsMobileMenuOpen(false);
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 監聽路由變化，自動關閉手機版選單
    const location = useLocation();
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsUserDropdownOpen(false); // 切換頁面時也順便關閉使用者選單
    }, [location]);

    return (
        <header className="w-full bg-[#5A9EA3] sticky top-0 z-50 border-b-2 border-[#1D2D45]">
            {/* ========================================== */}
            {/* 第一排：Main Header (Logo, User, Cart) */}
            {/* ========================================== */}
            <div className="border-b border-[#1D2D45]/10 relative z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between relative">

                    {/* 手機版漢堡按鈕 */}
                    <div className="md:hidden z-10">
                        <button type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 text-white" aria-label={isMobileMenuOpen ? "關閉選單" : "開啟選單"}>
                            {isMobileMenuOpen ? <X size={24} color="black" /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Logo */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none md:flex-shrink-0">
                        <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-extrabold tracking-tighter flex items-center gap-2 text-white relative">
                            <div className="bg-paper-white text-vintage-navy p-1 rounded">M</div>
                            {/* Sakura Petal Decoration */}
                            <SakuraPetal className="absolute -top-2 -right-3 -rotate-12 opacity-80" size={20} delay={0} duration={4} />
                        </Link>
                    </div>

                    {/* 右側功能區 */}
                    <div className="flex items-center gap-1 md:gap-3 z-10">
                        {user && isStaff && (
                            <div className="hidden md:block mr-4 border-r pr-4 border-white/20">
                                <div className="group relative">
                                    <button type="button" className="flex items-center gap-1 text-xs font-bold text-white hover:text-[#1D2D45] uppercase tracking-wide py-2 transition-colors">
                                        後台管理 <ChevronDown size={14} />
                                    </button>
                                    <div className="absolute top-full right-0 w-48 bg-white border-2 border-[#1D2D45] shadow-[4px_4px_0px_#1D2D45] rounded-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50 text-left">
                                        <div className="px-4 py-2 text-xs font-bold text-gray-400 border-b border-gray-50">管理功能</div>
                                        <Link to="/admin/products" className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#1D2D45] hover:bg-gray-50 hover:text-[#E85D3F] font-medium"><Package size={16} /> 商品管理</Link>
                                        <Link to="/admin/categories" className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#1D2D45] hover:bg-gray-50 hover:text-[#E85D3F] font-medium"><Tag size={16} /> 分類管理</Link>
                                        <Link to="/admin/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#1D2D45] hover:bg-gray-50 hover:text-[#E85D3F] font-medium"><Shield size={16} /> 訂單管理</Link>
                                        {user?.role === 'DEVELOPER' && (
                                            <Link to="/admin/users" className="flex items-center gap-2 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 border-t border-gray-50 mt-1"><Users size={16} /> 帳號管理</Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 購物車 */}
                        <Link to="/cart" className="relative p-2 text-white hover:text-[#1D2D45] transition-colors" title="購物車">
                            <ShoppingBag size={24} />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#E85D3F] rounded-full flex items-center justify-center border-2 border-[#1D2D45]">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* 我的訂單 */}
                        {user && (
                            <Link to="/orders" className="relative p-2 text-white hover:text-[#1D2D45] transition-colors" title="我的訂單">
                                <Package size={26} />
                            </Link>
                        )}

                        {/* 使用者 Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            {user ? (
                                <button
                                    type="button"
                                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                    className="flex items-center justify-center w-9 h-9 rounded-full text-white hover:text-[#1D2D45] transition-colors focus:outline-none"
                                    aria-label="使用者選單"
                                >
                                    {/* 外部按鈕維持 User Icon */}
                                    <User size={26} />
                                </button>
                            ) : (
                                <Link to="/login" className="text-sm font-bold px-3 py-2 rounded-md text-white hover:text-[#1D2D45] transition-colors">登入</Link>
                            )}

                            {isUserDropdownOpen && user && (
                                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

                                    {/* [修改] Dropdown Header 放入圓形頭像 */}
                                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                                        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full text-sm font-bold text-gray-700">
                                            {user.name?.[0] || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{user.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="py-1">
                                        <Link to="/profile" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                            <Settings size={16} /> 帳號設定
                                        </Link>

                                        {/* 我的訂單已經移出去了，這裡可以拿掉，或者保留做為備用 */}
                                        {/* <Link to="/orders" ... >我的訂單</Link> */}

                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left">
                                            <LogOut size={16} /> 登出
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================== */}
            {/* 第二排：Sub Navbar (Desktop Only) */}
            {/* ========================================== */}
            <div className="hidden md:block border-b bg-[#5A9EA3] border-white/10">
                <div className="max-w-7xl mx-auto px-4 h-12 flex items-center relative">
                    {/* Centered Navigation Links */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-8 text-base font-bold h-full items-center text-white">
                        <Link to="/?sort=new" className="hover:text-[#1D2D45] transition-colors">最新商品</Link>
                        <Link to="/?sort=popular" className="hover:text-[#1D2D45] transition-colors">熱銷排行</Link>
                        <div className="group relative h-full flex items-center">
                            <button type="button" className="flex items-center gap-1 hover:text-[#1D2D45] transition-colors cursor-pointer h-full">
                                商品分類 <ChevronDown size={14} />
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 bg-white border-2 border-[#1D2D45] shadow-[4px_4px_0px_#1D2D45] rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-40 translate-y-2 group-hover:translate-y-0 text-left">
                                {categories?.map(cat => (
                                    <Link key={cat.id} to={`/?categoryId=${cat.id}`} className="block px-4 py-2 hover:bg-gray-50 text-[#1D2D45] hover:text-[#E85D3F] font-medium border-b border-dashed border-gray-100 last:border-0">
                                        {cat.name}
                                    </Link>
                                ))}
                                {categories?.length === 0 && <div className="px-4 py-2 text-gray-400 text-xs">暫無分類</div>}
                            </div>
                        </div>
                        <Link to="/about" className="hover:text-[#1D2D45] transition-colors">關於我們</Link>
                    </div>

                    {/* Right-aligned Search Form */}
                    <form onSubmit={handleSearch} className="relative w-64 ml-auto">
                        <input
                            type="text"
                            placeholder="搜尋商品..."
                            className="relative z-10 w-full bg-white text-sm border-2 border-[#1D2D45] rounded-lg py-1.5 pl-4 pr-10 shadow-[4px_4px_0px_#1D2D45] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_#1D2D45] focus:bg-white focus:border-[#1D2D45] focus:ring-0 transition-all outline-none placeholder-gray-400 font-medium"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <button type="submit" className="absolute right-2 top-1.5 z-20 text-gray-400 hover:text-[#1D2D45] transition-colors" aria-label="搜尋">
                            <Search size={16} />
                        </button>
                    </form>
                </div>
            </div>

            {/* ========================================== */}
            {/* Mobile Drawer (手機版側邊選單) */}
            {/* ========================================== */}
            {
                isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-b h-[calc(100vh-64px)] overflow-y-auto">
                        <div className="p-4 space-y-1">

                            <form onSubmit={handleSearch} className="mb-4 relative">
                                <input
                                    type="text"
                                    placeholder="搜尋商品..."
                                    className="w-full bg-white border-2 border-[#1D2D45] rounded-lg py-2 pl-4 pr-10 shadow-[4px_4px_0px_#1D2D45] focus:ring-0 outline-none"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                                <button type="submit" className="absolute right-3 top-2 text-gray-500" aria-label="搜尋">
                                    <Search size={20} />
                                </button>
                            </form>

                            <Link to="/?sort=new" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-lg font-bold text-gray-900 border-b border-gray-100">
                                最新商品
                            </Link>

                            <div>
                                <button type="button" onClick={() => setMobileExpandCategory(!mobileExpandCategory)} className="w-full flex justify-between items-center px-4 py-3 text-lg font-bold text-gray-900 border-b border-gray-100">
                                    <span>商品分類</span>
                                </button>
                                {mobileExpandCategory && (
                                    <div className="bg-gray-50 px-4 py-2 space-y-2">
                                        {categories?.map(cat => (
                                            <Link key={cat.id} to={`/?categoryId=${cat.id}`} onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-gray-600 pl-2 border-l-2 border-transparent hover:border-black">
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <button type="button" onClick={() => setMobileExpandFaq(!mobileExpandFaq)} className="w-full flex justify-between items-center px-4 py-3 text-lg font-bold text-gray-900 border-b border-gray-100">
                                    <span>常見問題</span>
                                </button>
                                {mobileExpandFaq && (
                                    <div className="bg-gray-50 px-4 py-2 space-y-2">
                                        {FAQS.map(faq => (
                                            <Link key={faq.id} to={faq.link} onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-gray-600 pl-2 border-l-2 border-transparent hover:border-black">
                                                {faq.title}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {isStaff && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <p className="px-4 text-xs font-bold text-gray-400 uppercase mb-2">後台管理</p>
                                    <div className="grid grid-cols-2 gap-2 px-2">
                                        <Link to="/admin/products" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700"><Package className="mb-1" size={20} /> 商品</Link>
                                        <Link to="/admin/categories" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700"><Tag className="mb-1" size={20} /> 分類</Link>
                                        <Link to="/admin/orders" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700"><Shield className="mb-1" size={20} /> 訂單</Link>
                                        {user.role === 'DEVELOPER' && (
                                            <Link to="/admin/users" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center justify-center p-3 bg-green-50 text-green-800 rounded-lg text-sm font-medium"><Users className="mb-1" size={20} /> 帳號</Link>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!user && (
                                <div className="p-4 mt-4">
                                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full bg-black text-white text-center py-3 rounded-lg font-bold">登入 / 註冊</Link>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </header >
    );
}