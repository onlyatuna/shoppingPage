//HomePage.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, X } from 'lucide-react';
import apiClient from '../api/client';
import { Product, Category } from '../types';
import { Skeleton } from '../components/ui/Skeleton';
import InstagramGallery from '../components/InstagramGallery';
import ProductCard from '../components/ProductCard';

export default function HomePage() {


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
                <h1 className="text-3xl font-bold text-vintage-navy">商品列表</h1>

                {/* 顯示目前的篩選標籤 */}
                {(searchTerm || selectedCategoryId) && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-gray-500 text-sm">篩選條件:</span>

                        {searchTerm && (
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                搜尋: {searchTerm}
                                <button type="button" onClick={() => setSearchParams({ categoryId: String(selectedCategoryId || '') })} className="hover:text-red-500"><X size={14} /></button>
                            </span>
                        )}

                        {selectedCategoryId && categories && (
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                分類: {categories.find(c => c.id === selectedCategoryId)?.name || selectedCategoryId}
                                <button type="button" onClick={() => setSearchParams({ search: searchTerm })} className="hover:text-red-500"><X size={14} /></button>
                            </span>
                        )}

                        <button type="button" onClick={clearFilters} className="text-red-500 text-sm hover:underline ml-2">
                            清除全部
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* --- 右側：商品網格 (Now Full Width) --- */}
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
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                />
                            ))}
                        </div>
                    ) : (
                        // 空狀態
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Search size={48} className="mb-4 opacity-20" />
                            <p className="text-lg">找不到符合條件的商品</p>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-4 text-black underline hover:text-blue-600"
                            >
                                清除篩選條件
                            </button>
                        </div>
                    )}
                </main>
            </div>

            <InstagramGallery />
        </div>
    );
}