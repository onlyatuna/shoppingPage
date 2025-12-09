//App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import apiClient from './api/client';
import { User } from './types';
import { useAuthStore } from './store/authStore';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';

import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';

import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// 保護路由：只有 Admin 能進
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, token } = useAuthStore();

    if (!token) return <Navigate to="/login" replace />;
    if (user?.role !== 'ADMIN' && user?.role !== 'DEVELOPER') {
        return <div className="p-10 text-center text-red-500">權限不足</div>;
    }

    return <>{children}</>;
};

// 保護路由元件: 沒登入就踢去 Login
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { token } = useAuthStore();
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

function App() {
    const { token, setAuth, logout, isInitialized, setInitialized } = useAuthStore();

    // 🔄 核心邏輯：App 啟動時檢查身分
    useEffect(() => {
        const initAuth = async () => {
            // 1. 如果沒有 Token，直接標記初始化完成 (視為未登入狀態)
            if (!token) {
                setInitialized(true);
                return;
            }

            try {
                // 2. 有 Token，嘗試去後端換取使用者資料
                const res = await apiClient.get<{ data: User }>('/users/profile');

                // 3. 成功：把資料塞回 Store
                setAuth(res.data.data);
            } catch (error) {
                // 4. 失敗 (例如 Token 過期)：執行登出清理
                console.error('Token 無效或過期', error);
                logout();
            }
        };

        initAuth();
    }, []); // 空陣列表示只在元件掛載時執行一次

    // ⏳ (選用) 加上一個全域 Loading 畫面
    // 避免在檢查 Token 的短短 0.x 秒內，畫面閃爍顯示「登入」按鈕
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">正在驗證身分...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <Toaster position="top-center" richColors />
            <Navbar />
            <div className="max-w-7xl mx-auto">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<Navigate to="/login" replace />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    } />

                    {/* 購物車路由 (受保護) */}
                    <Route path="/cart" element={
                        <ProtectedRoute>
                            <CartPage />
                        </ProtectedRoute>
                    } />

                    {/* 訂單路由 (受保護) */}
                    <Route path="/orders" element={
                        <ProtectedRoute>
                            <OrdersPage />
                        </ProtectedRoute>
                    } />

                    {/* 支付回調路由 */}
                    <Route path="/payment/callback" element={<PaymentCallbackPage />} />

                    {/* 後台商品管理路由 */}
                    <Route path="/admin/products" element={
                        <AdminRoute>
                            <AdminProductsPage />
                        </AdminRoute>
                    } />

                    {/* 後台分類管理路由 */}
                    <Route path="/admin/categories" element={
                        <AdminRoute>
                            <AdminCategoriesPage />
                        </AdminRoute>
                    } />

                    <Route path="/admin/orders" element={
                        <AdminRoute>
                            <AdminOrdersPage />
                        </AdminRoute>} />

                    {/* 後台使用者管理路由 */}
                    <Route path="/admin/users" element={
                        <AdminRoute>
                            <AdminUsersPage />
                        </AdminRoute>} />
                </Routes>
            </div>
        </div>
    );
}

export default App;