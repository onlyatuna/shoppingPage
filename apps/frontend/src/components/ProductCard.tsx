import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useState } from 'react';
export default function ProductCard({ product }: { product: Product }) {
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Get unique variant images
    const variantImages = product.variants
        ?.filter(v => v.image)
        .map(v => v.image as string)
        .filter((value, index, self) => self.indexOf(value) === index) || [];

    const displayImage = previewImage || product.images[0];

    return (
        <div className="group bg-white rounded-xl border-2 border-[#1D2D45] shadow-[3px_3px_0px_#1D2D45] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1D2D45] transition-all duration-200 overflow-hidden flex flex-col h-full">
            <Link to={`/products/${product.slug}`} className="block relative">
                {/* Main Image Area */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    {displayImage ? (
                        <img
                            src={displayImage}
                            alt={product.name}
                            className={`w-full h-full object-contain md:object-cover`}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                    )}

                    {/* Sold Out Overlay */}
                    {product.stock <= 0 ? (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none">
                            <span className="bg-gray-800 text-white px-4 py-1 text-sm font-bold rounded">已售完</span>
                        </div>
                    ) : product.isOnSale && (
                        <div className="absolute top-2 right-2 pointer-events-none z-10">
                            <span className="bg-[#E85D3F] text-white px-3 py-1 text-xs font-bold rounded-full shadow-md">SALE</span>
                        </div>
                    )}
                </div>
            </Link>

            <div className="p-4 flex flex-col flex-1 gap-2">
                {/* Variant Thumbnails */}
                {/* Variant Thumbnails - Always render container for consistent height */}
                <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 h-[3.5rem]">
                    {variantImages.length > 0 ? (
                        variantImages.map((img, idx) => (
                            <button
                                key={idx}
                                onMouseEnter={() => setPreviewImage(img)}
                                onMouseLeave={() => setPreviewImage(null)}
                                className={`w-10 h-10 border rounded overflow-hidden shrink-0 ${previewImage === img ? 'ring-1 ring-black' : ''}`}
                            >
                                <img src={img} alt={`Variant ${idx}`} className="w-full h-full object-cover" />
                            </button>
                        ))
                    ) : (
                        /* Spacer for products without variants to maintain alignment */
                        <div className="w-10 h-10"></div>
                    )}
                </div>

                <Link to={`/products/${product.slug}`} className="block">
                    <h3 className="font-bold text-lg truncate" title={product.name}>{product.name}</h3>

                    <div className="flex justify-between items-center mt-2">
                        {(() => {
                            // 1. Calculate effective prices for all variants (or main product if no variants)
                            let minPrice, maxPrice, hasSale = false;
                            let originalPriceDisplay = null;

                            if (product.variants && product.variants.length > 0) {
                                const prices = product.variants.map(v => {
                                    const isSale = v.isOnSale && v.salePrice;
                                    return {
                                        original: Number(v.price),
                                        final: isSale ? Number(v.salePrice) : Number(v.price),
                                        isSale: !!isSale
                                    };
                                });
                                minPrice = Math.min(...prices.map(p => p.final));
                                maxPrice = Math.max(...prices.map(p => p.final));
                                hasSale = prices.some(p => p.isSale);

                                if (hasSale) {
                                    const minOriginal = Math.min(...prices.map(p => p.original));
                                    if (minOriginal > minPrice) {
                                        originalPriceDisplay = minOriginal;
                                    }
                                }
                            } else {
                                // No variants
                                const isSale = product.isOnSale && product.salePrice;
                                minPrice = isSale ? Number(product.salePrice) : Number(product.price);
                                maxPrice = minPrice;
                                hasSale = !!isSale;
                                if (isSale) {
                                    originalPriceDisplay = Number(product.price);
                                }
                            }

                            return (
                                <div className="flex flex-col items-end">
                                    {hasSale && originalPriceDisplay && (
                                        <span className="text-xs text-gray-400 line-through decoration-gray-400/50">
                                            ${originalPriceDisplay.toLocaleString()}
                                        </span>
                                    )}
                                    <span className={`text-xl font-bold ${hasSale ? 'text-[#E85A32]' : 'text-black'}`}>
                                        {minPrice === maxPrice
                                            ? `$${minPrice.toLocaleString()}`
                                            : `$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`
                                        }
                                    </span>
                                </div>
                            );
                        })()}

                    </div>
                </Link>
            </div>


        </div>
    );
}
