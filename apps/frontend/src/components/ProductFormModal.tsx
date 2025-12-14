//ProductFormModal.tsx
import { useForm } from 'react-hook-form';
import { X, Upload, Trash2, Loader2, Edit } from 'lucide-react';
import { Product, Category } from '../types';
import ImageEditModal from './ImageEditModal';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

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

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: Partial<Product> | null;
    isPending: boolean;
}

export default function ProductFormModal({ isOpen, onClose, onSubmit, initialData, isPending }: Props) {
    const { register, handleSubmit, reset, setValue, watch } = useForm<ProductFormData>();

    // ... (watch images logic same)
    const currentImagesStr = watch('images') || '';
    const currentImages = currentImagesStr ? currentImagesStr.split(',').filter(Boolean) : [];

    const [isUploading, setIsUploading] = useState(false);
    const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);

    // ... (query categories same)
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Category[] }>('/categories');
            return res.data.data;
        },
        enabled: isOpen,
    });

    // 2. 控制表單初始值
    useEffect(() => {
        if (isOpen) {
            // Apply initialData values if they exist, otherwise defaults
            reset({
                name: initialData?.name || '',
                price: initialData?.price ? Number(initialData.price) : 0,
                stock: initialData?.stock || 10,
                description: initialData?.description || '',
                images: initialData?.images?.join(',') || '',
                categoryId: initialData?.categoryId || (categories && categories.length > 0 ? categories[0].id : 0),
                isActive: initialData?.isActive ?? true,
                // If editing (has ID), keep slug or default. If new, generate.
                // Note: initialData?.slug might be used if provided.
                slug: initialData?.slug || (initialData?.id ? `product-${initialData.id}` : `new-${Date.now()}`),
            });
        }
    }, [isOpen, initialData, categories, reset]);

    if (!isOpen) return null;

    const handleFormSubmit = (data: ProductFormData) => {
        const imageArray =
            data.images.trim() === ''
                ? []
                : data.images.split(',').map((s) => s.trim()).filter(Boolean);

        const payload = {
            ...data,
            images: imageArray,
            price: Number(data.price),
            stock: Number(data.stock),
        };

        onSubmit(payload);
    };
    // [新增] 處理檔案選擇與上傳
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', 'product'); // Explicitly upload to product folder

        try {
            // 呼叫剛剛寫好的後端 API
            const res = await apiClient.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const newUrl = res.data.data.url;

            // 將新網址加入現有的字串中 (逗號分隔)
            const updatedImages = currentImages.length > 0
                ? `${currentImagesStr},${newUrl}`
                : newUrl;

            setValue('images', updatedImages); // 更新表單值
        } catch (error) {
            alert('上傳失敗，請檢查後端 Log');
        } finally {
            setIsUploading(false);
            // 清空 Input 讓同一張圖可以再次選取
            e.target.value = '';
        }
    };

    // [新增] 移除單張圖片
    const removeImage = (urlToRemove: string) => {
        const updated = currentImages.filter(url => url !== urlToRemove).join(',');
        setValue('images', updated);
    };

    // [新增] 處理編輯後的圖片
    const handleImageEdited = (editedUrl: string) => {
        if (!editingImageUrl) return;

        // 替換舊的 URL 為新的 URL
        const updated = currentImages.map(url =>
            url === editingImageUrl ? editedUrl : url
        ).join(',');

        setValue('images', updated);
        setEditingImageUrl(null);
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black">
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-4">{initialData?.id ? '編輯商品' : '新增商品'}</h2>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    {/* 隱藏欄位 */}
                    <input type="hidden" {...register('slug')} />
                    <input type="hidden" {...register('isActive')} />

                    <div>
                        <label className="block text-sm font-bold mb-1">商品名稱</label>
                        <input {...register('name', { required: true })} className="w-full border p-2 rounded" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">價格</label>
                            <input type="number" {...register('price', { required: true })} className="w-full border p-2 rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">庫存</label>
                            <input type="number" {...register('stock', { required: true })} className="w-full border p-2 rounded" />
                        </div>
                    </div>

                    {/* 修改：分類選擇 */}
                    <div>
                        <label className="block text-sm font-bold mb-1">商品分類</label>
                        <select
                            {...register('categoryId', { valueAsNumber: true })}
                            className="w-full border p-2 rounded bg-white"
                        >
                            {categories?.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">商品圖片</label>

                        {/* 隱藏原本的文字輸入框 (或是留著給進階使用者手貼網址) */}
                        <input type="hidden" {...register('images')} />

                        {/* 圖片預覽區 */}
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

                            {/* 上傳按鈕 (偽裝成方塊) */}
                            <label className={`border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 aspect-square ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isUploading ? (
                                    <Loader2 className="animate-spin text-gray-400" />
                                ) : (
                                    <>
                                        <Upload className="text-gray-400 mb-1" size={24} />
                                        <span className="text-xs text-gray-500">上傳</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                    aria-label="上傳商品圖片"
                                />
                            </label>
                        </div>
                        <p className="text-xs text-gray-400">支援 jpg, png, webp</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">描述</label>
                        <textarea {...register('description')} className="w-full border p-2 rounded" rows={3} />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
                    >
                        {isPending ? '儲存中...' : '確認儲存'}
                    </button>
                </form>
            </div>

            {/* 圖片編輯 Modal */}
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