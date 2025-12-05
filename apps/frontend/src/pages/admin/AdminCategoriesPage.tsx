//AdminCategoriesPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, Save, X, Tag, Link as LinkIcon } from 'lucide-react';
import apiClient from '../../api/client';
import { Category } from '../../types';

export default function AdminCategoriesPage() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', slug: '' });

    // 1. 讀取分類 (加入 scope=admin 參數)
    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories', 'admin'], // key 稍微改一下避免跟前台混用
        queryFn: async () => {
            const res = await apiClient.get<{ data: Category[] }>('/categories?scope=admin');
            return res.data.data;
        }
    });


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

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return apiClient.delete(`/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
        onError: (err: any) => alert(err.response?.data?.message || '刪除失敗')
    });

    if (isLoading) return <div className="p-8">載入中...</div>;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">分類管理</h1>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
                    disabled={isCreating}
                >
                    <Plus size={20} /> <span className="hidden md:inline">新增分類</span>
                </button>
            </div>

            {/* 新增區塊 (RWD) */}
            {isCreating && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100 animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-bold mb-3 text-blue-800">新增分類</h3>
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            autoFocus
                            className="border p-2 rounded flex-1"
                            placeholder="分類名稱 (如: 電子產品)"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        />
                        <input
                            className="border p-2 rounded flex-1"
                            placeholder="Slug 網址代號 (如: electronics)"
                            value={newCategory.slug}
                            onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                        />
                        <div className="flex gap-2 mt-2 md:mt-0">
                            <button onClick={() => createMutation.mutate(newCategory)} className="flex-1 md:flex-none bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center gap-2">
                                <Save size={18} /> 儲存
                            </button>
                            <button onClick={() => setIsCreating(false)} className="flex-1 md:flex-none bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 flex items-center justify-center gap-2">
                                <X size={18} /> 取消
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Desktop Table --- */}
            <div className="hidden md:block bg-white border rounded-lg shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">名稱</th>
                            <th className="p-4">Slug</th>
                            <th className="p-4">商品數</th>
                            <th className="p-4">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories?.map((category) => (
                            <tr key={category.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 text-gray-500">#{category.id}</td>
                                <td className="p-4 font-medium">{category.name}</td>
                                <td className="p-4 font-mono text-sm text-gray-600">{category.slug}</td>
                                <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{category._count?.products || 0}</span></td>
                                <td className="p-4">
                                    <button onClick={() => { if (confirm(`確定刪除 ${category.name}？`)) deleteMutation.mutate(category.id); }} className="text-gray-400 hover:text-red-500 p-1">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- Mobile Cards --- */}
            <div className="md:hidden space-y-3">
                {categories?.map((category) => (
                    <div key={category.id} className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">{category.name}</span>
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">#{category.id}</span>
                            </div>
                            <div className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                                <LinkIcon size={12} /> {category.slug}
                            </div>
                            <div className="mt-2 inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded text-xs text-gray-600">
                                <Tag size={12} /> {category._count?.products || 0} 個商品
                            </div>
                        </div>
                        <button
                            onClick={() => { if (confirm(`確定刪除 ${category.name}？`)) deleteMutation.mutate(category.id); }}
                            className="p-3 bg-red-50 text-red-500 rounded-full hover:bg-red-100"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}