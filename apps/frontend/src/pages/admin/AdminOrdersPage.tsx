import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Filter, User, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../api/client';
import { Order, OrderStatus } from '../../types';
import AdminOrderDetailModal from '../../components/AdminOrderDetailModal';

const STATUS_OPTIONS: OrderStatus[] = ['PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED'];

const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'PAID': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'SHIPPED': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
        case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export default function AdminOrdersPage() {
    const queryClient = useQueryClient();
    const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const { data: orders, isLoading } = useQuery({
        queryKey: ['admin-orders', filterStatus],
        queryFn: async () => {
            const params = filterStatus ? { status: filterStatus } : {};
            const res = await apiClient.get<{ data: Order[] }>('/orders/admin/all', { params });
            return res.data.data;
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
            return apiClient.patch(`/orders/${id}/status`, { status });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            toast.success(`訂單狀態已更新為 ${variables.status}`);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || '更新失敗')
    });

    if (isLoading) return <div className="p-8 text-center">載入中...</div>;

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold">訂單管理</h1>

                <div className="w-full md:w-auto flex items-center gap-2 bg-white p-1 border rounded-lg">
                    <Filter size={20} className="text-gray-500 ml-2" />
                    <select
                        className="w-full md:w-auto bg-transparent p-1 outline-none text-sm"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as OrderStatus | '')}
                    >
                        <option value="">所有狀態</option>
                        {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* --- Desktop Table --- */}
            <div className="hidden md:block bg-white border rounded-lg shadow overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">訂單編號</th>
                            <th className="p-4">買家</th>
                            <th className="p-4">金額</th>
                            <th className="p-4">日期</th>
                            <th className="p-4">狀態</th>
                            <th className="p-4">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders?.map((order) => (
                            <tr key={order.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-mono text-gray-500">#{order.id.slice(0, 8)}...</td>
                                <td className="p-4">
                                    <div className="font-medium">{order.user?.name}</div>
                                    <div className="text-xs text-gray-500">{order.user?.email}</div>
                                </td>
                                <td className="p-4 font-bold">${Number(order.totalAmount).toLocaleString()}</td>
                                <td className="p-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <select
                                        className={`border rounded px-2 py-1 text-xs font-bold cursor-pointer outline-none ${getStatusColor(order.status)}`}
                                        value={order.status}
                                        onChange={(e) => {
                                            const newStatus = e.target.value as OrderStatus;
                                            toast('狀態變更', {
                                                description: `將訂單狀態改為 ${newStatus}？`,
                                                action: { label: '確認', onClick: () => updateStatusMutation.mutate({ id: order.id, status: newStatus }) },
                                                cancel: { label: '取消', onClick: () => { } }
                                            });
                                        }}
                                    >
                                        {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-white text-black">{s}</option>)}
                                    </select>
                                </td>
                                <td className="p-4">
                                    <button onClick={() => setSelectedOrder(order)} className="flex items-center gap-1 text-gray-600 hover:bg-gray-100 px-3 py-1 rounded border">
                                        <Eye size={14} /> 詳情
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- Mobile Cards --- */}
            <div className="md:hidden space-y-4">
                {orders?.map((order) => (
                    <div key={order.id} className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100">
                            <div>
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">#{order.id.slice(0, 8)}</span>
                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                    <Calendar size={10} /> {new Date(order.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <button onClick={() => setSelectedOrder(order)} className="text-blue-600 text-sm flex items-center gap-1">
                                詳情 <Eye size={14} />
                            </button>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                    <User size={16} className="text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{order.user?.name}</p>
                                    <p className="text-xs text-gray-500">{order.user?.email}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">總金額</p>
                                <p className="text-lg font-bold text-gray-900 flex items-center">
                                    <DollarSign size={14} />{Number(order.totalAmount).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <select
                                className={`w-full border rounded px-3 py-2 text-sm font-bold outline-none appearance-none text-center ${getStatusColor(order.status)}`}
                                value={order.status}
                                onChange={(e) => {
                                    const newStatus = e.target.value as OrderStatus;
                                    toast('狀態變更', {
                                        description: `將訂單狀態改為 ${newStatus}？`,
                                        action: { label: '確認', onClick: () => updateStatusMutation.mutate({ id: order.id, status: newStatus }) },
                                        cancel: { label: '取消', onClick: () => { } },
                                        position: 'top-center'
                                    });
                                }}
                            >
                                {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-white text-black">{s}</option>)}
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            {orders?.length === 0 && <div className="p-10 text-center text-gray-500">目前沒有訂單</div>}

            <AdminOrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        </div>
    );
}