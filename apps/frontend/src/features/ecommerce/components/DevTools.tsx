import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/api/client';
import { toast } from 'sonner';
import { useLocation, useParams } from 'react-router-dom';

/**
 * [DEVELOPER ONLY] DevTools Panel for production-safe testing.
 */
export const DevTools: React.FC = () => {
    const { user } = useAuthStore();
    const { pathname } = useLocation();
    const params = useParams();
    const [isVisible, setIsVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Toggle panel visibility via Ctrl + Alt + D
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
                setIsVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (user?.role !== 'DEVELOPER' || !isVisible) return null;

    const setNativeValue = (element: HTMLInputElement | HTMLSelectElement, value: string) => {
        const valueSetter = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'value')?.set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

        if (valueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter?.call(element, value);
        } else {
            valueSetter?.call(element, value);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const resetMyData = async () => {
        if (!user?.id) return;
        try {
            await apiClient.post('/admin/reset-test-data', { userId: user.id });
            toast.success('測試資料已重置 (Cart & AI Quota)');
            window.location.reload();
        } catch (error) {
            toast.error('重置失敗');
        }
    };

    const quickFillCheckout = () => {
        const testData = {
            recipient: "測試員-育瑋",
            phone: "0912345678",
            city: "台北市",
            address: "開發路 3000 號",
            deliveryMethod: "宅配",
            paymentMethod: "LINE_PAY"
        };

        Object.entries(testData).forEach(([name, value]) => {
            const input = document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement;
            if (input) {
                setNativeValue(input, value);
            }
        });
        toast.success('已自動填入測試地址與付款方式');
    };

    const simulatePayment = async () => {
        const orderId = params.id;
        if (!orderId) {
            toast.error('找不到訂單 ID (請在訂單成功頁或詳情頁執行)');
            return;
        }

        try {
            await apiClient.patch(`/orders/${orderId}/pay`);
            toast.success('模擬付款成功！');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            toast.error('模擬失敗');
        }
    };

    const checkStatus = async () => {
        const orderId = params.id;
        if (!orderId) return;

        try {
            // 1. Get order details to find transactionId (paymentId)
            const orderRes = await apiClient.get(`/orders/${orderId}`);
            const paymentId = orderRes.data.data.paymentId;

            if (!paymentId) {
                toast.error('該訂單目前無 LINE Pay 交易編號');
                return;
            }

            // 2. Poll status from LINE Pay via backend
            const res = await apiClient.get(`/payment/line-pay/requests/${paymentId}/check`);
            const status = res.data.data.returnCode;
            const message = res.data.data.returnMessage;

            if (status === '0000') {
                toast.success(`LINE Pay 狀態: 已付款 (${message})`);
            } else {
                toast.info(`LINE Pay 狀態: ${status} (${message})`);
            }
        } catch (error) {
            toast.error('狀態查詢失敗');
        }
    };

    const togglePremiumSimulation = () => {
        if (user) {
            useAuthStore.getState().setAuth({
                ...user,
                isPremium: !user.isPremium
            });
            toast.success(`Premium 模擬模式: ${!user.isPremium ? '開啟' : '關閉'}`);
        }
    };

    const isCheckoutPage = pathname.includes('/checkout/info');
    const isOrderPage = pathname.includes('/orders/success') || (pathname.includes('/orders/') && !pathname.includes('/admin'));

    return (
        <div className="fixed bottom-24 right-4 z-[9999] animate-in fade-in slide-in-from-bottom-5">
            <div className={`transition-all duration-300 ${isOpen ? 'w-64' : 'w-auto'}`}>
                <div className="bg-black/90 backdrop-blur-md text-white rounded-xl shadow-2xl border border-red-500/50 overflow-hidden">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full flex items-center justify-between p-3 bg-red-500/20 hover:bg-red-500/30 transition-colors"
                    >
                        <span className="font-bold flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            🛠️ DevTools
                        </span>
                        <span>{isOpen ? '▼' : '▲'}</span>
                    </button>

                    {isOpen && (
                        <div className="p-4 space-y-4">
                            <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider border-b border-zinc-800 pb-2">
                                Role: {user?.role} | Premium: {user?.isPremium ? 'ON' : 'OFF'}
                            </div>

                            <div className="grid grid-cols-1 gap-2 text-sm">
                                {isCheckoutPage && (
                                    <button
                                        onClick={quickFillCheckout}
                                        className="flex items-center gap-2 w-full text-left p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-300 transition-colors group"
                                    >
                                        <span className="group-hover:scale-110 transition-transform">📝</span>
                                        一鍵填寫結帳資料
                                    </button>
                                )}

                                {isOrderPage && (
                                    <>
                                        <button
                                            onClick={simulatePayment}
                                            className="flex items-center gap-2 w-full text-left p-2 bg-green-500/20 hover:bg-green-500/30 rounded text-green-300 transition-colors group"
                                        >
                                            <span className="group-hover:scale-110 transition-transform">💰</span>
                                            模擬付款成功
                                        </button>
                                        <button
                                            onClick={checkStatus}
                                            className="flex items-center gap-2 w-full text-left p-2 bg-amber-500/20 hover:bg-amber-500/30 rounded text-amber-300 transition-colors group"
                                        >
                                            <span className="group-hover:scale-110 transition-transform">🔎</span>
                                            查詢 LINE Pay 狀態
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={togglePremiumSimulation}
                                    className="flex items-center gap-2 w-full text-left p-2 hover:bg-white/10 rounded transition-colors group"
                                >
                                    <span className="group-hover:scale-110 transition-transform">💎</span>
                                    切換 Premium 狀態
                                </button>

                                <button
                                    onClick={resetMyData}
                                    className="flex items-center gap-2 w-full text-left p-2 hover:bg-white/10 rounded text-red-400 transition-colors group"
                                >
                                    <span className="group-hover:scale-110 transition-transform">🧹</span>
                                    重置測試資料
                                </button>
                            </div>

                            <div className="pt-2 border-t border-zinc-800">
                                <div className="text-[9px] text-zinc-400 font-mono">
                                    Current Path: {pathname}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
