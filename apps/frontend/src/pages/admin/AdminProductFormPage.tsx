// AdminProductFormPage.tsx
import { useForm } from 'react-hook-form';
import { Upload, Trash2, Loader2, Edit, Plus, ArrowLeft } from 'lucide-react';
import { Product, Category, ProductOption, ProductVariant } from '../../types';
import ImageEditModal from '../../components/ImageEditModal';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import apiClient from '../../api/client';
import { toast } from 'sonner';

interface ProductFormData {
    name: string;
    price: number;
    stock: number;
    description: string;
    categoryId: number;
    images: string;
    isActive: boolean;
    slug: string;
}

export default function AdminProductFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const isEditMode = !!id;
    const editorState = location.state as { initialImage?: string; initialDescription?: string } | null;

    const { register, handleSubmit, reset, setValue, watch } = useForm<ProductFormData>();

    const currentImagesStr = watch('images') || '';
    const currentImages = currentImagesStr ? currentImagesStr.split(',').filter(Boolean) : [];

    const [isUploading, setIsUploading] = useState(false);
    const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);

    // Variants State
    const [enableVariants, setEnableVariants] = useState(false);
    const [options, setOptions] = useState<ProductOption[]>([]);
    const [variants, setVariants] = useState<ProductVariant[]>([]);

    // Detail Images State
    const [detailImages, setDetailImages] = useState<string[]>([]);
    const [isUploadingDetail, setIsUploadingDetail] = useState(false);

    // Fetch categories
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Category[] }>('/categories');
            return res.data.data;
        },
    });

    // Fetch product for edit mode
    const { data: product, isLoading: isLoadingProduct } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Product }>(`/products/${id}`);
            return res.data.data;
        },
        enabled: isEditMode,
    });

    // Initialize form when product data is loaded OR when coming from Editor
    useEffect(() => {
        const initialData = product;

        reset({
            name: initialData?.name || '',
            price: initialData?.price ? Number(initialData.price) : 0,
            stock: initialData?.stock || 10,
            description: editorState?.initialDescription || initialData?.description || '',
            images: editorState?.initialImage || initialData?.images?.join(',') || '',
            categoryId: initialData?.categoryId || (categories && categories.length > 0 ? categories[0].id : 0),
            isActive: initialData?.isActive ?? true,
            slug: initialData?.slug || (initialData?.id ? `product-${initialData.id}` : `new-${Date.now()}`),
        });

        // Init Variants & Options
        if (initialData?.options && initialData.options.length > 0) {
            setEnableVariants(true);
            setOptions(initialData.options);
            setVariants(initialData.variants || []);
        } else {
            setEnableVariants(false);
            setOptions([{ id: 'opt_1', name: '規格', values: [] }]);
            setVariants([]);
        }

        // Init Detail Images
        setDetailImages(initialData?.detailImages || []);
    }, [product, categories, editorState, reset]);

    // Create/Update mutations
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return apiClient.post('/products', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('商品新增成功');
            navigate('/admin/products');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || '新增失敗');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            return apiClient.put(`/products/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('商品更新成功');
            navigate('/admin/products');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || '更新失敗');
        }
    });

    // --- Variant Logic ---
    const addOption = () => {
        const newId = `opt_${Date.now()}`;
        setOptions([...options, { id: newId, name: '', values: [] }]);
    };

    const removeOption = (index: number) => {
        const newOptions = [...options];
        newOptions.splice(index, 1);
        setOptions(newOptions);
    };

    const updateOptionName = (index: number, name: string) => {
        const newOptions = [...options];
        newOptions[index].name = name;
        setOptions(newOptions);
    };

    const addOptionValue = (optionIndex: number, value: string) => {
        if (!value.trim()) return;
        const newOptions = [...options];
        if (!newOptions[optionIndex].values.includes(value)) {
            newOptions[optionIndex].values.push(value);
            setOptions(newOptions);
        }
    };

    const removeOptionValue = (optionIndex: number, valueIndex: number) => {
        const newOptions = [...options];
        newOptions[optionIndex].values.splice(valueIndex, 1);
        setOptions(newOptions);
    };

    // Auto-generate variants when options change OR when variants are enabled
    useEffect(() => {
        console.log('Variant generation effect triggered. enableVariants:', enableVariants, 'options:', options);

        if (!enableVariants) {
            setVariants([]);
            return;
        }

        // SKIP generation if options are identical to initialData (prevent overwrite on load)
        if (product?.options && JSON.stringify(options) === JSON.stringify(product.options)) {
            console.log('Skipping generation - options match initialData');
            return;
        }

        // Cartesian Product
        // Only generate if all options have at least one value
        const validOptions = options.filter(o => o.values.length > 0);
        if (validOptions.length === 0) {
            console.log('No valid options with values, clearing variants');
            setVariants([]);
            return;
        }

        const cartesian = (args: string[][]) => args.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), [[]] as string[][]);

        const valueArrays = validOptions.map(o => o.values);
        const combinations = cartesian(valueArrays);

        const newVariants: ProductVariant[] = combinations.map((combo, idx) => {
            // Build combination map { "Color": "Red", "Size": "S" }
            const combinationMap: Record<string, string> = {};
            validOptions.forEach((opt, i) => {
                combinationMap[opt.name] = combo[i];
            });

            // Check if existing variant matches to preserve price/stock
            const existing = variants.find(v =>
                Object.entries(combinationMap).every(([key, val]) => v.combination[key] === val)
            );

            return {
                id: existing?.id || `var_${Date.now()}_${idx}`,
                price: existing?.price || Number(watch('price')) || 0,
                stock: existing?.stock || 0,
                combination: combinationMap
            };
        });

        if (JSON.stringify(newVariants.map(v => v.combination)) !== JSON.stringify(variants.map(v => v.combination))) {
            console.log('Generated variants:', newVariants);
            setVariants(newVariants);
        } else {
            console.log('Variants unchanged, skipping update');
        }

    }, [options, enableVariants]);


    const updateVariantField = (index: number, field: 'price' | 'stock', value: number) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    // --- File Handlers ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('type', 'product');
            const res = await apiClient.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const newUrl = res.data.data.url;
            const updatedImages = currentImages.length > 0 ? `${currentImagesStr},${newUrl}` : newUrl;
            setValue('images', updatedImages);
        } catch { toast.error('Upload failed'); }
        finally { setIsUploading(false); e.target.value = ''; }
    };

    const handleDetailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingDetail(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('type', 'detail');
            const res = await apiClient.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setDetailImages([...detailImages, res.data.data.url]);
        } catch { toast.error('Upload failed'); }
        finally { setIsUploadingDetail(false); e.target.value = ''; }
    };

    const removeDetailImage = (index: number) => {
        const newDetails = [...detailImages];
        newDetails.splice(index, 1);
        setDetailImages(newDetails);
    };

    const removeImage = (urlToRemove: string) => {
        const updated = currentImages.filter(url => url !== urlToRemove).join(',');
        setValue('images', updated);
    };

    const handleFormSubmit = (data: ProductFormData) => {
        const imageArray = data.images.trim() === '' ? [] : data.images.split(',').map(s => s.trim()).filter(Boolean);

        const payload = {
            ...data,
            images: imageArray,
            price: Number(data.price),
            stock: Number(data.stock),

            // New Fields
            options: enableVariants ? options.filter(o => o.name && o.values.length > 0) : [],
            variants: enableVariants ? variants : [],
            detailImages: detailImages
        };

        console.log('Submitting Product Payload:', payload);

        if (isEditMode && id) {
            updateMutation.mutate({ id: Number(id), data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleImageEdited = (editedUrl: string) => {
        if (!editingImageUrl) return;
        const updated = currentImages.map(url => url === editingImageUrl ? editedUrl : url).join(',');
        setValue('images', updated);
        setEditingImageUrl(null);
    };

    if (isEditMode && isLoadingProduct) {
        return (
            <div className="p-10 text-center">
                <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">載入中...</p>
            </div>
        );
    }

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => navigate('/admin/products')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold">{isEditMode ? '編輯商品' : '新增商品'}</h1>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 bg-white p-6 rounded-lg border">
                {/* Basic Info */}
                <input type="hidden" {...register('slug')} />
                <input type="hidden" {...register('isActive')} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold mb-1">商品名稱</label>
                        <input {...register('name', { required: true })} className="w-full border p-2 rounded" />
                    </div>

                    {/* Only show global price/stock if variants disabled */}
                    {!enableVariants && (
                        <>
                            <div>
                                <label className="block text-sm font-bold mb-1">價格</label>
                                <input type="number" {...register('price', { required: !enableVariants })} className="w-full border p-2 rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">庫存</label>
                                <input type="number" {...register('stock', { required: !enableVariants })} className="w-full border p-2 rounded" />
                            </div>
                        </>
                    )}

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold mb-1">商品分類</label>
                        <select {...register('categoryId', { valueAsNumber: true })} className="w-full border p-2 rounded bg-white">
                            {categories?.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Variant System */}
                <div className="border p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-700">商品規格</h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={enableVariants}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    console.log('Toggle changed to:', checked, 'Current options:', options);
                                    setEnableVariants(checked);
                                    if (checked && options.length === 0) {
                                        console.log('Initializing first option');
                                        setOptions([{ id: 'opt_1', name: '規格', values: [] }]);
                                    }
                                }}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-700">啟用多規格</span>
                        </label>
                    </div>

                    {enableVariants && (
                        <div className="space-y-4">
                            {/* Option Builder */}
                            {options.map((option, idx) => (
                                <div key={option.id} className="bg-white p-3 rounded border">
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            value={option.name}
                                            onChange={(e) => updateOptionName(idx, e.target.value)}
                                            placeholder="規格名稱 (例: 顏色)"
                                            className="border p-1 rounded text-sm w-32"
                                        />
                                        <button type="button" onClick={() => removeOption(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {option.values.map((val, vIdx) => (
                                            <span key={vIdx} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1">
                                                {val}
                                                <button type="button" onClick={() => removeOptionValue(idx, vIdx)} className="text-gray-400 hover:text-red-500">×</button>
                                            </span>
                                        ))}
                                        <input
                                            placeholder="新增選項 (Enter)"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addOptionValue(idx, e.currentTarget.value);
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                            onBlur={(e) => {
                                                if (e.currentTarget.value.trim()) {
                                                    addOptionValue(idx, e.currentTarget.value);
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                            className="border p-1 rounded text-sm w-32"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addOption}
                                disabled={options.length >= 2}
                                className={`text-sm flex items-center gap-1 ${options.length >= 2
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-blue-600 hover:text-blue-700'
                                    }`}
                            >
                                <Plus size={16} /> 新增規格項目 {options.length >= 2 && '(最多2個)'}
                            </button>

                            {/* Variant Table */}
                            {variants.length > 0 && (
                                <div className="overflow-x-auto mt-4">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                {options.map(o => <th key={o.id} className="p-2 text-left">{o.name}</th>)}
                                                <th className="p-2 w-24">價格</th>
                                                <th className="p-2 w-24">庫存</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variants.map((v, idx) => (
                                                <tr key={v.id} className="border-b">
                                                    {options.map(o => (
                                                        <td key={o.id} className="p-2">{v.combination[o.name]}</td>
                                                    ))}
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            value={v.price}
                                                            onChange={(e) => updateVariantField(idx, 'price', Number(e.target.value))}
                                                            className="w-full border p-1 rounded"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            value={v.stock}
                                                            onChange={(e) => updateVariantField(idx, 'stock', Number(e.target.value))}
                                                            className="w-full border p-1 rounded"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Main Images */}
                <div>
                    <label className="block text-sm font-bold mb-2">商品主圖</label>
                    <input type="hidden" {...register('images')} />
                    <div className="grid grid-cols-4 gap-2 mb-2">
                        {currentImages.map((url, index) => (
                            <div key={index} className="relative group aspect-square bg-gray-100 rounded overflow-hidden border">
                                <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setEditingImageUrl(url)}
                                    className="absolute top-1 left-1 bg-blue-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                    title="編輯圖片"
                                >
                                    <Edit size={12} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeImage(url)}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                    title="刪除圖片"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        <label className={`border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 aspect-square ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {isUploading ? <Loader2 className="animate-spin text-gray-400" /> : <><Upload className="text-gray-400 mb-1" size={24} /><span className="text-xs text-gray-500">上傳</span></>}
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                    </div>
                </div>

                {/* Detailed Images */}
                <div>
                    <label className="block text-sm font-bold mb-2">詳情長圖</label>
                    <div className="space-y-2">
                        {detailImages.map((url, index) => (
                            <div key={index} className="relative group w-full bg-gray-100 rounded overflow-hidden border">
                                <img src={url} alt="Detail" className="w-full h-auto object-contain max-h-[200px]" />
                                <button
                                    type="button"
                                    onClick={() => removeDetailImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded shadow opacity-0 group-hover:opacity-100 transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}

                        <label className={`w-full h-24 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 ${isUploadingDetail ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {isUploadingDetail ? <Loader2 className="animate-spin text-gray-400" /> : <><Upload className="text-gray-400 mb-1" size={24} /><span className="text-xs text-gray-500">新增詳情圖片</span></>}
                            <input type="file" className="hidden" accept="image/*" onChange={handleDetailUpload} disabled={isUploadingDetail} />
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1">描述</label>
                    <textarea {...register('description')} className="w-full border p-2 rounded" rows={3} />
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/products')}
                        className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
                    >
                        {isPending ? '儲存中...' : '確認儲存'}
                    </button>
                </div>
            </form>

            {/* Image Editor Modal */}
            {editingImageUrl && (
                <ImageEditModal
                    isOpen={!!editingImageUrl}
                    onClose={() => setEditingImageUrl(null)}
                    imageUrl={editingImageUrl}
                    onImageEdited={handleImageEdited}
                />
            )}
        </div>
    );
}
