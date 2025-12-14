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
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [lockedImage, setLockedImage] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    // Variants State
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null);



    // ... (query & effects) ...

    // 1. Fetch Product Data
    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', slug],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Product }>(`/products/${slug}`);
            return res.data.data;
        },
        enabled: !!slug,
    });

    // Auto-select removed as per user request
    // useEffect(() => { ... }, [product]);

    // Update current variant based on selection
    useEffect(() => {
        if (!product?.variants || !product.options || product.options.length === 0) {
            setCurrentVariant(null);
            return;
        }

        // Fix: If no options selected, do not match any variant (vacuous truth of .every())
        if (Object.keys(selectedOptions).length === 0) {
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
                variantId: currentVariant?.id, // [New] Pass variantId
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
    const getDisplayPrice = () => {
        if (currentVariant) return `$${Number(currentVariant.price).toLocaleString()}`;
        if (!product) return '$0';

        if (product.variants && product.variants.length > 0) {
            const prices = product.variants.map(v => Number(v.price));
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            if (minPrice !== maxPrice) {
                return `$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`;
            }
            return `$${minPrice.toLocaleString()}`;
        }

        return `$${Number(product.price).toLocaleString()}`;
    };
    const displayPriceString = getDisplayPrice();
    const displayStock = currentVariant ? currentVariant.stock : (product ? product.stock : 0);
    const isOutOfStock = displayStock <= 0;

    // Get unique variant images
    const variantImages = product?.variants
        ?.filter(v => v.image)
        .map(v => v.image as string)
        .filter((value, index, self) => self.indexOf(value) === index) || [];

    const handleOptionSelect = (optionName: string, value: string) => {
        // Update options
        setSelectedOptions(prev => {
            const next = { ...prev, [optionName]: value };
            return next;
        });
        // Unlock manually locked image to allow variant image to show
        setLockedImage(null);
    };

    // Handle global click to unlock image
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // If click is NOT inside a variant thumbnail button
            if (!target.closest('[data-variant-thumb="true"]')) {
                setLockedImage(null);
            }
        };

        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

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

    // Priority: Preview (Hover) > Locked (Thumbnail Click) > Current Variant Image (Option Select) > Default Product Image
    const displayImage = previewImage || lockedImage || currentVariant?.image || product.images[selectedImageIndex];

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
                        {displayImage ? (
                            <img
                                src={displayImage}
                                alt={product.name}
                                className="w-full h-full object-contain md:object-cover hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                        )}
                    </div>

                    {/* Unified Image Gallery Thumbnails */}
                    {(() => {
                        // Combine main images and variant images, ensuring uniqueness
                        const allImages = Array.from(new Set([
                            ...(product.images || []),
                            ...variantImages
                        ]));

                        if (allImages.length <= 1) return null;

                        return (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        data-variant-thumb="true" // Enable click-outside unlock for all thumbs
                                        onClick={() => {
                                            setLockedImage(img);
                                            // Optional: If this image matches a variant, maybe select that variant? 
                                            // But for now just lock the image. 
                                            // Also update selectedImageIndex if it's one of the original main images
                                            const mainIndex = product.images.indexOf(img);
                                            if (mainIndex !== -1) setSelectedImageIndex(mainIndex);
                                        }}
                                        onMouseEnter={() => setPreviewImage(img)}
                                        onMouseLeave={() => setPreviewImage(null)}
                                        className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${(previewImage === img || lockedImage === img || (!previewImage && !lockedImage && product.images[selectedImageIndex] === img))
                                            ? 'border-black opacity-100'
                                            : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        );
                    })()}


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
                            {displayPriceString}
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


        </div>
    );
}
