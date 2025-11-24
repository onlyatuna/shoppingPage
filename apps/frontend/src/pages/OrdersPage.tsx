import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, CheckCircle, Clock, XCircle, Truck } from 'lucide-react';
import apiClient from '../api/client';
import { Order, OrderStatus } from '../types';

// 狀態對應的顏色與 Icon 輔助函式
const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
        case 'PENDING':
            return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: '待付款' };
        case 'PAID':
            return { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: '已付款' };
        case 'SHIPPED':
            return { color: 'bg-purple-100 text-purple-800', icon: Truck, label: '已出貨' };
        case 'COMPLETED':
            return { color: 'bg-green-100 text-green-800', icon: Package, label: '已完成' };
        case 'CANCELLED':
            return { color: 'bg-red-100 text-red-800', icon: XCircle, label: '已取消' };
        default:
            return { color: 'bg-gray-100 text-gray-800', icon: Package, label: status };
    }
};

export default function OrdersPage() {
    const queryClient = useQueryClient();

    // 1. 撈取訂單列表
    const { data: orders, isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            // 記得確認這裡是否需要 /v1，視你的 client.ts 設定而定
            const res = await apiClient.get<{ data: Order[] }>('/orders');
            return res.data.data;
        },
    });

    // 2. 模擬付款 Mutation (這是額外功能，讓你測試狀態變化)
    const payOrderMutation = useMutation({
        mutationFn: async (orderId: string) => {
            // 假設後端有實作這個 PATCH 路由，如果沒有，請參考下方的「補充後端」
            return apiClient.patch(`/orders/${orderId}/pay`);
        },
        onSuccess: () => {
            alert('付款成功！');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: () => {
            alert('付款功能尚未實作，請在後端新增路由');
        }
    });

    if (isLoading) return <div className="p-10 text-center">載入訂單中...</div>;

    if (!orders || orders.length === 0) {
        return <div className="p-10 text-center text-gray-500">目前沒有訂單紀錄</div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">我的訂單</h1>

            <div className="space-y-6">
                {orders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                        <div key={order.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                            {/* 訂單頭部資訊 */}
                            <div className="bg-gray-50 p-4 flex flex-wrap justify-between items-center border-b gap-4">
                                <div className="space-y-1">
                                    <div className="text-sm text-gray-500">訂單編號</div>
                                    <div className="font-mono text-sm font-medium">{order.id}</div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-sm text-gray-500">下單日期</div>
                                    <div className="font-medium">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-sm text-gray-500">總金額</div>
                                    <div className="font-bold text-lg">
                                        ${Number(order.totalAmount).toLocaleString()}
                                    </div>
                                </div>

                                {/* 狀態標籤 */}
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                                    <StatusIcon size={16} />
                                    {statusConfig.label}
                                </div>
                            </div>

                            {/* 訂單內容 */}
                            <div className="p-4">
                                <ul className="space-y-4">
                                    {order.items.map((item) => (
                                        <li key={item.id} className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                {item.product.images && item.product.images[0] ? (
                                                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium">{item.product.name}</h4>
                                                <div className="text-sm text-gray-500">
                                                    ${Number(item.price).toLocaleString()} x {item.quantity}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                {/* 待付款時顯示按鈕 */}
                                {order.status === 'PENDING' && (
                                    <div className="mt-4 flex justify-end pt-4 border-t">
                                        <button
                                            onClick={() => payOrderMutation.mutate(order.id)}
                                            disabled={payOrderMutation.isPending}
                                            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            {payOrderMutation.isPending ? '處理中...' : '前往付款'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}