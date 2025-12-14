// AdminProductFormPage.tsx
import { useForm } from 'react-hook-form';
import { Upload, Trash2, Loader2, Edit, Plus, ArrowLeft, GripVertical } from 'lucide-react';
import { Product, Category, ProductOption, ProductVariant } from '../../types';
import ImageEditModal from '../../components/ImageEditModal';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import apiClient from '../../api/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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

const slugify = (text: string) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
};

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

    // Editing option value state
    const [editingOption, setEditingOption] = useState<{ optionIdx: number; valueIdx: number } | null>(null);

    // Drag state for visual feedback
    const [dragState, setDragState] = useState<{ optionIdx: number; valueIdx: number; targetIdx: number; lastSwap?: number } | null>(null);



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
        const oldName = options[index].name;

        // Update options
        const newOptions = [...options];
        newOptions[index].name = name;
        setOptions(newOptions);

        // Update existing variants to preserve data
        if (variants.length > 0) {
            const newVariants = variants.map(v => {
                const newCombination = { ...v.combination };
                if (oldName in newCombination) {
                    newCombination[name] = newCombination[oldName];
                    delete newCombination[oldName];
                }
                return { ...v, combination: newCombination };
            });
            setVariants(newVariants);
        }
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

    const updateOptionValue = (optionIndex: number, valueIndex: number, newValue: string) => {
        const option = options[optionIndex];
        const oldValue = option.values[valueIndex];
        const optionName = option.name;

        // Update options
        const newOptions = [...options];
        newOptions[optionIndex].values[valueIndex] = newValue;
        setOptions(newOptions);

        // Update existing variants to preserve data
        if (variants.length > 0) {
            const newVariants = variants.map(v => {
                const newCombination = { ...v.combination };
                if (newCombination[optionName] === oldValue) {
                    newCombination[optionName] = newValue;
                }
                return { ...v, combination: newCombination };
            });
            setVariants(newVariants);
        }
    };

    const reorderOptionValue = (optionIndex: number, fromIndex: number, toIndex: number) => {
        const newOptions = [...options];
        // Create a copy of the values array to avoid direct mutation
        newOptions[optionIndex] = { ...newOptions[optionIndex], values: [...newOptions[optionIndex].values] };

        const temp = newOptions[optionIndex].values[fromIndex];
        newOptions[optionIndex].values[fromIndex] = newOptions[optionIndex].values[toIndex];
        newOptions[optionIndex].values[toIndex] = temp;

        setOptions(newOptions);
    };

    // Auto-generate variants when options change OR when variants are enabled
    useEffect(() => {
        console.log('Variant generation effect triggered. enableVariants:', enableVariants, 'options:', options);

        if (!enableVariants) {
            setVariants([]);
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
                price: existing?.price ?? (watch('price') ? Number(watch('price')) : NaN),
                stock: existing?.stock ?? NaN,
                image: existing?.image, // Preserve existing image
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



    const removeImage = (urlToRemove: string) => {
        const updated = currentImages.filter(url => url !== urlToRemove).join(',');
        setValue('images', updated);
    };

    const handleFormSubmit = (data: ProductFormData) => {
        // Validation for Option Images All-or-None logic
        if (enableVariants) {
            if (variants.length === 0) {
                toast.error('請至少添加一個規格組合');
                return;
            }

            // Check manual validation for price > 0 in variants
            if (variants.some(v => !v.price || v.price <= 0)) {
                toast.error('所有規格的價格必須大於 0');
                return;
            }

            // Variant Image Validation: All or None
            const variantsWithImage = variants.filter(v => !!v.image);
            if (variantsWithImage.length > 0 && variantsWithImage.length !== variants.length) {
                toast.error('規格圖片設定不完整。請為所有組合上傳圖片，或全部不上傳 (只有在完全沒圖片或全都有圖片時才能保存)。');
                return;
            }
        }

        const imageArray = data.images.trim() === '' ? [] : data.images.split(',').map(s => s.trim()).filter(Boolean);

        const payload = {
            ...data,
            images: imageArray,
            price: Number(data.price),
            stock: Number(data.stock),

            options: enableVariants ? options.filter(o => o.name && o.values.length > 0) : [],
            variants: enableVariants ? variants : []
        };

        // Auto-generate slug if it is default "new-..." or empty, or if we are creating a new product
        if (!payload.slug || payload.slug.startsWith('new-')) {
            const rawSlug = slugify(payload.name);
            // If slug becomes empty (e.g. Chinese name only), use timestamp to ensure validity
            payload.slug = rawSlug || `product-${Date.now()}`;
        }

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
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            規格
                        </h3>
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

                    {/* When variants disabled, show simple price/stock inputs */}
                    {!enableVariants && (
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">價格</label>
                                    <input type="number" {...register('price', { required: !enableVariants, min: 1 })} className="w-full border p-2 rounded" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">庫存</label>
                                    <input type="number" {...register('stock', { required: !enableVariants })} className="w-full border p-2 rounded" />
                                </div>
                            </div>
                        </div>
                    )}

                    {enableVariants && (
                        <div className="space-y-4">
                            {/* Specification Cards */}
                            {options.map((option, idx) => (
                                <div key={option.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="text-sm text-gray-600">商品選項{idx + 1}</span>
                                            <div className="relative flex-1 max-w-xs">
                                                <input
                                                    value={option.name}
                                                    onChange={(e) => updateOptionName(idx, e.target.value)}
                                                    placeholder="規格名稱"
                                                    maxLength={14}
                                                    className="w-full border border-gray-300 bg-white px-3 py-1.5 pr-12 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                                                    {option.name.length}/14
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeOption(idx)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    {/* Card Body - Options Grid */}
                                    <div className="p-4">
                                        <div className="mb-3">
                                            <span className="text-sm text-gray-600">選項</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {option.values.map((val, vIdx) => {
                                                const isDragging = dragState?.optionIdx === idx && dragState?.valueIdx === vIdx;
                                                const isDropTarget = dragState?.optionIdx === idx && dragState?.targetIdx === vIdx && dragState?.valueIdx !== vIdx;

                                                return (
                                                    <motion.div
                                                        key={val}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{
                                                            opacity: isDragging ? 0.5 : 1,
                                                            scale: isDragging ? 0.95 : (isDropTarget ? 1.05 : 1),
                                                            zIndex: isDragging ? 50 : 0
                                                        }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        transition={{
                                                            layout: { type: "spring", stiffness: 300, damping: 30 },
                                                            opacity: { duration: 0.3 },
                                                            scale: { duration: 0.3 }
                                                        }}
                                                        className={`relative group ${isDropTarget ? 'ring-2 ring-blue-400 rounded-lg' : ''}`}
                                                        onDragEnter={(e: React.DragEvent) => {
                                                            e.preventDefault();
                                                            const now = Date.now();
                                                            // Throttle reordering to prevent flickering (wait 300ms between swaps)
                                                            if (dragState && dragState.optionIdx === idx && dragState.lastSwap && now - dragState.lastSwap < 300) {
                                                                return;
                                                            }

                                                            if (dragState && dragState.optionIdx === idx && dragState.valueIdx !== vIdx) {
                                                                // Immediately reorder during drag for real-time feedback
                                                                reorderOptionValue(idx, dragState.valueIdx, vIdx);
                                                                // Update drag state to track new source position and timestamp
                                                                setDragState({ optionIdx: idx, valueIdx: vIdx, targetIdx: vIdx, lastSwap: now });
                                                            }
                                                        }}
                                                        onDragOver={(e: React.DragEvent) => {
                                                            e.preventDefault();
                                                            e.dataTransfer.dropEffect = 'move';
                                                        }}
                                                        onDrop={(e: React.DragEvent) => {
                                                            e.preventDefault();
                                                            setDragState(null);
                                                        }}
                                                        onDragEnd={() => {
                                                            setDragState(null);
                                                        }}
                                                    >
                                                        <div className={`border border-gray-200 rounded-lg px-3 py-2 bg-white hover:border-gray-300 transition-all duration-400 flex items-center justify-between gap-2 ${isDragging ? 'bg-gray-100 border-gray-300 shadow-lg' : ''}`}>
                                                            <button
                                                                type="button"
                                                                className="text-gray-400 hover:text-gray-600 cursor-move p-2 -ml-2 rounded hover:bg-gray-50"
                                                                draggable
                                                                onDragStart={(e: React.DragEvent) => {
                                                                    e.stopPropagation();
                                                                    // Add a small delay/flag to prevent immediate re-trigger
                                                                    const dragEvent = e as any;
                                                                    dragEvent.dataTransfer.effectAllowed = 'move';
                                                                    // Use a custom drag image or standard one
                                                                    // dragEvent.dataTransfer.setDragImage(e.currentTarget, 0, 0);
                                                                    dragEvent.dataTransfer.setData('text/plain', JSON.stringify({ optionIdx: idx, valueIdx: vIdx }));
                                                                    setDragState({ optionIdx: idx, valueIdx: vIdx, targetIdx: vIdx });
                                                                }}
                                                                onDragEnd={(e: React.DragEvent) => {
                                                                    e.stopPropagation();
                                                                    setDragState(null);
                                                                }}
                                                            >
                                                                <GripVertical size={16} />
                                                            </button>

                                                            {editingOption?.optionIdx === idx && editingOption?.valueIdx === vIdx ? (
                                                                <input
                                                                    autoFocus
                                                                    type="text"
                                                                    defaultValue={val}
                                                                    maxLength={20}
                                                                    onBlur={(e) => {
                                                                        const newValue = e.target.value.trim();
                                                                        if (newValue) {
                                                                            updateOptionValue(idx, vIdx, newValue);
                                                                        }
                                                                        setEditingOption(null);
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            if (e.currentTarget.value.trim()) {
                                                                                updateOptionValue(idx, vIdx, e.currentTarget.value.trim());
                                                                            }
                                                                            setEditingOption(null);
                                                                        }
                                                                        if (e.key === 'Escape') {
                                                                            setEditingOption(null);
                                                                        }
                                                                    }}
                                                                    className="flex-1 text-sm focus:outline-none"
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="text-sm cursor-text flex-1"
                                                                    onClick={() => setEditingOption({ optionIdx: idx, valueIdx: vIdx })}
                                                                >
                                                                    {val}
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-gray-400 whitespace-nowrap">{val.length}/20</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeOptionValue(idx, vIdx)}
                                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}

                                            {/* Drag Placeholder - shows where item will be placed */}
                                            {dragState && dragState.optionIdx === idx && (
                                                <div
                                                    className="border-2 border-dashed border-blue-400 rounded-lg px-3 py-2 bg-blue-50 opacity-50"
                                                    style={{
                                                        gridColumn: 'span 1',
                                                        height: '40px',
                                                        display: 'none' // Hidden for now since we're doing real-time reorder
                                                    }}
                                                />
                                            )}
                                            {/* Add New Option Input */}
                                            {option.values.length < 20 && (
                                                <div className="relative">
                                                    <input
                                                        placeholder="輸入"
                                                        maxLength={20}
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
                                                        className="w-full border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-gray-50"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add Specification Button */}
                            {options.length < 2 && (
                                <button
                                    type="button"
                                    onClick={addOption}
                                    className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} />
                                    新增規格項目
                                </button>
                            )}

                            {/* Variant Preview Table */}
                            {/* Always show table if variants are enabled and we have at least one option with values */}
                            {options.some(opt => opt.values.length > 0) && (
                                <div className="mt-6 border-t pt-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-4">規格組合預覽</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 w-16">圖片</th>
                                                    {options.map(o => <th key={o.id} className="px-4 py-3 text-left text-xs font-medium text-gray-600">{o.name}</th>)}
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 w-32">價格 <span className="text-red-500">*</span></th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 w-32">庫存 <span className="text-red-500">*</span></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {variants.map((v, idx) => (
                                                    <tr key={v.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <div className="relative w-10 h-10 rounded border bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 group/img">
                                                                {v.image ? (
                                                                    <>
                                                                        <img src={v.image} alt="Variant" className="w-full h-full object-cover" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newVariants = [...variants];
                                                                                delete newVariants[idx].image;
                                                                                setVariants(newVariants);
                                                                            }}
                                                                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <label className="cursor-pointer w-full h-full flex items-center justify-center hover:bg-gray-100">
                                                                        <Upload size={14} className="text-gray-400" />
                                                                        <input
                                                                            type="file"
                                                                            className="hidden"
                                                                            accept="image/*"
                                                                            onChange={async (e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (!file) return;
                                                                                try {
                                                                                    const formData = new FormData();
                                                                                    formData.append('image', file);
                                                                                    formData.append('subfolder', watch('name').trim()); // Use product name for subfolder
                                                                                    const res = await apiClient.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                                                                    const newVariants = [...variants];
                                                                                    newVariants[idx].image = res.data.data.url;
                                                                                    setVariants(newVariants);
                                                                                    e.target.value = '';
                                                                                } catch {
                                                                                    toast.error('上傳失敗');
                                                                                }
                                                                            }}
                                                                        />
                                                                    </label>
                                                                )}
                                                            </div>
                                                        </td>
                                                        {options.map(o => (
                                                            <td key={o.id} className="px-4 py-3 text-sm text-gray-700">
                                                                <span>{v.combination[o.name]}</span>
                                                            </td>
                                                        ))}
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                value={isNaN(v.price) ? '' : v.price}
                                                                required
                                                                min="1"
                                                                onChange={(e) => updateVariantField(idx, 'price', e.target.value === '' ? NaN : Number(e.target.value))}
                                                                className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                value={isNaN(v.stock) ? '' : v.stock}
                                                                required
                                                                min="0"
                                                                onChange={(e) => updateVariantField(idx, 'stock', e.target.value === '' ? NaN : Number(e.target.value))}
                                                                className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
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
