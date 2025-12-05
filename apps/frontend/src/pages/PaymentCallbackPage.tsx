//PaymentCallbackPage.tsx
import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '../api/client';
import { Loader2 } from 'lucide-react';

export default function PaymentCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const processed = useRef(false); // 防止 React StrictMode 跑兩次

    const transactionId = searchParams.get('transactionId');
    const orderId = searchParams.get('orderId');
    console.log('Frontend Params:', { transactionId, orderId });
    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        if (!transactionId || !orderId) {
            toast.error('參數錯誤，無法確認付款');
            navigate('/orders');
            return;
        }

        const confirmPayment = async () => {
            try {
                await apiClient.post('/payment/line-pay/confirm', {
                    transactionId,
                    orderId
                });
                toast.success('🎉 付款成功！');
                navigate('/orders'); // 跳回訂單頁
            } catch (error) {
                console.error(error);
                toast.error('付款確認失敗，請聯繫客服');
                navigate('/orders');
            }
        };

        confirmPayment();
    }, [transactionId, orderId, navigate]);

    return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 size={48} className="animate-spin text-green-500" />
            <h2 className="text-xl font-bold">正在確認 LINE Pay 付款...</h2>
            <p className="text-gray-500">請勿關閉視窗</p>
        </div>
    );
}