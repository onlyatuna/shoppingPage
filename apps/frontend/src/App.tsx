import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CartPage from './pages/CartPage';
import { useAuthStore } from './store/authStore';
import OrdersPage from './pages/OrdersPage';
import { Toaster } from 'sonner';

import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';

// 保護路由：只有 Admin 能進
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, token } = useAuthStore();

    if (!token) return <Navigate to="/login" replace />;
    if (user?.role !== 'ADMIN') {
        return <div className="p-10 text-center text-red-500">權限不足：您不是管理員</div>;
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
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <Toaster position="top-center" richColors />
            <Navbar />
            <div className="max-w-7xl mx-auto">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />

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
                </Routes>
            </div>
        </div>
    );
}

export default App;