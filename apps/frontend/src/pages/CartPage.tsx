//CartPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { Cart } from '../types';
import { useCartStore } from '../store/useCartStore';

import { Skeleton } from '../components/ui/Skeleton';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

import CheckoutProgress from '../components/CheckoutProgress';
import clsx from 'clsx';

export default function CartPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { checkoutInfo, setCheckoutInfo } = useCartStore();

    const { register, handleSubmit, watch } = useForm<{
        deliveryMethod: string;
        paymentMethod: string;
    }>({
        defaultValues: {
            deliveryMethod: checkoutInfo?.deliveryMethod || 'HOME_DELIVERY',
            paymentMethod: checkoutInfo?.paymentMethod || 'CREDIT_CARD'
        }
    });

    const watchedDelivery = watch('deliveryMethod');
    const watchedPayment = watch('paymentMethod');

    const onSubmit = (data: { deliveryMethod: string; paymentMethod: string }) => {
        setCheckoutInfo(data);
        navigate('/checkout/info');
    };

    // 1. 取得購物車資料
    const { data: cart, isLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Cart }>('/cart');
            return res.data.data;
        },
    });

    // 2. 更新數量 Mutation
    const updateQuantityMutation = useMutation({
        mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
            return apiClient.patch(`/cart/items/${id}`, { quantity });
        },
        onSuccess: () => {
            // 成功後只需讓 React Query 重新撈資料，UI 就會自動更新價格
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    // 3. 刪除商品 Mutation
    const removeItemMutation = useMutation({
        mutationFn: async (id: number) => {
            // API 路徑應該是 /cart/items/:id (這裡的 id 是 CartItem 的 id)
            return apiClient.delete(`/cart/items/${id}`);
        },
        onSuccess: () => {
            // 成功後重新撈取資料
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            // 可以加個提示
            toast.success('商品已移除');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || '刪除失敗');
        }
    });


    // --- 處理載入與空狀態 ---

    // 處理 Loading 狀態
    if (isLoading) {
        return (
            <div className="p-4 md:p-8">
                <CheckoutProgress step={1} />
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* 左側列表骨架 */}
                    <div className="flex-1 space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex gap-4 p-4 border rounded-lg items-center">
                                <Skeleton className="w-24 h-24 rounded-md" /> {/* 圖片 */}
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-6 w-1/3" /> {/* 品名 */}
                                    <Skeleton className="h-4 w-20" />  {/* 價格 */}
                                </div>
                                <Skeleton className="h-8 w-24" />    {/* 數量按鈕 */}
                                <Skeleton className="h-8 w-8" />     {/* 刪除按鈕 */}
                            </div>
                        ))}
                    </div>

                    {/* 右側結帳區骨架 */}
                    <div className="lg:w-80">
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
                <ShoppingBag size={64} className="mb-4 text-gray-300" />
                <p className="text-xl font-medium mb-4">購物車是空的</p>
                <Link to="/" className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">
                    去逛逛
                </Link>
            </div>
        );
    }

    // --- 主要 UI ---

    return (
        <div className="p-4 md:p-8">
            <CheckoutProgress step={1} />

            <div className="flex flex-col lg:flex-row gap-8">
                {/* 左側：商品列表 */}
                <div className="flex-1 space-y-4">
                    {cart.items.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 border rounded-lg bg-white shadow-sm items-center">
                            {/* 商品圖片 */}
                            {/* 商品圖片 */}
                            <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                {(() => {
                                    const variant = item.variantId ? item.product.variants?.find(v => v.id === item.variantId) : null;
                                    const displayImage = variant?.image || item.product.images[0];

                                    return displayImage ? (
                                        <img src={displayImage} alt={item.product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                    );
                                })()}
                            </div>

                            {/* 商品資訊 */}
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">
                                    <Link to={`/products/${item.product.slug}`} className="hover:underline">
                                        {item.product.name}
                                    </Link>
                                </h3>
                                {(() => {
                                    const variant = item.variantId ? item.product.variants?.find(v => v.id === item.variantId) : null;
                                    const price = Number(variant?.price ?? item.product.price);

                                    // Calculate sale price
                                    let salePrice: number | null = null;
                                    if (variant) {
                                        if (variant.isOnSale && variant.salePrice) {
                                            salePrice = Number(variant.salePrice);
                                        }
                                    } else {
                                        if (item.product.isOnSale && item.product.salePrice) {
                                            salePrice = Number(item.product.salePrice);
                                        }
                                    }

                                    return (
                                        <div className="space-y-1">
                                            {salePrice ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-red-500 font-bold">
                                                        ${salePrice.toLocaleString()}
                                                    </span>
                                                    <span className="text-gray-400 text-sm line-through">
                                                        ${price.toLocaleString()}
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="text-gray-600 font-medium">
                                                    ${price.toLocaleString()}
                                                </p>
                                            )}

                                            {variant && (
                                                <div className="text-sm text-gray-500 flex flex-wrap gap-2">
                                                    {Object.entries(variant.combination).map(([key, val]) => (
                                                        <span key={key} className="bg-gray-100 px-2 py-0.5 rounded">
                                                            {key}: {val}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* 數量調整器 */}
                            <div className="flex items-center gap-3 bg-gray-50 px-3 py-1 rounded-lg">
                                <button
                                    onClick={() => {
                                        if (item.quantity > 1) {
                                            updateQuantityMutation.mutate({ id: item.id, quantity: item.quantity - 1 });
                                        }
                                    }}
                                    disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                                    className="p-1 hover:text-blue-600 disabled:opacity-30"
                                >
                                    <Minus size={16} />
                                </button>

                                <span className="font-medium w-4 text-center">{item.quantity}</span>

                                <button
                                    onClick={() => {
                                        // 這裡可以加判斷庫存
                                        updateQuantityMutation.mutate({ id: item.id, quantity: item.quantity + 1 });
                                    }}
                                    disabled={updateQuantityMutation.isPending}
                                    className="p-1 hover:text-blue-600 disabled:opacity-30"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            {/* 刪除按鈕 */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();

                                    // 使用 Sonner 的自訂 UI
                                    toast('移除商品', {
                                        description: `確定要移除 ${item.product.name} 嗎？`,
                                        action: {
                                            label: '移除',
                                            onClick: () => removeItemMutation.mutate(item.id),
                                        },
                                        cancel: {
                                            label: '取消',
                                            onClick: () => { },
                                        },
                                    });
                                }}
                                className="text-gray-400 hover:text-red-500 p-2"
                                disabled={removeItemMutation.isPending}
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* 右側：結帳摘要 & 表單 */}
                <div className="lg:w-96">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* 送貨方式 */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-bold mb-4">送貨方式</h3>
                            <div className="space-y-3">
                                <label className={clsx("flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                                    watchedDelivery === 'HOME_DELIVERY' ? 'border-black bg-gray-50' : 'border-gray-200'
                                )}>
                                    <input
                                        type="radio"
                                        {...register('deliveryMethod')}
                                        value="HOME_DELIVERY"
                                        className="w-4 h-4 text-black focus:ring-black"
                                    />
                                    <span>宅配到府</span>
                                </label>
                                <label className={clsx("flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                                    watchedDelivery === 'STORE_PICKUP' ? 'border-black bg-gray-50' : 'border-gray-200'
                                )}>
                                    <input
                                        type="radio"
                                        {...register('deliveryMethod')}
                                        value="STORE_PICKUP"
                                        className="w-4 h-4 text-black focus:ring-black"
                                    />
                                    <span>超商取貨</span>
                                </label>
                            </div>
                        </div>



                        {/* 付款方式 */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-bold mb-4">付款方式</h3>
                            <div className="space-y-3">
                                <label className={clsx("flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                                    watchedPayment === 'CREDIT_CARD' ? 'border-black bg-gray-50' : 'border-gray-200'
                                )}>
                                    <input
                                        type="radio"
                                        {...register('paymentMethod')}
                                        value="CREDIT_CARD"
                                        className="w-4 h-4 text-black focus:ring-black"
                                    />
                                    <span>信用卡一次付清</span>
                                </label>
                                <label className={clsx("flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                                    watchedPayment === 'ATM' ? 'border-black bg-gray-50' : 'border-gray-200'
                                )}>
                                    <input
                                        type="radio"
                                        {...register('paymentMethod')}
                                        value="ATM"
                                        className="w-4 h-4 text-black focus:ring-black"
                                    />
                                    <span>ATM 轉帳</span>
                                </label>
                                <label className={clsx("flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                                    watchedPayment === 'LINE_PAY' ? 'border-black bg-gray-50' : 'border-gray-200'
                                )}>
                                    <input
                                        type="radio"
                                        {...register('paymentMethod')}
                                        value="LINE_PAY"
                                        className="w-4 h-4 text-black focus:ring-black"
                                    />
                                    <span>LINE Pay</span>
                                </label>
                            </div>
                        </div>

                        {/* 訂單摘要 Sticky */}
                        <div className="bg-gray-50 p-6 rounded-lg border sticky top-24">
                            <h2 className="text-xl font-bold mb-4">訂單摘要</h2>

                            <div className="space-y-2 mb-4 text-gray-600">
                                <div className="flex justify-between">
                                    <span>小計</span>
                                    <span>${cart.totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>運費</span>
                                    <span>$0</span>
                                </div>
                            </div>

                            <div className="border-t pt-4 mb-6 flex justify-between font-bold text-xl">
                                <span>總金額</span>
                                <span>${cart.totalAmount.toLocaleString()}</span>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#E85A32] text-white py-3 rounded-lg font-bold border-2 border-[#1B2F4A] shadow-[4px_4px_0px_#1B2F4A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1B2F4A] transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                            >
                                下一步：填寫資料
                            </button>
                        </div>
                    </form>
                </div>
            </div>

        </div>
    );
}