import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Search, Filter, X } from 'lucide-react';
import apiClient from '../api/client';
import { Product, Category } from '../types';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/Skeleton';

export default function HomePage() {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();

    // --- 狀態管理 ---
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    // 搜尋框的暫存值 (避免打一個字就發一次 Request，這裡做簡單的 Enter 觸發)
    const [searchInput, setSearchInput] = useState('');

    // --- 1. 撈取分類列表 (Sidebar 用) ---
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Category[] }>('/categories');
            return res.data.data;
        },
    });

    // --- 2. 撈取商品列表 (根據篩選條件) ---
    const { data: products, isLoading: isProductsLoading } = useQuery({
        // 關鍵：當 categoryId 或 searchTerm 改變時，React Query 會自動重跑
        queryKey: ['products', selectedCategoryId, searchTerm],
        queryFn: async () => {
            const params: any = {};
            if (selectedCategoryId) params.categoryId = selectedCategoryId;
            if (searchTerm) params.search = searchTerm;

            // 呼叫後端 API: GET /products?categoryId=1&search=...
            const res = await apiClient.get<{ data: Product[] }>('/products', { params });
            return res.data.data;
        },
    });

    // --- 3. 加入購物車 Mutation (維持原有邏輯) ---
    const addToCartMutation = useMutation({
        mutationFn: async (productId: number) => {
            return apiClient.post('/cart/items', { productId, quantity: 1 });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            // [修改] 取代 alert，顯示漂亮的通知
            toast.success('已加入購物車');
        },
        onError: (error: any) => {
            // [修改] 顯示錯誤通知
            toast.error(error.response?.data?.message || '加入失敗');
        }
    });

    // 處理搜尋送出
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchTerm(searchInput);
        setSelectedCategoryId(null); // 搜尋時通常會清空分類選擇
    };

    // 清除搜尋
    const clearSearch = () => {
        setSearchInput('');
        setSearchTerm('');
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">

            {/* 手機版/標題區塊 */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">商品列表</h1>

                {/* 搜尋框 */}
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="搜尋商品..."
                        className="w-full border border-gray-300 rounded-full py-2 pl-10 pr-10 outline-none focus:ring-2 focus:ring-black transition"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />

                    {/* 清除搜尋按鈕 */}
                    {searchInput && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-black"
                        >
                            <X size={18} />
                        </button>
                    )}
                </form>
            </div>

            <div className="flex flex-col md:flex-row gap-8">

                {/* --- 左側：分類側邊欄 (Sidebar) --- */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white p-4 rounded-lg border shadow-sm sticky top-24">
                        <div className="flex items-center gap-2 font-bold text-lg mb-4 pb-2 border-b">
                            <Filter size={20} />
                            分類篩選
                        </div>

                        <div className="space-y-2">
                            {/* 全部商品按鈕 */}
                            <button
                                onClick={() => {
                                    setSelectedCategoryId(null);
                                    setSearchTerm('');
                                    setSearchInput('');
                                }}
                                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${selectedCategoryId === null && !searchTerm
                                    ? 'bg-black text-white font-bold'
                                    : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                            >
                                全部商品
                            </button>

                            {/* 分類列表 */}
                            {categories?.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategoryId(category.id)}
                                    className={`w-full text-left px-4 py-2 rounded-md transition-colors flex justify-between ${selectedCategoryId === category.id
                                        ? 'bg-black text-white font-bold'
                                        : 'hover:bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    <span>{category.name}</span>
                                    {/* 顯示該分類下的商品數量 (如果有做 _count) */}
                                    {category._count && (
                                        <span className={`text-xs py-1 px-2 rounded-full ${selectedCategoryId === category.id ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                            {category._count.products}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* --- 右側：商品網格 (Grid) --- */}
                <main className="flex-1">

                    {/* 狀態提示：搜尋中或分類標題 */}
                    <div className="mb-4 text-gray-500 text-sm">
                        {searchTerm ? `搜尋結果：「${searchTerm}」` :
                            selectedCategoryId ? `分類：「${categories?.find(c => c.id === selectedCategoryId)?.name}」` : '所有商品'
                        }
                        <span className="ml-2">({products?.length || 0} 項)</span>
                    </div>

                    {isProductsLoading ? (
                        // [修改] 顯示 6 個骨架卡片
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="border rounded-lg overflow-hidden space-y-3">
                                    {/* 1. 圖片區塊骨架 */}
                                    <Skeleton className="h-64 w-full" />

                                    {/* 2. 文字內容區塊 */}
                                    <div className="p-4 space-y-3">
                                        {/* 標題 */}
                                        <Skeleton className="h-6 w-3/4" />

                                        {/* 價格與庫存 */}
                                        <div className="flex justify-between">
                                            <Skeleton className="h-6 w-20" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>

                                        {/* 按鈕 */}
                                        <Skeleton className="h-10 w-full mt-2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : products && products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((product) => (
                                <div key={product.id} className="group bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
                                    {/* 圖片區域 */}
                                    <div className="relative h-64 bg-gray-100 overflow-hidden">
                                        {product.images[0] ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                        )}

                                        {/* 庫存標籤 */}
                                        {product.stock <= 0 && (
                                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                                <span className="bg-gray-800 text-white px-4 py-1 text-sm font-bold rounded">已售完</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 內容區域 */}
                                    <div className="p-4 flex flex-col gap-2">
                                        {/* 分類標籤 (如果有) */}
                                        {product.category && (
                                            <span className="text-xs text-gray-400">{product.category.name}</span>
                                        )}

                                        <h3 className="font-bold text-lg truncate" title={product.name}>{product.name}</h3>

                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xl font-bold text-gray-900">
                                                ${Number(product.price).toLocaleString()}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                庫存: {product.stock}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (!token) return alert('請先登入');
                                                addToCartMutation.mutate(product.id);
                                            }}
                                            disabled={addToCartMutation.isPending || product.stock <= 0}
                                            className={`mt-3 w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${product.stock <= 0
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-black text-white hover:bg-gray-800 active:scale-95'
                                                }`}
                                        >
                                            <ShoppingCart size={18} />
                                            {product.stock <= 0 ? '補貨中' : '加入購物車'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // 空狀態 (Empty State)
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Search size={48} className="mb-4 opacity-20" />
                            <p className="text-lg">找不到符合條件的商品</p>
                            <button
                                onClick={() => { setSearchTerm(''); setSelectedCategoryId(null); setSearchInput(''); }}
                                className="mt-4 text-black underline hover:text-blue-600"
                            >
                                清除篩選條件
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}