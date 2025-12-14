import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';

interface ProductCardProps {
    product: Product;
    addToCartMutation: any;
}

export default function ProductCard({ product, addToCartMutation }: ProductCardProps) {
    const { user } = useAuthStore();
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Get unique variant images
    const variantImages = product.variants
        ?.filter(v => v.image)
        .map(v => v.image as string)
        .filter((value, index, self) => self.indexOf(value) === index) || [];

    const displayImage = previewImage || product.images[0];

    return (
        <div className="group bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
            <Link to={`/products/${product.slug}`} className="block relative">
                {/* Main Image Area */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    {displayImage ? (
                        <img
                            src={displayImage}
                            alt={product.name}
                            className={`w-full h-full object-contain md:object-cover transition-transform duration-500 ${!previewImage ? 'group-hover:scale-105' : ''}`}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                    )}

                    {/* Sold Out Overlay */}
                    {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none">
                            <span className="bg-gray-800 text-white px-4 py-1 text-sm font-bold rounded">已售完</span>
                        </div>
                    )}
                </div>
            </Link>

            <div className="p-4 flex flex-col flex-1 gap-2">
                {/* Variant Thumbnails */}
                {variantImages.length > 0 && (
                    <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {/* Variant Thumbnails - Only show variant images */}

                        {variantImages.map((img, idx) => (
                            <button
                                key={idx}
                                onMouseEnter={() => setPreviewImage(img)}
                                onMouseLeave={() => setPreviewImage(null)}
                                className={`w-10 h-10 border rounded overflow-hidden shrink-0 ${previewImage === img ? 'ring-1 ring-black' : ''}`}
                            >
                                <img src={img} alt={`Variant ${idx}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                <Link to={`/products/${product.slug}`} className="block">
                    <h3 className="font-bold text-lg truncate" title={product.name}>{product.name}</h3>

                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xl font-bold text-gray-900">
                            {(() => {
                                if (product.variants && product.variants.length > 0) {
                                    const prices = product.variants.map(v => v.price);
                                    const min = Math.min(...prices);
                                    const max = Math.max(...prices);
                                    return min === max
                                        ? `$${min.toLocaleString()}`
                                        : `$${min.toLocaleString()} - $${max.toLocaleString()}`;
                                }
                                return `$${Number(product.price).toLocaleString()}`;
                            })()}
                        </span>
                        <span className="text-sm text-gray-500">
                            庫存: {product.stock}
                        </span>
                    </div>
                </Link>

                <div className="mt-auto pt-2">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            if (!user) return toast.error('請先登入');
                            addToCartMutation.mutate(product.id);
                        }}
                        disabled={addToCartMutation.isPending || product.stock <= 0}
                        className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${product.stock <= 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-800 active:scale-95'
                            }`}
                    >
                        <ShoppingCart size={18} />
                        {product.stock <= 0 ? '補貨中' : '加入購物車'}
                    </button>
                </div>
            </div>
        </div>
    );
}
