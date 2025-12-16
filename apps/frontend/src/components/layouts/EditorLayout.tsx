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
        <div className="h-screen w-full flex flex-col overflow-hidden bg-gray-50 dark:bg-[#1e1e1e] transition-colors">
            {/* Header */}
            <header className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1e1e1e] z-50 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                </div>
            </header>

            {/* Content Area - fills remaining space */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
                {children}
            </div>
        </div>
    );
}
