//LoginPage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ShoppingBag, ArrowRight, Loader2, Lock, Mail, User, ArrowLeft } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/authStore';

// --- 驗證規則 Schema ---
const loginSchema = z.object({
    email: z.string().email('Email 格式錯誤'),
    password: z.string().min(1, '請輸入密碼'),
});

const registerSchema = z.object({
    name: z.string().min(2, '名字至少 2 個字元'),
    email: z.string().email('Email 格式錯誤'),
    password: z.string().min(6, '密碼至少 6 個字元'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "密碼不一致",
    path: ["confirmPassword"],
});

export default function AuthPage() {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const navigate = useNavigate();
    const { login } = useAuthStore();

    // --- 登入表單邏輯 ---
    const {
        register: registerLogin,
        handleSubmit: handleLoginSubmit,
        formState: { isSubmitting: isLoginSubmitting, errors: loginErrors }
    } = useForm({ resolver: zodResolver(loginSchema) });

    // --- 註冊表單邏輯 ---
    const {
        register: registerReg,
        handleSubmit: handleRegSubmit,
        formState: { isSubmitting: isRegSubmitting, errors: regErrors }
    } = useForm({ resolver: zodResolver(registerSchema as any) });

    // 處理登入 API
    const onLogin = async (data: any) => {
        try {
            const res = await apiClient.post('/auth/login', data);
            const { token, user } = res.data.data;
            login(token, user);
            toast.success(`歡迎回來，${user.name}`);
            navigate('/');
        } catch (error: any) {
            toast.error(error.response?.data?.message || '登入失敗');
        }
    };

    // 處理註冊 API
    const onRegister = async (data: any) => {
        try {
            await apiClient.post('/auth/register', {
                name: data.name,
                email: data.email,
                password: data.password
            });
            toast.success('註冊成功！請至信箱收取驗證信');
            // 自動切換回登入模式 (滑動動畫)
            setIsLoginMode(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || '註冊失敗');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">

            {/* 主容器：設定固定寬高與陰影 */}
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-[1000px] min-h-[600px] flex">

                {/* ============================================================ */}
                {/* 1. 註冊表單 (位於左側，當 isLoginMode=false 時顯示) */}
                {/* ============================================================ */}
                <div className={`absolute top-0 left-0 h-full w-full lg:w-1/2 flex flex-col justify-center p-10 transition-all duration-700 ease-in-out ${!isLoginMode ? 'opacity-100 z-20 translate-x-0' : 'opacity-0 z-10 translate-x-full lg:translate-x-0'
                    } ${isLoginMode ? 'pointer-events-none' : ''}`}> {/* pointer-events-none 防止點擊到隱藏的表單 */}

                    <form onSubmit={handleRegSubmit(onRegister)} className="w-full max-w-md mx-auto space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-gray-900">建立新帳號</h2>
                            <p className="text-sm text-gray-500 mt-2">加入我們，開始購物之旅</p>
                        </div>

                        {/* 手機版切換按鈕 */}
                        <div className="lg:hidden text-center mb-4">
                            <button type="button" onClick={() => setIsLoginMode(true)} className="text-sm text-blue-600 underline">
                                已有帳號？去登入
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input {...registerReg('name')} type="text" placeholder="姓名" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition" />
                                {regErrors.name && <p className="text-red-500 text-xs mt-1">{(regErrors.name as any).message}</p>}
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input {...registerReg('email')} type="email" placeholder="Email" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition" />
                                {regErrors.email && <p className="text-red-500 text-xs mt-1">{(regErrors.email as any).message}</p>}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input {...registerReg('password')} type="password" placeholder="密碼" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition" />
                                {regErrors.password && <p className="text-red-500 text-xs mt-1">{(regErrors.password as any).message}</p>}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input {...registerReg('confirmPassword')} type="password" placeholder="確認密碼" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition" />
                                {regErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{(regErrors.confirmPassword as any).message}</p>}
                            </div>
                        </div>

                        <button type="submit" disabled={isRegSubmitting} className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition flex justify-center items-center gap-2">
                            {isRegSubmitting ? <Loader2 className="animate-spin" /> : '註冊'}
                        </button>
                    </form>
                </div>

                {/* ============================================================ */}
                {/* 2. 登入表單 (位於右側，當 isLoginMode=true 時顯示) */}
                {/* ============================================================ */}
                <div className={`absolute top-0 left-0 lg:left-1/2 h-full w-full lg:w-1/2 flex flex-col justify-center p-10 transition-all duration-700 ease-in-out ${isLoginMode ? 'opacity-100 z-20' : 'opacity-0 z-10'
                    } ${!isLoginMode ? 'pointer-events-none' : ''}`}>

                    <form onSubmit={handleLoginSubmit(onLogin)} className="w-full max-w-md mx-auto space-y-6">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-xl mb-4">
                                <ShoppingBag size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">歡迎回來</h2>
                            <p className="text-sm text-gray-500 mt-2">請輸入您的帳號密碼以繼續購物</p>
                        </div>

                        {/* 手機版切換按鈕 */}
                        <div className="lg:hidden text-center mb-4">
                            <button type="button" onClick={() => setIsLoginMode(false)} className="text-sm text-blue-600 underline">
                                還沒有帳號？去註冊
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input {...registerLogin('email')} type="email" placeholder="Email" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition" />
                                {loginErrors.email && <p className="text-red-500 text-xs mt-1">{(loginErrors.email as any).message}</p>}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input {...registerLogin('password')} type="password" placeholder="密碼" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition" />
                                {loginErrors.password && <p className="text-red-500 text-xs mt-1">{(loginErrors.password as any).message}</p>}
                            </div>
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => navigate('/forgot-password')}
                                    className="text-sm text-gray-600 hover:text-black transition"
                                >
                                    忘記密碼？
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoginSubmitting} className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition flex justify-center items-center gap-2 group">
                            {isLoginSubmitting ? <Loader2 className="animate-spin" /> : <>登入 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                        </button>
                    </form>
                </div>

                {/* ============================================================ */}
                {/* 3. 圖片覆蓋層 (Overlay) - 只在電腦版顯示 */}
                {/* ============================================================ */}
                <div className={`hidden lg:block absolute top-0 left-0 w-1/2 h-full z-30 transition-transform duration-700 ease-in-out ${isLoginMode ? 'translate-x-0' : 'translate-x-full'
                    }`}>
                    {/* 這裡是一個雙層結構，用來實現圖片內的文字切換效果 */}
                    <div className="relative w-full h-full bg-black text-white overflow-hidden">

                        {/* 背景圖 */}
                        <div className="absolute inset-0 opacity-50">
                            <img
                                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop"
                                alt="Background"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent" />

                        {/* 內容切換容器：寬度是 200%，根據模式左右移動內層 */}
                        <div className={`relative h-full w-[200%] flex transition-transform duration-700 ease-in-out ${isLoginMode ? 'translate-x-0' : '-translate-x-1/2'
                            }`}>

                            {/* 左側內容 (Login 模式時顯示在左邊) */}
                            <div className="w-1/2 h-full flex flex-col justify-center items-center p-12 text-center">
                                <h2 className="text-4xl font-bold mb-4">還沒有帳號？</h2>
                                <p className="mb-8 text-lg text-gray-200">立即註冊，享受專屬會員優惠與快速結帳服務。</p>
                                <button
                                    onClick={() => setIsLoginMode(false)}
                                    className="px-8 py-3 border-2 border-white rounded-full font-bold hover:bg-white hover:text-black transition-all duration-300"
                                >
                                    註冊新帳號
                                </button>
                            </div>

                            {/* 右側內容 (Register 模式時顯示在右邊 - 但因為 Overlay 移到右邊了，所以這裡看起來是在 Overlay 內部) */}
                            <div className="w-1/2 h-full flex flex-col justify-center items-center p-12 text-center">
                                <h2 className="text-4xl font-bold mb-4">已經有帳號？</h2>
                                <p className="mb-8 text-lg text-gray-200">請使用您的帳號登入，繼續您的購物旅程。</p>
                                <button
                                    onClick={() => setIsLoginMode(true)}
                                    className="px-8 py-3 border-2 border-white rounded-full font-bold hover:bg-white hover:text-black transition-all duration-300 flex items-center gap-2"
                                >
                                    <ArrowLeft size={18} /> 返回登入
                                </button>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
