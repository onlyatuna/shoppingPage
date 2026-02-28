import { useParams, Link } from 'react-router-dom';
import { CheckCircle, MapPin, DollarSign, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import CheckoutProgress from '../components/CheckoutProgress';
import SakuraPetal from '../components/SakuraPetal'; // assuming we have SakuraPetal

export default function OrderSuccessPage() {
    const { id } = useParams<{ id: string }>();

    const { data: order, isLoading } = useQuery({
        queryKey: ['order', id],
        queryFn: async () => {
            const res = await apiClient.get(`/orders/${id}`);
            return res.data.data;
        },
        enabled: !!id
    });

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center pb-20 relative overflow-hidden">
            {/* Show some falling sakura petals for celebration */}
            <SakuraPetal className="absolute -top-10 left-1/4 opacity-70" size={16} delay={0} duration={6} animationType="fall" />
            <SakuraPetal className="absolute -top-10 right-1/4 opacity-60 text-pink-200" size={12} delay={1} duration={8} animationType="fall" />
            <SakuraPetal className="absolute -top-10 left-1/2 opacity-50 text-red-200" size={18} delay={2} duration={7} animationType="fall" />

            <CheckoutProgress step={3} />
            <div className={`bg-green-100 p-6 rounded-full mb-6 mt-8 transition-transform duration-700 ${order?.status === 'PAID' ? 'scale-110 shadow-[0_0_30px_rgba(74,222,128,0.5)]' : 'scale-100'}`}>
                <CheckCircle className="w-16 h-16 text-green-600" />
            </div>

            <h1 className="text-3xl font-black mb-2 text-[#1A2B42]">
                {order?.status === 'PAID' ? '付款成功！訂單已成立' : '訂單建立成功！'}
            </h1>
            <p className="text-gray-600 mb-6 text-lg font-medium">感謝您的購買，我們會盡快為您安排出貨。</p>

            <div className="w-full max-w-md bg-white border-2 border-[#1A2B42] rounded-xl shadow-[4px_4px_0px_#1A2B42] overflow-hidden mb-8 text-left relative">
                <div className="bg-[#5A9EA3] text-white p-3 font-bold flex justify-between items-center border-b-2 border-[#1A2B42]">
                    <span>訂單資訊</span>
                    <span className="text-xs bg-white text-[#1A2B42] px-2 py-1 rounded shadow-sm font-mono">#{id?.slice(0, 8)}</span>
                </div>

                {isLoading ? (
                    <div className="p-8 flex justify-center items-center text-gray-400">
                        <Loader2 className="animate-spin mr-2" /> 載入中...
                    </div>
                ) : order ? (
                    <div className="p-5 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-gray-500">
                                <DollarSign size={18} className="text-[#E85D3F]" />
                                <span className="font-bold">總金額</span>
                            </div>
                            <span className="text-2xl font-black text-[#1A2B42]">${Number(order.totalAmount).toLocaleString()}</span>
                        </div>

                        <div className="flex items-start gap-2 pt-2">
                            <UserIcon className="text-gray-400 mt-1" size={16} />
                            <div>
                                <p className="text-xs text-gray-400 font-bold mb-1">收件人</p>
                                <p className="text-sm font-medium text-gray-900">{order.shippingInfo?.recipient} ({order.shippingInfo?.phone})</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 pt-2">
                            <MapPin className="text-gray-400 mt-1" size={16} />
                            <div>
                                <p className="text-xs text-gray-400 font-bold mb-1">配送地址</p>
                                <p className="text-sm font-medium text-gray-900">{order.shippingInfo?.city} {order.shippingInfo?.address}</p>
                                <p className="text-xs text-[#5A9EA3] mt-1 p-1 bg-[#5A9EA3]/10 inline-block rounded font-bold">
                                    {order.shippingInfo?.deliveryMethod}
                                </p>
                            </div>
                        </div>

                        {order.status !== 'PAID' && order.shippingInfo?.paymentMethod === 'LINE_PAY' && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm font-bold flex flex-col gap-2">
                                <span>⚠️ 此訂單正在等待付款確認。</span>
                                <span className="text-xs font-normal">若您已於跳轉頁面付款，稍後幾分鐘內系統將會自動更新狀態。</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-5 text-center text-red-500 font-bold">無法讀取訂單資訊</div>
                )}
            </div>

            <div className="flex gap-4">
                <Link
                    to="/work/ecommerce/demo/orders"
                    className="px-6 py-3 font-bold border-2 border-[#1A2B42] rounded-lg hover:bg-gray-50 transition-colors shadow-[2px_2px_0px_#1A2B42] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
                >
                    查看訂單
                </Link>
                <Link
                    to="/work/ecommerce/demo"
                    className="px-6 py-3 font-bold bg-[#E85D3F] text-white rounded-lg hover:bg-[#d65135] transition-colors border-2 border-[#1A2B42] shadow-[2px_2px_0px_#1A2B42] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
                >
                    繼續購物
                </Link>
            </div>
        </div>
    );
}

const UserIcon = ({ className, size }: { className?: string, size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);
