//AdminUsersPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Shield, Code } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface UserData {
    id: number;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN' | 'DEVELOPER';
    createdAt: string;
    _count: { orders: number };
}

export default function AdminUsersPage() {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();

    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: UserData[] }>('/users');
            return res.data.data;
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (id: number) => apiClient.delete(`/users/${id}`),
        onSuccess: () => {
            toast.success('使用者已刪除');
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || '刪除失敗')
    });

    const toggleRoleMutation = useMutation({
        mutationFn: async ({ id, role }: { id: number; role: string }) => apiClient.patch(`/users/${id}/role`, { role }),
        onSuccess: () => {
            toast.success('權限已更新');
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || '更新失敗')
    });

    const canManageUser = (targetUser: UserData) => {
        if (!currentUser || currentUser.id === targetUser.id) return false;
        if (currentUser.role === 'DEVELOPER') return true;
        if (currentUser.role === 'ADMIN') return targetUser.role === 'USER';
        return false;
    };

    const handleRoleChange = (u: UserData) => {
        const newRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
        toast('權限變更', {
            description: `將 ${u.name} 設為 ${newRole}？`,
            action: { label: '確認', onClick: () => toggleRoleMutation.mutate({ id: u.id, role: newRole }) },
            cancel: { label: '取消', onClick: () => { } }
        });
    };

    const handleDelete = (u: UserData) => {
        toast('刪除使用者', {
            description: `確定刪除 ${u.name}？此操作無法復原。`,
            action: { label: '刪除', onClick: () => deleteUserMutation.mutate(u.id) },
            cancel: { label: '取消', onClick: () => { } }
        });
    };

    if (isLoading) return <div className="p-8">載入中...</div>;

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold mb-6">帳號管理</h1>

            {/* --- Desktop Table --- */}
            <div className="hidden md:block bg-white border rounded-lg shadow overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">使用者</th>
                            <th className="p-4">權限</th>
                            <th className="p-4">訂單數</th>
                            <th className="p-4">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users?.map((u) => (
                            <tr key={u.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 text-gray-500">#{u.id}</td>
                                <td className="p-4">
                                    <div className="font-medium">{u.name}</div>
                                    <div className="text-xs text-gray-500">{u.email}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1 ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800'
                                        : u.role === 'DEVELOPER' ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {u.role === 'DEVELOPER' && <Code size={12} />}
                                        {u.role === 'ADMIN' && <Shield size={12} />}
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4">{u._count.orders}</td>
                                <td className="p-4 flex gap-2">
                                    {canManageUser(u) ? (
                                        <>
                                            <button onClick={() => handleRoleChange(u)} className="text-xs border px-2 py-1 rounded hover:bg-black hover:text-white transition">
                                                設為 {u.role === 'ADMIN' ? 'User' : 'Admin'}
                                            </button>
                                            <button onClick={() => handleDelete(u)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                                        </>
                                    ) : u.id === currentUser?.id ? <span className="text-xs text-blue-500">你自己</span> : <span className="text-xs text-gray-300">無權限</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- Mobile Cards --- */}
            <div className="md:hidden space-y-4">
                {users?.map((u) => (
                    <div key={u.id} className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${u.role === 'DEVELOPER' ? 'bg-green-600' : u.role === 'ADMIN' ? 'bg-purple-600' : 'bg-gray-400'
                                    }`}>
                                    {u.name?.[0] || 'U'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{u.name}</p>
                                    <p className="text-xs text-gray-500 truncate w-40">{u.email}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : u.role === 'DEVELOPER' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>{u.role}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-xs text-gray-500">訂單數: {u._count.orders}</span>

                            <div className="flex gap-2">
                                {canManageUser(u) ? (
                                    <>
                                        <button onClick={() => handleRoleChange(u)} className="text-xs bg-gray-100 px-3 py-1.5 rounded font-medium hover:bg-gray-200">
                                            變更權限
                                        </button>
                                        <button onClick={() => handleDelete(u)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded font-medium hover:bg-red-100">
                                            刪除
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-xs text-gray-300 italic">無權限操作</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}