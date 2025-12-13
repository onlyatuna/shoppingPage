import { useNavigate } from 'react-router-dom';
import CloudinaryLibrary from '../components/editor/CloudinaryLibrary';
import { ArrowLeft } from 'lucide-react';

export default function CloudLibraryPage() {
    const navigate = useNavigate();

    const handleSelectImage = (url: string) => {
        // Navigate to editor with the selected image
        navigate('/editor', { state: { imageUrl: url } });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex flex-col">
            {/* Header */}
            <div className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/editor')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-300"
                            title="返回編輯器"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            雲端圖庫
                        </h1>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-7xl w-full mx-auto p-6">
                <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 h-[calc(100vh-140px)] p-6">
                    <CloudinaryLibrary onSelectImage={handleSelectImage} />
                </div>
            </div>
        </div>
    );
}
