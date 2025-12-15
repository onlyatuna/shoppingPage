import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PWAInstallPrompt from './components/PWAInstallPrompt';

import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import ProductPage from './pages/ProductPage';
import CheckoutInfoPage from './pages/CheckoutInfoPage';
import OrderSuccessPage from './pages/OrderSuccessPage';

import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminProductFormPage from './pages/admin/AdminProductFormPage';
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage'; // [New]
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import EditorPage from './pages/EditorPage';
import CloudLibraryPage from './pages/CloudLibraryPage';

// 保護路由：只有 Admin 能進
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isInitialized } = useAuthStore();

    if (!isInitialized) return null; // 等待初始化
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'ADMIN' && user.role !== 'DEVELOPER') {
        return <div className="p-10 text-center text-red-500">權限不足</div>;
    }

    return <>{children}</>;
};

// 保護路由元件: 沒登入就踢去 Login
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isInitialized } = useAuthStore();

    if (!isInitialized) return null; // 等待初始化
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

function App() {
    const { checkAuth, isInitialized } = useAuthStore();
    const location = useLocation();
    const isEditorPage = location.pathname === '/editor';

    // 🔄 核心邏輯：App 啟動時檢查身分
    useEffect(() => {
        checkAuth();
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
        <div className="min-h-screen bg-paper-white text-vintage-navy dark:bg-[#121212] dark:text-gray-100 transition-colors">
            <Toaster position="top-center" richColors />
            {!isEditorPage && <Navbar />}
            <div className={isEditorPage ? '' : 'max-w-7xl mx-auto'}>
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

                    {/* Step 2: 填寫資料 (受保護) */}
                    <Route path="/checkout/info" element={
                        <ProtectedRoute>
                            <CheckoutInfoPage />
                        </ProtectedRoute>
                    } />

                    {/* Step 3: 訂單確認 (受保護) */}
                    <Route path="/orders/success/:id" element={
                        <ProtectedRoute>
                            <OrderSuccessPage />
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

                    {/* 後台商品新增/編輯路由 */}
                    <Route path="/admin/products/new" element={
                        <AdminRoute>
                            <AdminProductFormPage />
                        </AdminRoute>
                    } />

                    <Route path="/admin/products/edit/:id" element={
                        <AdminRoute>
                            <AdminProductFormPage />
                        </AdminRoute>
                    } />

                    {/* 後台促銷管理路由 */}
                    <Route path="/admin/promotions" element={
                        <AdminRoute>
                            <AdminPromotionsPage />
                        </AdminRoute>
                    } />

                    {/* 後台分類管理路由 */}
                    <Route path="/admin/categories" element={
                        <AdminRoute>
                            <AdminCategoriesPage />
                        </AdminRoute>
                    } />

                    {/* 後台使用者管理路由 */}
                    <Route path="/admin/users" element={
                        <AdminRoute>
                            <AdminUsersPage />
                        </AdminRoute>} />

                    {/* 專業圖片編輯工作站 */}
                    {/* 專業圖片編輯工作站 */}
                    <Route path="/editor" element={
                        <AdminRoute>
                            <EditorPage />
                        </AdminRoute>} />

                    {/* 雲端圖庫 */}
                    <Route path="/library" element={
                        <AdminRoute>
                            <CloudLibraryPage />
                        </AdminRoute>} />

                    {/* 商品詳細頁 (公開) */}
                    <Route path="/products/:slug" element={<ProductPage />} />
                </Routes>
            </div>
            {!isEditorPage && <Footer />}
            <PWAInstallPrompt />
        </div>
    );
}

export default App;