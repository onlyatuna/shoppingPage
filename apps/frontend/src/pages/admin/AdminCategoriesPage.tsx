import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, Save, X } from 'lucide-react';
import apiClient from '../../api/client';
import { Category } from '../../types';

export default function AdminCategoriesPage() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);

    // 新增表單的暫存狀態
    const [newCategory, setNewCategory] = useState({ name: '', slug: '' });

    // 1. 讀取分類
    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Category[] }>('/categories');
            return res.data.data;
        }
    });

    // 2. 新增 Mutation
    const createMutation = useMutation({
        mutationFn: async (data: { name: string; slug: string }) => {
            return apiClient.post('/categories', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setIsCreating(false);
            setNewCategory({ name: '', slug: '' });
        },
        onError: (err: any) => alert(err.response?.data?.message || '新增失敗')
    });

    // 3. 刪除 Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return apiClient.delete(`/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
        onError: (err: any) => alert(err.response?.data?.message || '刪除失敗 (分類下可能有商品)')
    });

    if (isLoading) return <div className="p-8">載入中...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">分類管理</h1>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-black text-white px-4 py-2 rounded flex items-center gap-2"
                    disabled={isCreating}
                >
                    <Plus size={20} /> 新增分類
                </button>
            </div>

            <div className="bg-white border rounded-lg shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">名稱</th>
                            <th className="p-4">Slug (網址代號)</th>
                            <th className="p-4">商品數</th>
                            <th className="p-4">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* 新增模式的輸入列 */}
                        {isCreating && (
                            <tr className="bg-blue-50">
                                <td className="p-4 text-gray-400">-</td>
                                <td className="p-4">
                                    <input
                                        autoFocus
                                        className="border p-1 rounded w-full"
                                        placeholder="輸入名稱..."
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                    />
                                </td>
                                <td className="p-4">
                                    <input
                                        className="border p-1 rounded w-full"
                                        placeholder="輸入 Slug (英文)..."
                                        value={newCategory.slug}
                                        onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                                    />
                                </td>
                                <td className="p-4">-</td>
                                <td className="p-4 flex gap-2">
                                    <button
                                        onClick={() => createMutation.mutate(newCategory)}
                                        className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                        <Save size={18} />
                                    </button>
                                    <button
                                        onClick={() => setIsCreating(false)}
                                        className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                                    >
                                        <X size={18} />
                                    </button>
                                </td>
                            </tr>
                        )}

                        {/* 列表資料 */}
                        {categories?.map((category) => (
                            <tr key={category.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 text-gray-500">#{category.id}</td>
                                <td className="p-4 font-medium">{category.name}</td>
                                <td className="p-4 font-mono text-sm text-gray-600">{category.slug}</td>
                                <td className="p-4">
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">
                                        {category._count?.products || 0}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => {
                                            if (confirm(`確定刪除分類「${category.name}」嗎？`)) {
                                                deleteMutation.mutate(category.id);
                                            }
                                        }}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}