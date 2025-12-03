import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Search, Package, DollarSign, Layers, Trash2 } from 'lucide-react';
import apiClient from '../../api/client';
import { Product } from '../../types';
import ProductFormModal from '../../components/ProductFormModal';

export default function AdminProductsPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const { data: products, isLoading } = useQuery({
        queryKey: ['admin-products', searchTerm],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Product[] }>(`/products/admin/all?search=${searchTerm}`);
            return res.data.data;
        },
    });

    const updateProductMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            return apiClient.put(`/products/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setIsModalOpen(false);
        },
        onError: (err: any) => alert(err.response?.data?.message || '更新失敗')
    });

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

    const deleteProductMutation = useMutation({
        mutationFn: async (id: number) => {
            return apiClient.delete(`/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (err: any) => alert(err.response?.data?.message || '刪除失敗')
    });

    const handleDelete = (product: Product) => {
        if (window.confirm(`確定要刪除 "${product.name}" 嗎？\n此動作無法復原 (但訂單紀錄會保留)`)) {
            deleteProductMutation.mutate(product.id);
        }
    };

    const toggleActive = (product: Product) => {
        updateProductMutation.mutate({
            id: product.id,
            data: { isActive: !product.isActive }
        });
    };

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

    if (isLoading) return <div className="p-10 text-center">載入中...</div>;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold">後台商品管理</h1>
                <button
                    onClick={openCreateModal}
                    className="w-full md:w-auto bg-black text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-gray-800"
                >
                    <Plus size={20} /> 新增商品
                </button>
            </div>

            {/* Search */}
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

            {/* --- Desktop View (Table) --- */}
            <div className="hidden md:block bg-white border rounded-lg overflow-hidden shadow">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b">
                        <tr>
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
                                <td className="p-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                                        {product.images && product.images[0] && (
                                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 font-medium">{product.name}</td>
                                <td className="p-4">${Number(product.price).toLocaleString()}</td>
                                <td className={`p-4 ${product.stock < 5 ? 'text-red-500 font-bold' : ''}`}>{product.stock}</td>
                                <td className="p-4">
                                    <button
                                        onClick={() => toggleActive(product)}
                                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${product.isActive ? 'bg-green-500' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${product.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </td>
                                <td className="p-4 flex gap-2">
                                    <button onClick={() => openEditModal(product)} className="p-2 text-gray-600 hover:bg-gray-200 rounded">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(product)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- Mobile View (Cards) --- */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {products?.map((product) => (
                    <div key={product.id} className="bg-white p-4 rounded-lg border shadow-sm flex gap-4">
                        {/* 左側圖片 */}
                        <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            {product.images && product.images[0] ? (
                                <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={24} /></div>}
                        </div>

                        {/* 右側資訊 */}
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {product.isActive ? '上架' : '下架'}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
                                    <span className="flex items-center gap-1"><DollarSign size={14} /> {Number(product.price).toLocaleString()}</span>
                                    <span className={`flex items-center gap-1 ${product.stock < 5 ? 'text-red-500 font-bold' : ''}`}>
                                        <Layers size={14} /> 庫存: {product.stock}
                                    </span>
                                </div>
                            </div>

                            {/* 底部按鈕區 */}
                            <div className="flex justify-between items-center mt-3 pt-3 border-t">
                                <button
                                    onClick={() => toggleActive(product)}
                                    className={`text-xs font-bold px-3 py-1.5 rounded ${product.isActive ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                                >
                                    {product.isActive ? '下架' : '上架'}
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(product)}
                                        className="flex items-center gap-1 text-xs bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200"
                                    >
                                        <Edit size={14} /> 編輯
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product)}
                                        className="flex items-center gap-1 text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded hover:bg-red-100"
                                    >
                                        <Trash2 size={14} /> 刪除
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {products?.length === 0 && (
                <div className="p-8 text-center text-gray-500">查無商品</div>
            )}

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