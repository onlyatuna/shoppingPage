//AdminOrderDetailModal.tsx
import { useState, useEffect } from 'react';
import {
    X, MapPin, User, CreditCard, Search,
    CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../api/client';
import { Order } from '../types';

interface Props {
    order: Order | null;
    onClose: () => void;
}

export default function AdminOrderDetailModal({ order, onClose }: Props) {
    // 新增狀態來儲存查到的 LINE Pay 資訊
    const [linePayInfo, setLinePayInfo] = useState<any>(null);
    const [isLoadingLinePay, setIsLoadingLinePay] = useState(false);

    // 當切換不同訂單時，重置查帳資料
    useEffect(() => {
        setLinePayInfo(null);
        setIsLoadingLinePay(false);
    }, [order?.id]);

    if (!order) return null;

    // 解析收件資訊
    const shipping = typeof order.shippingInfo === 'string'
        ? JSON.parse(order.shippingInfo)
        : order.shippingInfo;

    // 處理查詢 LINE Pay 明細
    const handleCheckLinePay = async () => {
        setIsLoadingLinePay(true);
        try {
            // 呼叫後端 API 查詢
            const res = await apiClient.get(`/payment/line-pay/details?orderId=${order.id}`);

            if (res.data.data && res.data.data.length > 0) {
                setLinePayInfo(res.data.data[0]); // 取第一筆交易紀錄
                toast.success('LINE Pay 資料同步成功');
            } else {
                toast.info('查無 LINE Pay 交易紀錄');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || '查詢失敗');
        } finally {
            setIsLoadingLinePay(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto relative shadow-xl flex flex-col">

                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-bold">訂單詳情</h2>
                        <div className="flex items-center gap-2 text-sm mt-1">
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">#{order.id}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.status === 'PAID' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'
                                }`}>
                                {order.status}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* 1. 基本資訊區塊 (買家 & 收件) */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-700">
                                <User size={18} /> 買家資訊
                            </h3>
                            <div className="space-y-1 text-sm">
                                <p><span className="text-gray-500 w-12 inline-block">帳號:</span> {order.user?.email}</p>
                                <p><span className="text-gray-500 w-12 inline-block">姓名:</span> {order.user?.name || '未設定'}</p>
                                <p><span className="text-gray-500 w-12 inline-block">時間:</span> {new Date(order.createdAt).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-700">
                                <MapPin size={18} /> 收件資訊
                            </h3>
                            <div className="space-y-1 text-sm">
                                <p><span className="text-gray-500 w-12 inline-block">收件人:</span> {shipping.recipient}</p>
                                <p><span className="text-gray-500 w-12 inline-block">電話:</span> {shipping.phone}</p>
                                <p className="mt-2 text-gray-700 border-t border-gray-200 pt-2">{shipping.city}{shipping.address}</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. 商品明細表格 */}
                    <div>
                        <h3 className="font-bold mb-3 text-gray-700">商品明細</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-3 font-medium text-gray-600">商品名稱</th>
                                        <th className="p-3 text-right font-medium text-gray-600">單價</th>
                                        <th className="p-3 text-center font-medium text-gray-600">數量</th>
                                        <th className="p-3 text-right font-medium text-gray-600">小計</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    {/* 如果有圖片就顯示 */}
                                                    {item.product.images?.[0] && (
                                                        <img src={item.product.images[0]} alt="" className="w-8 h-8 rounded object-cover bg-gray-200" />
                                                    )}
                                                    <span>{item.product.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right text-gray-600">${Number(item.price).toLocaleString()}</td>
                                            <td className="p-3 text-center">{item.quantity}</td>
                                            <td className="p-3 text-right font-medium">
                                                ${(Number(item.price) * item.quantity).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={3} className="p-3 text-right font-bold text-gray-700">訂單總金額</td>
                                        <td className="p-3 text-right text-lg font-bold text-black border-t-2 border-gray-200">
                                            ${Number(order.totalAmount).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* 3. [新增] 金流查帳區塊 */}
                    {/* 只有當訂單有 paymentId (代表是用 LINE Pay 付款的) 且狀態非 Pending 時顯示 */}
                    {((order.status === 'PAID' || order.status === 'SHIPPED' || order.status === 'COMPLETED') && (order as any).paymentId) && (
                        <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                        <CreditCard size={18} /> 金流對帳資訊 (LINE Pay)
                                    </h3>
                                    <p className="text-xs text-blue-600 mt-1 font-mono">
                                        Transaction ID: {(order as any).paymentId}
                                    </p>
                                </div>

                                {!linePayInfo && (
                                    <button
                                        onClick={handleCheckLinePay}
                                        disabled={isLoadingLinePay}
                                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition"
                                    >
                                        {isLoadingLinePay ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                        查詢即時明細
                                    </button>
                                )}
                            </div>

                            {/* 查詢結果顯示區 */}
                            {linePayInfo && (
                                <div className="bg-white p-4 rounded border border-blue-100 animate-in zoom-in-95 duration-200">
                                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 text-xs">交易狀態</span>
                                            <span className="font-bold text-green-600 flex items-center gap-1">
                                                <CheckCircle size={12} /> {linePayInfo.transactionType}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 text-xs">實際入帳金額</span>
                                            <span className="font-bold text-lg">
                                                {linePayInfo.currency} ${linePayInfo.amount?.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 text-xs">交易時間</span>
                                            <span>{new Date(linePayInfo.transactionDate).toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 text-xs">付款方式</span>
                                            <span>{linePayInfo.payInfo?.[0]?.method}</span>
                                        </div>
                                    </div>

                                    {/* 金額檢核警示：如果 LINE Pay 金額跟訂單金額不符，顯示紅框 */}
                                    {linePayInfo.amount !== Number(order.totalAmount) && (
                                        <div className="mt-3 p-2 bg-red-50 text-red-600 text-xs rounded flex items-center gap-2 font-bold border border-red-100">
                                            <AlertCircle size={14} />
                                            警告：LINE Pay 實際入帳金額與訂單金額不符！
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-black transition"
                    >
                        關閉
                    </button>
                </div>

            </div>
        </div>
    );
}