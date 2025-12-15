import { useState, useEffect, useRef } from 'react';
import { Trash2, ChevronLeft, ChevronRight, Loader2, Image as ImageIcon, Upload, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';

interface CloudinaryResource {
    public_id: string;
    secure_url: string;
    format: string;
    width: number;
    height: number;
    created_at: string;
}

interface CloudinaryLibraryProps {
    onSelectImage: (imageUrl: string) => void;
}

export default function CloudinaryLibrary({ onSelectImage }: CloudinaryLibraryProps) {
    const navigate = useNavigate();
    const [resources, setResources] = useState<CloudinaryResource[]>([]);
    const [loading, setLoading] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

    // Interaction State
    const [isEditMode, setIsEditMode] = useState(false);
    const [activeDeleteId, setActiveDeleteId] = useState<string | null>(null);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const isLongPressRef = useRef(false);

    // Folder State
    const [viewType, setViewType] = useState<'product' | 'canvas'>('product');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Let's rewrite pagination logic cleanly
    // cursorStack stores the cursor used to fetch the CURRENT and PREVIOUS pages.
    // Index 0: undefined (Page 1)
    // Index 1: cursor_A (Page 2)
    const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined]);
    const currentPageIndex = cursorStack.length - 1;

    const fetchImages = async (cursor?: string) => {
        setLoading(true);
        try {
            const response = await apiClient.get('/upload/resources', {
                params: {
                    next_cursor: cursor,
                    type: viewType
                }
            });
            const { resources: newResources, next_cursor: newNextCursor } = response.data.data;

            setResources(newResources);
            setNextCursor(newNextCursor);
        } catch (error: any) {
            console.error('Failed to fetch library:', error);

            // Distinguish between different error types
            const status = error.response?.status;
            const message = error.response?.data?.message;

            if (status === 401 || status === 403) {
                toast.error('權限不足：此功能需要管理員或開發者權限', {
                    description: message || '請使用管理員帳號登入',
                    duration: 5000
                });
            } else if (status === 500) {
                toast.error('伺服器錯誤：無法載入圖庫', {
                    description: '請檢查 Cloudinary 設定或稍後再試',
                    duration: 5000
                });
            } else {
                toast.error('無法載入圖庫', {
                    description: message || '請稍後再試',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const loadPage = (cursor?: string) => {
        fetchImages(cursor);
    };

    // Initial load & when viewType changes
    useEffect(() => {
        // Reset pagination when switching tabs
        setCursorStack([undefined]);
        setNextCursor(null);
        fetchImages();
        setIsEditMode(false); // Reset edit mode on tab switch
    }, [viewType]);

    const goToNext = () => {
        if (!nextCursor) return;
        const newStack = [...cursorStack, nextCursor];
        setCursorStack(newStack);
        loadPage(nextCursor);
    };

    const goToPrev = () => {
        if (cursorStack.length <= 1) return;
        const newStack = cursorStack.slice(0, -1);
        setCursorStack(newStack);
        const prevCursor = newStack[newStack.length - 1];
        loadPage(prevCursor);
    };

    const refresh = () => {
        const currentCursor = cursorStack[currentPageIndex];
        loadPage(currentCursor);
    }

    const handleDelete = async (publicId: string, e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        if (!confirm('確定要刪除這張圖片嗎？')) return;

        try {
            const encodedId = encodeURIComponent(publicId);
            await apiClient.delete(`/upload/${encodedId}`);

            toast.success('圖片已刪除');
            refresh();
            setActiveDeleteId(null); // Reset active delete
        } catch (error: any) {
            const msg = error.response?.data?.message || '刪除失敗';
            // Check for specific error code if available, or just show message
            if (error.response?.data?.code === 'IMAGE_IN_USE') {
                toast.error(msg, {
                    action: {
                        label: '前往管理',
                        onClick: () => navigate('/admin/products')
                    },
                    duration: 5000
                });
            } else {
                toast.error(msg);
            }
            console.error('Delete failed:', error);
        }
    };

    // Long Press Handlers
    const handleTouchStart = (id: string) => {
        isLongPressRef.current = false;
        const timer = setTimeout(() => {
            isLongPressRef.current = true;
            setActiveDeleteId(id);
            // Optional: Vibrate to indicate long press
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500); // 500ms long press
        setLongPressTimer(timer);
    };

    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const handleTouchMove = () => {
        // If user drags, cancel long press
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('type', viewType); // Specify folder type

            await apiClient.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('圖片上傳成功');
            refresh(); // Reload list
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error(error.response?.data?.message || '上傳失敗');
        } finally {
            setIsUploading(false);
            // Clear input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tabs & Upload Header */}
            <div className="flex items-center justify-between p-2 pb-0 mb-2 border-b border-gray-100 dark:border-gray-700">
                <div className="flex gap-4">
                    <button
                        onClick={() => setViewType('product')}
                        className={`text-sm font-medium pb-2 border-b-2 transition-colors ${viewType === 'product'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        商品圖片
                    </button>
                    <button
                        onClick={() => setViewType('canvas')}
                        className={`text-sm font-medium pb-2 border-b-2 transition-colors ${viewType === 'canvas'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        畫布素材
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle Edit Mode */}
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                            ${isEditMode
                                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        <Pencil size={14} />
                        {isEditMode ? '完成編輯' : '編輯'}
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isUploading ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Upload size={14} />
                        )}
                        上傳圖片
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div
                className="flex-1 overflow-y-auto custom-scrollbar p-1"
                onClick={() => setActiveDeleteId(null)}
            >
                {loading && resources.length === 0 ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="animate-spin text-gray-400" size={24} />
                    </div>
                ) : resources.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                        <ImageIcon size={32} />
                        <span className="text-xs">
                            {viewType === 'product' ? '沒有商品圖片' : '沒有畫布素材'}
                        </span>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {resources.map((img) => (
                            <div
                                key={img.public_id}
                                onClick={(e) => {
                                    e.stopPropagation(); // Stop bubbling

                                    // If we are in "delete mode" for this image (mobile), don't select it
                                    if (activeDeleteId === img.public_id) {
                                        setActiveDeleteId(null);
                                        return;
                                    }

                                    // Only select if NOT in edit mode
                                    if (!isEditMode) {
                                        onSelectImage(img.secure_url);
                                    }
                                }}
                                // Mobile Long Press Handlers
                                onTouchStart={() => handleTouchStart(img.public_id)}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchMove}
                                className={`group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer border-2 transition-all shadow-sm 
                                    ${activeDeleteId === img.public_id || isEditMode
                                        ? 'border-blue-500 shadow-md'
                                        : 'border-transparent'
                                    }
                                    ${isEditMode ? 'hover:border-red-400' : ''}
                                `}
                            >
                                <img
                                    src={img.secure_url}
                                    alt="Product"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                {/* Overlay with actions */}
                                <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center
                                    ${activeDeleteId === img.public_id || isEditMode ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}
                                `}>
                                    {isEditMode || activeDeleteId === img.public_id ? (
                                        <button
                                            onClick={(e) => handleDelete(img.public_id, e)}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-transform hover:scale-110 shadow-lg animate-in zoom-in duration-200"
                                            title="刪除"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    ) : (
                                        <span className="text-white/80 text-xs font-medium px-2 py-1 bg-black/40 rounded-full backdrop-blur-sm">
                                            點擊選用
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                    onClick={goToPrev}
                    disabled={cursorStack.length <= 1 || loading}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-600 dark:text-gray-300"
                >
                    <ChevronLeft size={18} />
                </button>
                <div className="text-xs text-gray-400 font-mono">
                    Page {cursorStack.length}
                </div>
                <button
                    onClick={goToNext}
                    disabled={!nextCursor || loading}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-600 dark:text-gray-300"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div >
    );
}
