import { X, MapPin, Phone, User } from 'lucide-react';
import { Order } from '../types';

interface Props {
    order: Order | null;
    onClose: () => void;
}

export default function AdminOrderDetailModal({ order, onClose }: Props) {
    if (!order) return null;

    // 解析 shippingInfo (因為後端傳來可能是 JSON 物件)
    const shipping = typeof order.shippingInfo === 'string'
        ? JSON.parse(order.shippingInfo)
        : order.shippingInfo;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black">
                    <X size={24} />
                </button>

                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-1">訂單詳情</h2>
                    <p className="text-gray-500 text-sm mb-6">#{order.id}</p>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* 買家資訊 */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-bold mb-3 flex items-center gap-2">
                                <User size={18} /> 買家資訊
                            </h3>
                            <p className="text-sm"><span className="text-gray-500">帳號:</span> {order.user?.email}</p>
                            <p className="text-sm"><span className="text-gray-500">姓名:</span> {order.user?.name || '未設定'}</p>
                        </div>

                        {/* 收件資訊 */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-bold mb-3 flex items-center gap-2">
                                <MapPin size={18} /> 收件資訊
                            </h3>
                            <p className="text-sm"><span className="text-gray-500">收件人:</span> {shipping.recipient}</p>
                            <p className="text-sm flex items-center gap-1">
                                <Phone size={14} className="text-gray-400" /> {shipping.phone}
                            </p>
                            <p className="text-sm mt-1">{shipping.city}{shipping.address}</p>
                        </div>
                    </div>

                    {/* 商品列表 */}
                    <h3 className="font-bold mb-3">商品明細</h3>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3">商品</th>
                                    <th className="p-3 text-right">單價</th>
                                    <th className="p-3 text-center">數量</th>
                                    <th className="p-3 text-right">小計</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.id} className="border-t">
                                        <td className="p-3">{item.product.name}</td>
                                        <td className="p-3 text-right">${Number(item.price).toLocaleString()}</td>
                                        <td className="p-3 text-center">{item.quantity}</td>
                                        <td className="p-3 text-right font-medium">
                                            ${(Number(item.price) * item.quantity).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-bold">
                                <tr>
                                    <td colSpan={3} className="p-3 text-right">總金額</td>
                                    <td className="p-3 text-right text-lg">${Number(order.totalAmount).toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}