import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2, Search } from 'lucide-react';
import apiClient from '../../api/client';
import { Product } from '../../types';
import ProductFormModal from '../../components/ProductFormModal';

export default function AdminProductsPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // 1. 撈取後台商品列表
    const { data: products, isLoading } = useQuery({
        queryKey: ['admin-products', searchTerm],
        queryFn: async () => {
            // 呼叫剛剛寫的後端 API
            const res = await apiClient.get<{ data: Product[] }>(`/products/admin/all?search=${searchTerm}`);
            return res.data.data;
        },
    });

    // 2. 更新商品 Mutation (包含上下架、改庫存)
    const updateProductMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            return apiClient.put(`/products/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] }); // 刷新後台列表
            queryClient.invalidateQueries({ queryKey: ['products'] });       // 刷新前台列表
            setIsModalOpen(false);
        },
        onError: (err: any) => alert(err.response?.data?.message || '更新失敗')
    });

    // 3. 新增商品 Mutation
    const createProductMutation = useMutation({
        mutationFn: async (data: any) => {
            return apiClient.post('/products', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            setIsModalOpen(false);
        },
        onError: (err: any) => alert(err.response?.data?.message || '新增失敗')
    });

    // 處理上下架開關切換
    const toggleActive = (product: Product) => {
        updateProductMutation.mutate({
            id: product.id,
            data: { isActive: !product.isActive } // 反轉狀態
        });
    };

    // 處理表單送出
    const handleFormSubmit = (data: any) => {
        if (editingProduct) {
            updateProductMutation.mutate({ id: editingProduct.id, data });
        } else {
            createProductMutation.mutate(data);
        }
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    if (isLoading) return <div className="p-10">載入中...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">後台商品管理</h1>
                <button
                    onClick={openCreateModal}
                    className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800"
                >
                    <Plus size={20} /> 新增商品
                </button>
            </div>

            {/* 搜尋列 */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="搜尋商品名稱..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-black"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* 商品表格 */}
            <div className="bg-white border rounded-lg overflow-hidden shadow">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">圖片</th>
                            <th className="p-4">名稱</th>
                            <th className="p-4">價格</th>
                            <th className="p-4">庫存</th>
                            <th className="p-4">狀態</th>
                            <th className="p-4">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products?.map((product) => (
                            <tr key={product.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 text-gray-500">#{product.id}</td>
                                <td className="p-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                                        {product.images && product.images[0] && (
                                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 font-medium">{product.name}</td>
                                <td className="p-4">${Number(product.price).toLocaleString()}</td>
                                <td className="p-4">
                                    {/* 如果庫存少於 5 顯示紅色警示 */}
                                    <span className={product.stock < 5 ? 'text-red-500 font-bold' : ''}>
                                        {product.stock}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {/* 上下架開關 */}
                                    <button
                                        onClick={() => toggleActive(product)}
                                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${product.isActive ? 'bg-green-500' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${product.isActive ? 'translate-x-6' : 'translate-x-0'
                                                }`}
                                        />
                                    </button>
                                    <span className="ml-2 text-sm text-gray-500">
                                        {product.isActive ? '上架中' : '已下架'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(product)}
                                            className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        {/* 刪除先不實作，或是你可以呼叫 delete API */}
                                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {products?.length === 0 && (
                    <div className="p-8 text-center text-gray-500">查無商品</div>
                )}
            </div>

            {/* 新增/編輯 Modal */}
            <ProductFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingProduct}
                isPending={updateProductMutation.isPending || createProductMutation.isPending}
            />
        </div>
    );
}