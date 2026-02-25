//CheckoutModal.tsx
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/client';
import { OrderInput } from '../../../types';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: Props) {
    const { register, handleSubmit, formState: { errors } } = useForm<OrderInput>();
    const queryClient = useQueryClient();

    const checkoutMutation = useMutation({
        mutationFn: async (data: OrderInput) => {
            const promise = apiClient.post('/orders', data);

            toast.promise(promise, {
                loading: '正在建立訂單...',
                success: '🎉 訂單建立成功！',
                error: (err) => `結帳失敗: ${err.response?.data?.message || '未知錯誤'}`
            });

            return promise;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            onClose();
        },
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black">
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-4">填寫收件資訊</h2>

                <form onSubmit={handleSubmit((data) => checkoutMutation.mutate(data))} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">收件人姓名</label>
                        <input
                            {...register('recipient', { required: '請輸入姓名' })}
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="王小明"
                        />
                        {errors.recipient && <p className="text-red-500 text-xs mt-1">{errors.recipient.message}</p>}
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
                                placeholder="台北市"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">詳細地址</label>
                            <input
                                {...register('address', { required: '必填' })}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="信義路五段7號"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={checkoutMutation.isPending}
                        className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 mt-6"
                    >
                        {checkoutMutation.isPending ? '處理中...' : '確認結帳'}
                    </button>
                </form>
            </div>
        </div>
    );
}