import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Filter } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../api/client';
import { Order, OrderStatus } from '../../types';
import AdminOrderDetailModal from '../../components/AdminOrderDetailModal';

// 定義狀態選項
const STATUS_OPTIONS: OrderStatus[] = ['PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED'];

// 狀態顏色對應
const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case 'PENDING': return 'bg-yellow-100 text-yellow-800';
        case 'PAID': return 'bg-blue-100 text-blue-800';
        case 'SHIPPED': return 'bg-purple-100 text-purple-800';
        case 'COMPLETED': return 'bg-green-100 text-green-800';
        case 'CANCELLED': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export default function AdminOrdersPage() {
    const queryClient = useQueryClient();
    const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // 1. 撈取訂單列表
    const { data: orders, isLoading } = useQuery({
        queryKey: ['admin-orders', filterStatus],
        queryFn: async () => {
            const params = filterStatus ? { status: filterStatus } : {};
            const res = await apiClient.get<{ data: Order[] }>('/orders/admin/all', { params });
            return res.data.data;
        },
    });

    // 2. 更新狀態 Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
            return apiClient.patch(`/orders/${id}/status`, { status });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            toast.success(`訂單狀態已更新為 ${variables.status}`);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || '更新失敗');
        }
    });

    if (isLoading) return <div className="p-8">載入中...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">訂單管理</h1>

                {/* 狀態篩選器 */}
                <div className="flex items-center gap-2">
                    <Filter size={20} className="text-gray-500" />
                    <select
                        className="border p-2 rounded bg-white"
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

            <div className="bg-white border rounded-lg shadow overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">訂單編號</th>
                            <th className="p-4">買家</th>
                            <th className="p-4">金額</th>
                            <th className="p-4">下單時間</th>
                            <th className="p-4">目前狀態</th>
                            <th className="p-4">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders?.map((order) => (
                            <tr key={order.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-mono text-gray-500 truncate max-w-[100px]" title={order.id}>
                                    #{order.id.slice(0, 8)}...
                                </td>
                                <td className="p-4">
                                    <div className="font-medium">{order.user?.name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{order.user?.email}</div>
                                </td>
                                <td className="p-4 font-bold">
                                    ${Number(order.totalAmount).toLocaleString()}
                                </td>
                                <td className="p-4 text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                    {/* 直接在表格操作狀態變更 */}
                                    <select
                                        className={`border rounded px-2 py-1 text-xs font-bold cursor-pointer outline-none ${getStatusColor(order.status)}`}
                                        value={order.status}
                                        onChange={(e) => {
                                            const newStatus = e.target.value as OrderStatus;
                                            if (confirm(`確定將狀態變更為 ${newStatus} 嗎？`)) {
                                                updateStatusMutation.mutate({ id: order.id, status: newStatus });
                                            }
                                        }}
                                        disabled={updateStatusMutation.isPending}
                                    >
                                        {STATUS_OPTIONS.map(status => (
                                            <option key={status} value={status} className="bg-white text-black">
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="flex items-center gap-1 text-gray-600 hover:text-black hover:bg-gray-200 px-2 py-1 rounded"
                                    >
                                        <Eye size={16} /> 詳情
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {orders?.length === 0 && (
                    <div className="p-10 text-center text-gray-500">目前沒有訂單</div>
                )}
            </div>

            {/* 訂單詳情 Modal */}
            <AdminOrderDetailModal
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />
        </div>
    );
}