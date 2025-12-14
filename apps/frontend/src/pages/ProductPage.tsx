import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, ArrowLeft, Minus, Plus } from 'lucide-react';
import apiClient from '../api/client';
import { Product, ProductVariant } from '../types';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/Skeleton';

export default function ProductPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);

    // Variants State
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null);

    // 1. Fetch Product Data
    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Product }>(`/products/${id}`);
            return res.data.data;
        },
        enabled: !!id,
    });

    // Auto-select first variant options when product loads
    useEffect(() => {
        if (product?.options && product.options.length > 0 && Object.keys(selectedOptions).length === 0) {
            const defaults: Record<string, string> = {};
            product.options.forEach(opt => {
                if (opt.values.length > 0) {
                    defaults[opt.name] = opt.values[0];
                }
            });
            setSelectedOptions(defaults);
        }
    }, [product]);

    // Update current variant based on selection
    useEffect(() => {
        if (!product?.variants || !product.options || product.options.length === 0) {
            setCurrentVariant(null);
            return;
        }

        const variant = product.variants.find(v =>
            Object.entries(selectedOptions).every(([key, val]) => v.combination[key] === val)
        );
        setCurrentVariant(variant || null);
    }, [selectedOptions, product]);

    // 2. Add to Cart Mutation
    const addToCartMutation = useMutation({
        mutationFn: async () => {
            if (!product) return;
            return apiClient.post('/cart/items', {
                productId: product.id,
                quantity
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('已加入購物車');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || '加入失敗');
        }
    });

    const handleAddToCart = () => {
        if (!user) {
            toast.error('請先登入');
            navigate('/login');
            return;
        }
        addToCartMutation.mutate();
    };

    // Derived Display Values
    const displayPrice = currentVariant ? currentVariant.price : (product ? Number(product.price) : 0);
    const displayStock = currentVariant ? currentVariant.stock : (product ? product.stock : 0);
    const isOutOfStock = displayStock <= 0;

    const handleOptionSelect = (optionName: string, value: string) => {
        setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <Skeleton className="w-full md:w-1/2 aspect-square rounded-lg" />
                    <div className="flex-1 space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-12 w-40" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
                <h2 className="text-2xl font-bold">找不到商品</h2>
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                    <ArrowLeft size={20} /> 回首頁
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Breadcrumb / Back */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-black mb-6 transition-colors"
            >
                <ArrowLeft size={20} /> 返回上一頁
            </button>

            <div className="flex flex-col md:flex-row gap-10">
                {/* --- Left: Image Gallery --- */}
                <div className="w-full md:w-1/2 space-y-4">
                    {/* Main Image */}
                    <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-sm border">
                        {product.images[selectedImageIndex] ? (
                            <img
                                src={product.images[selectedImageIndex]}
                                alt={product.name}
                                className="w-full h-full object-contain md:object-cover hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {product.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImageIndex(idx)}
                                    className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'border-black opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- Right: Product Info --- */}
                <div className="flex-1 space-y-6">
                    <div>
                        {product.category && (
                            <span className="text-sm text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                                {product.category.name}
                            </span>
                        )}
                        <h1 className="text-3xl md:text-4xl font-extrabold mt-3 text-gray-900">{product.name}</h1>
                        <div className="text-2xl font-bold mt-2 text-gray-900">
                            ${displayPrice.toLocaleString()}
                        </div>
                    </div>

                    <div className="prose prose-sm text-gray-600 border-t border-b py-6">
                        <p className="whitespace-pre-line leading-relaxed">{product.description || '暫無商品描述'}</p>
                    </div>

                    {/* Variants Selection */}
                    {product.options && product.options.length > 0 && (
                        <div className="space-y-4">
                            {product.options.map(option => (
                                <div key={option.id}>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">{option.name}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {option.values.map(val => {
                                            const isSelected = selectedOptions[option.name] === val;
                                            return (
                                                <button
                                                    key={val}
                                                    onClick={() => handleOptionSelect(option.name, val)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all
                                                            ${isSelected
                                                            ? 'border-black bg-black text-white'
                                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {val}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">數量</span>
                            <span className="text-sm text-gray-500">庫存: {displayStock}</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="p-3 hover:bg-gray-100 active:bg-gray-200 transition"
                                    disabled={quantity <= 1}
                                >
                                    <Minus size={18} />
                                </button>
                                <span className="w-12 text-center font-medium">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                                    className="p-3 hover:bg-gray-100 active:bg-gray-200 transition"
                                    disabled={quantity >= displayStock}
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={addToCartMutation.isPending || isOutOfStock}
                                className={`flex-1 py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 text-lg shadow-md transition-all active:scale-95 ${isOutOfStock
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-black text-white hover:bg-gray-800'
                                    }`}
                            >
                                <ShoppingCart size={20} />
                                {isOutOfStock ? '已售完' : addToCartMutation.isPending ? '加入中...' : '加入購物車'}
                            </button>
                        </div>
                    </div>

                    {/* Extra Info / Policies can go here */}
                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500 space-y-2">
                        <p>✓ 24小時快速出貨</p>
                        <p>✓ 7天鑑賞期，安心退換貨</p>
                    </div>
                </div>
            </div>

            {/* Detailed Images Section */}
            {product.detailImages && product.detailImages.length > 0 && (
                <div className="mt-16 w-full max-w-4xl mx-auto">
                    <h2 className="text-xl font-bold mb-6 text-center">商品詳情</h2>
                    <div className="space-y-0 text-center">
                        {product.detailImages.map((img, idx) => (
                            <img
                                key={idx}
                                src={img}
                                alt={`Detail ${idx + 1}`}
                                className="w-full h-auto block mx-auto"
                                loading="lazy"
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
