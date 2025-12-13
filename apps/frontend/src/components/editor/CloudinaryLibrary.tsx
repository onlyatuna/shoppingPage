import { useState, useEffect } from 'react';
import { Trash2, ChevronLeft, ChevronRight, Loader2, Image as ImageIcon, FilePenLine } from 'lucide-react';
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
                params: { next_cursor: cursor }
            });
            const { resources: newResources, next_cursor: newNextCursor } = response.data.data;

            setResources(newResources);
            setNextCursor(newNextCursor);
        } catch (error) {
            console.error('Failed to fetch library:', error);
            toast.error('無法載入圖庫');
        } finally {
            setLoading(false);
        }
    };

    const loadPage = (cursor?: string) => {
        fetchImages(cursor);
    };

    // Initial load
    useEffect(() => {
        fetchImages();
    }, []);

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

    const handleDelete = async (publicId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('確定要刪除這張圖片嗎？')) return;

        try {
            const encodedId = encodeURIComponent(publicId);
            await apiClient.delete(`/upload/${encodedId}`);

            toast.success('圖片已刪除');
            refresh();
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

    const handleRedirectToAdmin = (e: React.MouseEvent) => {
        e.stopPropagation();
        toast.info('如需刪除或管理架上商品圖片，請前往商品管理頁面操作');
        navigate('/admin/products');
    };

    return (
        <div className="flex flex-col h-full">
            {/* Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="animate-spin text-gray-400" size={24} />
                    </div>
                ) : resources.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                        <ImageIcon size={32} />
                        <span className="text-xs">雲端相簿是空的</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {resources.map((img) => (
                            <div
                                key={img.public_id}
                                onClick={() => onSelectImage(img.secure_url)}
                                className="group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
                            >
                                <img
                                    src={img.secure_url}
                                    alt="Product"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                {/* Overlay with actions */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectImage(img.secure_url);
                                            }}
                                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-transform hover:scale-110 shadow-lg"
                                            title="編輯圖片"
                                        >
                                            <FilePenLine size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(img.public_id, e)}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-transform hover:scale-110 shadow-lg"
                                            title="刪除"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <span className="absolute bottom-2 text-xs text-white/90 bg-black/50 px-2 py-0.5 rounded-full">
                                        點擊選用
                                    </span>
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
        </div>
    );
}
