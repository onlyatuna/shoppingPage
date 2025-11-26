import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ShoppingCart, Filter, Search, X } from 'lucide-react';
import apiClient from '../api/client';
import { Product, Category } from '../types';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/Skeleton';

export default function HomePage() {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();

    // --- 1. URL 參數同步邏輯 ---
    const [searchParams, setSearchParams] = useSearchParams();
    const urlCategoryId = searchParams.get('categoryId');
    const urlSearchTerm = searchParams.get('search');

    // State 初始化優先使用 URL 的值
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
        urlCategoryId ? Number(urlCategoryId) : null
    );
    const [searchTerm, setSearchTerm] = useState(urlSearchTerm || '');

    // 監聽 URL 變化，當 Navbar 改變網址時，同步更新這裡的 State
    useEffect(() => {
        const id = searchParams.get('categoryId');
        const search = searchParams.get('search');

        setSelectedCategoryId(id ? Number(id) : null);
        setSearchTerm(search || '');
    }, [searchParams]);

    // --- 2. 撈取分類 (Sidebar 用) ---
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Category[] }>('/categories');
            return res.data.data;
        },
    });

    // --- 3. 撈取商品 (Products) ---
    const { data: products, isLoading: isProductsLoading } = useQuery({
        // 當分類或搜尋關鍵字改變時，自動重新撈取
        queryKey: ['products', selectedCategoryId, searchTerm],
        queryFn: async () => {
            const params: any = {};
            if (selectedCategoryId) params.categoryId = selectedCategoryId;
            if (searchTerm) params.search = searchTerm;

            const res = await apiClient.get<{ data: Product[] }>('/products', { params });
            return res.data.data;
        },
    });

    // --- 4. 加入購物車 Mutation ---
    const addToCartMutation = useMutation({
        mutationFn: async (productId: number) => {
            return apiClient.post('/cart/items', { productId, quantity: 1 });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('已加入購物車');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || '加入失敗');
        }
    });

    // 清除所有篩選條件
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategoryId(null);
        setSearchParams({}); // 清空 URL 參數，這會觸發 useEffect 更新 State
    };

    // 處理側邊欄分類點擊 (同步更新 URL)
    const handleCategoryClick = (id: number | null) => {
        if (id) {
            setSearchParams({ categoryId: String(id) }); // 這會把 search 清掉，只留 categoryId
        } else {
            setSearchParams({});
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">

            {/* 標題與篩選狀態區 */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">商品列表</h1>

                {/* 顯示目前的篩選標籤 */}
                {(searchTerm || selectedCategoryId) && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-gray-500 text-sm">篩選條件:</span>

                        {searchTerm && (
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                搜尋: {searchTerm}
                                <button onClick={() => setSearchParams({ categoryId: String(selectedCategoryId || '') })} className="hover:text-red-500"><X size={14} /></button>
                            </span>
                        )}

                        {selectedCategoryId && categories && (
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                分類: {categories.find(c => c.id === selectedCategoryId)?.name || selectedCategoryId}
                                <button onClick={() => setSearchParams({ search: searchTerm })} className="hover:text-red-500"><X size={14} /></button>
                            </span>
                        )}

                        <button onClick={clearFilters} className="text-red-500 text-sm hover:underline ml-2">
                            清除全部
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-8">

                {/* --- 左側：分類側邊欄 (電腦版顯示) --- */}
                <aside className="w-full md:w-64 flex-shrink-0 hidden md:block">
                    <div className="bg-white p-4 rounded-lg border shadow-sm sticky top-24">
                        <div className="flex items-center gap-2 font-bold text-lg mb-4 pb-2 border-b">
                            <Filter size={20} />
                            分類篩選
                        </div>

                        <div className="space-y-1">
                            <button
                                onClick={() => handleCategoryClick(null)}
                                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${selectedCategoryId === null
                                        ? 'bg-black text-white font-bold'
                                        : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                            >
                                全部商品
                            </button>

                            {categories?.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategoryClick(category.id)}
                                    className={`w-full text-left px-4 py-2 rounded-md transition-colors flex justify-between ${selectedCategoryId === category.id
                                            ? 'bg-black text-white font-bold'
                                            : 'hover:bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    <span>{category.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* --- 右側：商品網格 --- */}
                <main className="flex-1">
                    {isProductsLoading ? (
                        // Loading 骨架屏
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="border rounded-lg overflow-hidden space-y-3">
                                    <Skeleton className="h-64 w-full" />
                                    <div className="p-4 space-y-3">
                                        <Skeleton className="h-6 w-3/4" />
                                        <div className="flex justify-between">
                                            <Skeleton className="h-6 w-20" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                        <Skeleton className="h-10 w-full mt-2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : products && products.length > 0 ? (
                        // 商品列表
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((product) => (
                                <div key={product.id} className="group bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
                                    {/* 圖片 */}
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
                                        {/* 售完遮罩 */}
                                        {product.stock <= 0 && (
                                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                                <span className="bg-gray-800 text-white px-4 py-1 text-sm font-bold rounded">已售完</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 內容 */}
                                    <div className="p-4 flex flex-col gap-2">
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
                                                if (!token) return toast.error('請先登入');
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
                        // 空狀態
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Search size={48} className="mb-4 opacity-20" />
                            <p className="text-lg">找不到符合條件的商品</p>
                            <button
                                onClick={clearFilters}
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