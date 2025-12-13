import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Check, Image as ImageIcon } from 'lucide-react';

interface UploadZoneProps {
    onImageUpload: (file: File) => void;
    onOpenLibrary: () => void;
    uploadedImage: string | null;
}

export default function UploadZone({ onImageUpload, onOpenLibrary, uploadedImage }: UploadZoneProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onImageUpload(acceptedFiles[0]);
        }
    }, [onImageUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1,
        multiple: false
    });

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    1. 上傳商品圖
                </h3>
                <button
                    onClick={onOpenLibrary}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                >
                    <ImageIcon size={12} />
                    雲端圖庫
                </button>
            </div>

            <div
                {...getRootProps()}
                className={`
                    relative border-2 border-dashed rounded-xl p-0 overflow-hidden transition-all cursor-pointer h-40 flex items-center justify-center
                    ${isDragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                    ${uploadedImage ? 'bg-black/5 dark:bg-white/5' : ''}
                `}
            >
                <input {...getInputProps()} />

                {uploadedImage ? (
                    <div className="relative w-full h-full group">
                        <img
                            src={uploadedImage}
                            alt="Uploaded product"
                            className="w-full h-full object-contain p-2"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 flex items-center justify-center gap-2">
                            <span className="bg-green-500 text-white p-0.5 rounded-full">
                                <Check size={12} strokeWidth={3} />
                            </span>
                            <span className="text-white text-xs font-medium">去背完成</span>
                        </div>
                        {/* Hover Overlay to change image */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                            <Upload size={24} className="mb-2" />
                            <span className="text-sm">更換圖片</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-4">
                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDragActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                            {isDragActive ? <Upload size={24} /> : <ImageIcon size={24} />}
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {isDragActive ? '放開以已上傳' : '拖曳圖片至此'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            或點擊選擇檔案
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
