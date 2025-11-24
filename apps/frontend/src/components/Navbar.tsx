import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Cart } from '../types';

export default function Navbar() {
    const { token, logout, user } = useAuthStore();

    // 只有登入時才去撈購物車資料
    const { data: cart } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Cart }>('/cart');
            return res.data.data;
        },
        enabled: !!token, // 有 token 才執行查詢
    });

    // 計算購物車總數量
    const cartCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;

    return (
        <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <Link to="/" className="text-xl font-bold">MyShop</Link>

            <div className="flex gap-4 items-center">
                {token ? (
                    <>
                        {/* 只有管理員看得到 */}
                        {user?.role === 'ADMIN' && (
                            <div className="flex gap-4">
                                <Link to="/admin/products" className="text-yellow-400 font-bold">商品管理</Link>
                                <Link to="/admin/categories" className="text-yellow-400 font-bold">分類管理</Link>
                                <Link to="/admin/orders" className="text-yellow-400 font-bold">訂單</Link>
                            </div>
                        )}


                        <Link to="/orders" className="hover:text-gray-300">我的訂單</Link>


                        <Link to="/cart" className="relative">
                            購物車
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-3 bg-red-500 text-xs rounded-full px-1.5 py-0.5">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                        <button onClick={logout} className="hover:text-gray-300">登出</button>
                    </>
                ) : (
                    <Link to="/login" className="bg-blue-600 px-4 py-1 rounded hover:bg-blue-700">登入</Link>
                )}
            </div>
        </nav>
    );
}