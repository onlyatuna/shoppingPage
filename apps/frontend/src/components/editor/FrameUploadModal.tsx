import { useState, useRef } from 'react';
import { X, Upload, Check } from 'lucide-react';
import { Frame } from '../../types/frame';
import { toast } from 'sonner';

interface FrameUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (frame: Frame) => void;
}

export default function FrameUploadModal({
    isOpen,
    onClose,
    onSave
}: FrameUploadModalProps) {
    const [frameName, setFrameName] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [frameFile, setFrameFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('請上傳圖片檔案');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('檔案大小不能超過 5MB');
            return;
        }

        setFrameFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        if (!frameName || !previewUrl) {
            toast.error('請填寫圖框名稱並上傳圖片');
            return;
        }

        const newFrame: Frame = {
            id: `custom_${Date.now()}`,
            name: frameName,
            preview: previewUrl,
            url: previewUrl,
            isCustom: true
        };

        onSave(newFrame);
        handleClose();
        toast.success('圖框已上傳');
    };

    const handleClose = () => {
        setFrameName('');
        setPreviewUrl(null);
        setFrameFile(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">上傳自訂圖框</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Frame Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            圖框名稱 *
                        </label>
                        <input
                            type="text"
                            value={frameName}
                            onChange={(e) => setFrameName(e.target.value)}
                            placeholder="例：我的相框"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            上傳圖框圖片 *
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            aria-label="上傳圖框圖片"
                        />

                        {previewUrl ? (
                            <div className="relative aspect-square rounded-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => {
                                        setPreviewUrl(null);
                                        setFrameFile(null);
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex flex-col items-center justify-center gap-2"
                            >
                                <Upload size={32} className="text-gray-400" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    點擊上傳圖框
                                </span>
                                <span className="text-xs text-gray-500">
                                    建議使用 PNG 透明背景
                                </span>
                            </button>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            提示：圖框中心應為透明，以顯示圖片內容
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!frameName || !previewUrl}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Check size={18} />
                        儲存圖框
                    </button>
                </div>
            </div>
        </div>
    );
}
