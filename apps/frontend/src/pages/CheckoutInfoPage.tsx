import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../api/client';
import { useCartStore } from '../store/useCartStore';
import { OrderInput } from '../types';
import CheckoutProgress from '../components/CheckoutProgress';

export default function CheckoutInfoPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { checkoutInfo, items } = useCartStore();

    // Redirect if cart is empty or info missing (optional robust check)
    if (items.length === 0) {
        // navigate('/cart'); // Too strict for reload? Let's leave for now.
    }

    const { register, handleSubmit, formState: { errors } } = useForm<OrderInput>({
        defaultValues: {
            deliveryMethod: checkoutInfo?.deliveryMethod,
            paymentMethod: checkoutInfo?.paymentMethod,
        }
    });

    const checkoutMutation = useMutation({
        mutationFn: async (data: OrderInput) => {
            // Merge stored info with form data just in case, though form has it
            const finalData = { ...checkoutInfo, ...data };
            const promise = apiClient.post('/orders', finalData);

            toast.promise(promise, {
                loading: '正在建立訂單...',
                success: '🎉 訂單建立成功！',
                error: (err) => `結帳失敗: ${err.response?.data?.message || '未知錯誤'}`
            });

            const res = await promise;
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            // Assuming data.data.orderId is the structure based on previous controllers
            const orderId = data.data.orderId;
            navigate(`/orders/success/${orderId}`);
        },
    });

    const onSubmit = (data: OrderInput) => {
        checkoutMutation.mutate(data);
    };

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
            <CheckoutProgress step={2} />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-bold mb-4">收件人資料</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">收件人姓名</label>
                            <input
                                {...register('recipient', { required: '請輸入姓名' })}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="王小明"
                            />
                            {errors.recipient && <p className="text-red-500 text-xs mt-1">{errors.recipient.message}</p>}
                            <p className="text-xs text-[#E85A32] mt-1">請填寫『與證件相符』之真實姓名，以確保順利收件</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">聯絡電話</label>
                            <input
                                {...register('phone', { required: '請輸入電話', minLength: { value: 10, message: '號碼格式錯誤' } })}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0912345678"
                            />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium mb-1">城市</label>
                                <input
                                    {...register('city', { required: '必填' })}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="城市"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">詳細地址</label>
                                <input
                                    {...register('address', { required: '必填' })}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="街道地址"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/cart')}
                        className="flex-1 bg-gray-200 text-black py-3 rounded-lg font-bold hover:bg-gray-300"
                    >
                        回上一步
                    </button>
                    <button
                        type="submit"
                        disabled={checkoutMutation.isPending}
                        className="flex-1 bg-[#E85A32] text-white py-3 rounded-lg font-bold border-2 border-[#1B2F4A] shadow-[4px_4px_0px_#1B2F4A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1B2F4A] transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:shadow-none"
                    >
                        {checkoutMutation.isPending ? '處理中...' : '確認結帳'}
                    </button>
                </div>
            </form>
        </div>
    );
}
