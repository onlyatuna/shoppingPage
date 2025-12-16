import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface EditorLayoutProps {
    children: ReactNode;
    hasUnsavedChanges?: boolean;
}

export default function EditorLayout({ children, hasUnsavedChanges = false }: EditorLayoutProps) {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleBack = () => {
        if (hasUnsavedChanges) {
            if (window.confirm('您有未儲存的內容，確定要離開嗎？')) {
                navigate(-1);
            }
        } else {
            navigate(-1);
        }
    };

    return (
        // [修改重點] 使用 CSS Grid 佈局
        // h-[100dvh]: 使用動態視窗高度，完美解決手機網址列問題
        // grid-rows-[auto_1fr]: 第一列(Header)自動高度，第二列(內容)佔滿剩餘空間
        <div className="h-[100dvh] w-full grid grid-rows-[auto_1fr] bg-gray-50 dark:bg-[#1e1e1e] transition-colors overflow-hidden">

            {/* Header: 位於 Grid 第一列 */}
            <header className="h-14 tablet-portrait:h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1e1e1e] z-50 relative">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="p-2 tablet-portrait:p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} className="tablet-portrait:w-6 tablet-portrait:h-6" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="p-2 tablet-portrait:p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? <Moon size={20} className="tablet-portrait:w-6 tablet-portrait:h-6" /> : <Sun size={20} className="tablet-portrait:w-6 tablet-portrait:h-6" />}
                    </button>
                </div>
            </header>

            {/* Content Area: 位於 Grid 第二列 */}
            {/* min-h-0 是防止內容過長時撐爆 Grid 的關鍵 */}
            <div className="relative w-full h-full min-h-0 min-w-0 flex overflow-hidden">
                {children}
            </div>
        </div>
    );
}