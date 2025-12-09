//ProductFormModal.tsx
import { useForm } from 'react-hook-form';
import { X, Upload, Trash2, Loader2 } from 'lucide-react';
import { Product, Category } from '../types';
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
    initialData?: Product | null;
    isPending: boolean;
}

export default function ProductFormModal({ isOpen, onClose, onSubmit, initialData, isPending }: Props) {
    const { register, handleSubmit, reset, setValue, watch } = useForm<ProductFormData>();

    // 監聽目前的 images 值，以便即時顯示預覽
    const currentImagesStr = watch('images') || '';
    const currentImages = currentImagesStr ? currentImagesStr.split(',').filter(Boolean) : [];

    // 上傳中的狀態
    const [isUploading, setIsUploading] = useState(false);


    // 1. 撈取分類列表
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Category[] }>('/categories');
            return res.data.data;
        },
        enabled: isOpen, // 只有 Modal 打開時才撈
    });

    // 2. 控制表單初始值
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // --- 編輯模式 ---
                setValue('name', initialData.name);
                setValue('price', Number(initialData.price));
                setValue('stock', initialData.stock);
                setValue('description', initialData.description || '');
                setValue('slug', initialData.slug || `product-${initialData.id}`);
                setValue('isActive', initialData.isActive);
                setValue('images', initialData.images?.join(',') || '');
                setValue('categoryId', initialData.categoryId); // 使用真實分類 ID
            } else {
                // --- 新增模式 ---
                reset({
                    name: '',
                    price: 0,
                    stock: 10,
                    description: '',
                    images: '',
                    categoryId: categories && categories.length > 0 ? categories[0].id : 0, // 預設第一個分類
                    isActive: true,
                    slug: `new-${Date.now()}`,
                });
            }
        }
    }, [isOpen, initialData, categories, reset, setValue]);

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


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black">
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-4">{initialData ? '編輯商品' : '新增商品'}</h2>

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
                                        onClick={() => removeImage(url)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
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
        </div>
    );
}