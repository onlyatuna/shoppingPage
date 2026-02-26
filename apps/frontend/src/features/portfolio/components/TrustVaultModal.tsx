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
    const [localKey, setLocalKey] = useState(apiKey || "");
    const [showKey, setShowKey] = useState(false);

    if (!isOpen) return null;

    const handleConnect = () => {
        // 統一存入 AIConfigContext (目前已實作為純記憶體模式，重新整理即失效)
        setApiKey(localKey);
        // 透過 onVerify 將 Key 傳回給當前頁面的 State (高優先級主動記憶體狀態)
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
                        <form
                            className="relative"
                            onSubmit={(e) => { e.preventDefault(); handleConnect(); }}
                        >
                            <input
                                type="text"
                                value={localKey}
                                onChange={(e) => setLocalKey(e.target.value)}
                                placeholder="sk-..."
                                className="block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#0b1219] text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 pl-3 pr-10"
                                autoComplete="off"
                                name="_st_vault_token"
                                id="_st_vault_token"
                                data-lpignore="true"
                                style={{ WebkitTextSecurity: showKey ? 'none' : 'disc' } as any}
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                type="button"
                            >
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </form>
                        <p className="text-[10px] text-gray-500 pt-2">
                            <Lock className="w-3 h-3 inline mr-1" />
                            Key 僅保留在本次分頁會話 (Session) 中，重新整理或關閉分頁即消失。
                        </p>
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