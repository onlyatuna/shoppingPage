import React, { useState } from 'react';
import {
    ShieldCheck,
    X,
    Eye,
    EyeOff,
    ArrowRight,
    Lock
} from 'lucide-react';
import { useAIConfig } from '@/contexts/AIConfigContext';

interface TrustVaultModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify?: (key: string) => void;
}

const TrustVaultModal: React.FC<TrustVaultModalProps> = ({ isOpen, onClose, onVerify }) => {
    const { apiKey, setApiKey } = useAIConfig();
    // 預設為空字串，避免顯示舊的 Context 值，除非使用者真的有存過
    const [localKey, setLocalKey] = useState(apiKey || "");
    const [showKey, setShowKey] = useState(false);

    // 預設勾選 Session Only
    const [isSessionOnly, setIsSessionOnly] = useState(true);

    if (!isOpen) return null;

    const handleConnect = () => {
        // 邏輯：只有在「未勾選」Session Only 時，才存入全域 Context (持久化到 LocalStorage)
        if (!isSessionOnly) {
            setApiKey(localKey);
        } else {
            // 如果是 Session Only，確保全域 Context 被清空 (避免之前存的殘留)
            setApiKey("");
        }

        // 透過 onVerify 將 Key 傳回給當前頁面的 State (記憶體狀態)
        onVerify?.(localKey);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-[#f6f6f8] dark:bg-[#1c2835] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 bg-white dark:bg-[#161e27] border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-bold text-[#111418] dark:text-white">Trust Vault (安全金庫)</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 bg-white dark:bg-[#111621]">
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Gemini API Key
                        </label>
                        <div className="relative">
                            {/* ✅ 關鍵修正：阻擋瀏覽器自動填入 (Autofill) */}
                            <input
                                type={showKey ? "text" : "password"}
                                value={localKey}
                                onChange={(e) => setLocalKey(e.target.value)}
                                placeholder="sk-..."
                                className="block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#0b1219] text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 pl-3 pr-10"
                                autoComplete="new-password"
                                name="gemini_api_key_no_save"
                                id="gemini_api_key_no_save"
                                data-lpignore="true"
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                type="button"
                            >
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 pt-1">
                            {isSessionOnly
                                ? "Key 僅保留在記憶體中，關閉分頁或重新整理即消失。"
                                : "Key 將會儲存在瀏覽器中 (LocalStorage)，方便下次使用。"
                            }
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={isSessionOnly}
                                onChange={(e) => setIsSessionOnly(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="text-sm">
                                <span className="block font-medium text-gray-700 dark:text-gray-200">僅限本次工作階段 (Current session only)</span>
                                <span className="block text-xs text-gray-500">建議在公用電腦上使用此選項。</span>
                            </div>
                        </label>
                    </div>

                    <button
                        onClick={handleConnect}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
                        type="button"
                    >
                        <span>驗證並連線 (Verify & Connect)</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-[#161e27] px-6 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-center">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                        <Lock className="w-3 h-3" />
                        <span>256-bit SSL Secured Connection</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrustVaultModal;