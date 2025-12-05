//Navbar.tsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Cart, Category } from '../types';
import {
    ShoppingBag, Menu, X, LogOut, Settings,
    Package, Shield, Users, ChevronDown, Tag, Search, User
} from 'lucide-react';

const FAQS = [
    { id: 1, title: '如何購買？', link: '/faq/how-to-buy' },
    { id: 2, title: '運送方式', link: '/faq/shipping' },
    { id: 3, title: '退換貨政策', link: '/faq/return' },
];

export default function Navbar() {
    const { token, logout, user } = useAuthStore();
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
        enabled: !!token,
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

    const handleLogout = () => {
        logout();
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

    return (
        <header className="w-full bg-white shadow-sm sticky top-0 z-50">
            {/* ========================================== */}
            {/* 第一排：Main Header (Logo, User, Cart) */}
            {/* ========================================== */}
            <div className="border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between relative">

                    {/* 手機版漢堡按鈕 */}
                    <div className="md:hidden z-10">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1">
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Logo */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none md:flex-shrink-0">
                        <Link to="/" className="text-2xl font-extrabold tracking-tighter flex items-center gap-2">
                            <div className="bg-black text-white p-1 rounded">M</div>
                            MyShop
                        </Link>
                    </div>

                    {/* 右側功能區 */}
                    <div className="flex items-center gap-1 md:gap-3 z-10">
                        {token && isStaff && (
                            <div className="hidden md:block mr-4 border-r pr-4 border-gray-300">
                                <div className="group relative">
                                    <button className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-black uppercase tracking-wide py-2">
                                        後台管理 <ChevronDown size={14} />
                                    </button>
                                    <div className="absolute top-full right-0 w-48 bg-white border border-gray-100 shadow-xl rounded-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50">
                                        <div className="px-4 py-2 text-xs font-bold text-gray-400 border-b border-gray-50">管理功能</div>
                                        <Link to="/admin/products" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black"><Package size={16} /> 商品管理</Link>
                                        <Link to="/admin/categories" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black"><Tag size={16} /> 分類管理</Link>
                                        <Link to="/admin/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black"><Shield size={16} /> 訂單管理</Link>
                                        {user?.role === 'DEVELOPER' && (
                                            <Link to="/admin/users" className="flex items-center gap-2 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 border-t border-gray-50 mt-1"><Users size={16} /> 帳號管理</Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 購物車 */}
                        <Link to="/cart" className="relative p-2 text-slate-800 hover:bg-gray-100 rounded-full transition" title="購物車">
                            <ShoppingBag size={24} />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* [修改] 我的訂單 (移到這裡) */}
                        {token && (
                            <Link to="/orders" className="relative p-2 text-slate-800 hover:bg-gray-100 rounded-full transition" title="我的訂單">
                                <Package size={26} />
                            </Link>
                        )}

                        {/* 使用者 Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            {user ? (
                                <button
                                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                    className="flex items-center justify-center w-9 h-9 rounded-full text-gray-700 hover:bg-gray-100 transition focus:outline-none"
                                >
                                    {/* 外部按鈕維持 User Icon */}
                                    <User size={26} />
                                </button>
                            ) : (
                                <Link to="/login" className="text-sm font-bold px-3 py-2 rounded-md hover:bg-gray-100 transition">登入</Link>
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
            <div className="hidden md:block border-b bg-white">
                <div className="max-w-7xl mx-auto px-4 h-12 flex items-center relative">
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-8 text-sm font-medium h-full items-center">
                        <Link to="/?sort=new" className="hover:text-blue-600 transition-colors">最新商品</Link>

                        <div className="group relative h-full flex items-center">
                            <button className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer h-full">
                                商品分類 <ChevronDown size={14} />
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 bg-white border shadow-lg rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-40 translate-y-2 group-hover:translate-y-0">
                                {categories?.map(cat => (
                                    <Link key={cat.id} to={`/?categoryId=${cat.id}`} className="block px-4 py-2 hover:bg-gray-50 text-gray-600 hover:text-black">
                                        {cat.name}
                                    </Link>
                                ))}
                                {categories?.length === 0 && <div className="px-4 py-2 text-gray-400 text-xs">暫無分類</div>}
                            </div>
                        </div>

                        <div className="group relative h-full flex items-center">
                            <button className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer h-full">
                                常見問題 <ChevronDown size={14} />
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 bg-white border shadow-lg rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-40 translate-y-2 group-hover:translate-y-0">
                                {FAQS.map(faq => (
                                    <Link key={faq.id} to={faq.link} className="block px-4 py-2 hover:bg-gray-50 text-gray-600 hover:text-black">
                                        {faq.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="relative w-64 ml-auto">
                        <input
                            type="text"
                            placeholder="搜尋商品..."
                            className="w-full bg-gray-100 text-sm border border-transparent rounded-full py-1.5 pl-4 pr-10 focus:bg-white focus:border-gray-300 focus:ring-0 transition-all outline-none"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <button type="submit" className="absolute right-2 top-1.5 text-gray-400 hover:text-black">
                            <Search size={16} />
                        </button>
                    </form>
                </div>
            </div>

            {/* ========================================== */}
            {/* Mobile Drawer (手機版側邊選單) */}
            {/* ========================================== */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-b h-[calc(100vh-64px)] overflow-y-auto">
                    <div className="p-4 space-y-1">

                        <form onSubmit={handleSearch} className="mb-4 relative">
                            <input
                                type="text"
                                placeholder="搜尋商品..."
                                className="w-full bg-gray-100 border-none rounded-lg py-2 pl-4 pr-10 focus:ring-2 focus:ring-black outline-none"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <button type="submit" className="absolute right-3 top-2 text-gray-500">
                                <Search size={20} />
                            </button>
                        </form>

                        <Link to="/?sort=new" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-lg font-bold text-gray-900 border-b border-gray-100">
                            最新商品
                        </Link>

                        <div>
                            <button onClick={() => setMobileExpandCategory(!mobileExpandCategory)} className="w-full flex justify-between items-center px-4 py-3 text-lg font-bold text-gray-900 border-b border-gray-100">
                                <span>商品分類</span>
                                <ChevronDown size={20} className={`transition-transform ${mobileExpandCategory ? 'rotate-180' : ''}`} />
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
                            <button onClick={() => setMobileExpandFaq(!mobileExpandFaq)} className="w-full flex justify-between items-center px-4 py-3 text-lg font-bold text-gray-900 border-b border-gray-100">
                                <span>常見問題</span>
                                <ChevronDown size={20} className={`transition-transform ${mobileExpandFaq ? 'rotate-180' : ''}`} />
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
            )}
        </header>
    );
}