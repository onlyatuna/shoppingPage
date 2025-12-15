import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Tag, DollarSign, ChevronDown, ChevronRight, Save, CheckCircle } from 'lucide-react';
import apiClient from '../../api/client';
import { Product, ProductVariant } from '../../types';
import { toast } from 'sonner';

// Helper component for variant row
// Now a controlled component managed by parent PromotionRow
function VariantPromotionRow({
    variant,
    onUpdate
}: {
    variant: ProductVariant;
    onUpdate: (updatedVariant: ProductVariant) => void;
}) {
    // We derive local display state from props to ensure responsiveness
    // But simplified: Direct inputs controlled by props

    return (
        <tr className="bg-gray-50/80 border-b">
            <td className="p-4 pl-12 flex items-center justify-end">
                <div className="w-6 h-6 border-l-2 border-b-2 border-gray-300 rounded-bl-lg mr-2 -mt-6"></div>
                {variant.image && <img src={variant.image} className="w-10 h-10 rounded object-cover border" alt="" />}
            </td>
            <td className="p-4 text-sm text-gray-700 font-medium">
                {Object.entries(variant.combination).map(([k, v]) => `${k}: ${v}`).join(' / ')}
            </td>
            <td className="p-4 text-sm text-gray-500">${Number(variant.price).toLocaleString()}</td>
            <td className="p-4">
                <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="number"
                        value={variant.salePrice !== undefined && variant.salePrice !== null ? variant.salePrice : ''}
                        onChange={(e) => {
                            const val = e.target.value === '' ? undefined : Number(e.target.value);
                            if (val !== undefined && val >= variant.price) {
                                toast.error('特價必須小於原價');
                                return;
                            }
                            onUpdate({ ...variant, salePrice: val });
                        }}
                        className={`w-28 pl-7 pr-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-black transition-all ${variant.isOnSale ? 'border-brand-orange ring-1 ring-brand-orange' : ''}`}
                        placeholder="特價"
                        min="0"
                    />
                </div>
            </td>
            <td className="p-4">
                <button
                    type="button"
                    onClick={() => {
                        onUpdate({ ...variant, isOnSale: !variant.isOnSale });
                    }}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${variant.isOnSale ? 'bg-brand-orange' : 'bg-gray-300'}`}
                >
                    <span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform duration-200 ease-in-out ${variant.isOnSale ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </td>
        </tr>
    );
}

// Row component for main product
function PromotionRow({
    product,
    onProductChange
}: {
    product: Product;
    onProductChange: (p: Product) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [batchPrice, setBatchPrice] = useState('');

    const hasVariants = product.variants && product.variants.length > 0;

    // Derived values for controlled inputs
    const salePrice = product.salePrice !== undefined && product.salePrice !== null ? product.salePrice : '';
    const isOnSale = product.isOnSale || false;

    const handleBatchApply = () => {
        const price = Number(batchPrice);
        if (!batchPrice || isNaN(price)) return;

        const invalidVariant = product.variants?.find(v => price >= v.price);
        if (invalidVariant) {
            toast.error(`無法應用：特價 $${price} 不小於規格原價 $${invalidVariant.price}`);
            return;
        }

        // Update all variants
        const updatedVariants = product.variants?.map(v => ({
            ...v,
            salePrice: price,
            isOnSale: true
        })) || [];

        // Push update to parent
        onProductChange({
            ...product,
            variants: updatedVariants
        });

        setBatchPrice('');
        setExpanded(true); // Auto expand to show results
    };

    return (
        <>
            <tr className={`border-b transition-colors ${expanded ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                <td className="p-4 relative">
                    <div className="flex items-center gap-3">
                        {hasVariants && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                            >
                                {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                        )}
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden shrink-0">
                            {product.images?.[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover" />}
                        </div>
                    </div>
                </td>
                <td className="p-4 font-medium max-w-xs truncate" title={product.name}>
                    {product.name}
                    {hasVariants && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{product.variants?.length} 規格</span>}
                </td>
                <td className="p-4 text-gray-500">
                    {!hasVariants && `$${Number(product.price).toLocaleString()}`}
                </td>
                <td className="p-4">
                    {!hasVariants ? (
                        <div className="relative">
                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                value={salePrice}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? undefined : Number(e.target.value);
                                    if (val !== undefined && val >= Number(product.price)) {
                                        toast.error('特價必須小於原價');
                                        return;
                                    }
                                    onProductChange({ ...product, salePrice: val?.toString() });
                                }}
                                className={`w-32 pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-black transition-all ${isOnSale ? 'border-brand-orange ring-1 ring-brand-orange' : ''}`}
                                placeholder="特價金額"
                                min="0"
                            />
                        </div>
                    ) : (
                        <div className="relative">
                            <DollarSign size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                value={batchPrice}
                                onChange={(e) => setBatchPrice(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleBatchApply();
                                        e.currentTarget.blur();
                                    }
                                }}
                                onBlur={() => {
                                    if (batchPrice) handleBatchApply();
                                }}
                                className="w-32 pl-6 pr-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-black outline-none placeholder:text-gray-400"
                                placeholder="批量 (Enter)"
                            />
                        </div>
                    )}
                </td>
                <td className="p-4">
                    {!hasVariants && (
                        <button
                            type="button"
                            onClick={() => {
                                onProductChange({ ...product, isOnSale: !isOnSale });
                            }}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${isOnSale ? 'bg-brand-orange' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${isOnSale ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    )}
                </td>
            </tr>
            {/* Variants Rows */}
            {expanded && hasVariants && product.variants?.map(variant => (
                <VariantPromotionRow
                    key={variant.id}
                    variant={variant}
                    onUpdate={(updatedVariant) => {
                        const newVariants = product.variants!.map(v => v.id === updatedVariant.id ? updatedVariant : v);
                        onProductChange({ ...product, variants: newVariants });
                    }}
                />
            ))}
        </>
    );
}

export default function AdminPromotionsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingChanges, setPendingChanges] = useState<Record<string, Product>>({});

    // Fetch products
    const { data: products, isLoading } = useQuery({
        queryKey: ['admin-products', searchTerm],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Product[] }>(`/products/admin/all?search=${searchTerm}`);
            return res.data.data;
        },
    });

    // Handle single product update from UI
    const handleProductChange = (updatedProduct: Product) => {
        setPendingChanges(prev => ({
            ...prev,
            [updatedProduct.id]: updatedProduct
        }));
    };

    const hasChanges = Object.keys(pendingChanges).length > 0;

    const saveMutation = useMutation({
        mutationFn: async () => {
            const promises = Object.values(pendingChanges).map(product => {
                return apiClient.patch(`/products/${product.id}`, {
                    salePrice: product.salePrice ? Number(product.salePrice) : undefined,
                    isOnSale: product.isOnSale,
                    variants: product.variants
                });
            });
            await Promise.all(promises);
        },
        onSuccess: () => {
            toast.success('所有設定已儲存');
            setPendingChanges({}); // Clear pending
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            navigate('/admin/products');
        },
        onError: () => toast.error('儲存失敗，請重試')
    });

    if (isLoading) return <div className="p-10 text-center">載入中...</div>;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Tag className="text-brand-orange" /> 促銷活動管理
                        </h1>
                        <p className="text-gray-500 text-sm">設定商品特價與促銷狀態</p>
                    </div>
                </div>

                <button
                    onClick={() => saveMutation.mutate()}
                    disabled={!hasChanges || saveMutation.isPending}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium shadow-md transition-all ${hasChanges
                        ? 'bg-black text-white hover:bg-gray-800 hover:shadow-lg transform hover:-translate-y-0.5'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {saveMutation.isPending ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            儲存中...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            保存並退出
                        </>
                    )}
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 relative max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="搜尋商品..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-black"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 w-20">圖片</th>
                            <th className="p-4">商品名稱 / 規格</th>
                            <th className="p-4 w-32">原價</th>
                            <th className="p-4 w-40">特價設定</th>
                            <th className="p-4 w-24">啟用特價</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products?.map(originalProduct => {
                            // Render the pending version if it exists, otherwise the original
                            const productToRender = pendingChanges[originalProduct.id] || originalProduct;
                            return (
                                <PromotionRow
                                    key={originalProduct.id}
                                    product={productToRender}
                                    onProductChange={handleProductChange}
                                />
                            );
                        })}
                    </tbody>
                </table>
                {products?.length === 0 && <div className="p-8 text-center text-gray-500">查無商品</div>}
            </div>

            {/* Sticky Footer for clear visibility of unsaved changes if needed, but Top Button is sufficient as requested */}
            {hasChanges && (
                <div className="fixed bottom-6 right-6 bg-black text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 animate-bounce cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <CheckCircle size={16} className="text-brand-orange" />
                    {Object.keys(pendingChanges).length} 個商品已修改 (未儲存)
                </div>
            )}
        </div>
    );
}
