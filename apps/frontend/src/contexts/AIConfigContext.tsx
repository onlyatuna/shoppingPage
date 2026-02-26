import React, { createContext, useContext, useState, useEffect } from 'react';
import { obfuscate, deobfuscate } from '../utils/securityUtils';

interface AIConfigContextType {
    apiKey: string;
    setApiKey: (key: string) => void;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export const AIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Environmental & Session salts to bind the key tightly to this specific session and browser
    const [envSalt] = useState(() => {
        if (typeof window === 'undefined') return '';

        // Combine UserAgent with a cryptographically strong Session UUID to ensure cross-tab isolation
        let sessionId = sessionStorage.getItem('_s_id_');
        if (!sessionId) {
            // [SECURITY] Use Web Crypto API for better entropy if available
            sessionId = typeof window.crypto?.randomUUID === 'function'
                ? window.crypto.randomUUID()
                : Math.random().toString(36).substring(2) + Date.now().toString(36);
            sessionStorage.setItem('_s_id_', sessionId);
        }
        // Use UserAgent combined with the cryptographically strong UUID for extreme dynamic salting
        return `${window.navigator.userAgent}-${sessionId}`;
    });

    const [apiKey, setApiKey] = useState<string>(() => {
        const stored = sessionStorage.getItem('_st_kv_');
        return deobfuscate(stored, envSalt) || '';
    });

    useEffect(() => {
        // [FORCE CLEANUP] Ensure no legacy keys exist in any storage to prevent accidental persistence
        const legacyKeys = ['gemini_api_key', 'apiKey', 'google_ai_key'];
        legacyKeys.forEach(key => {
            sessionStorage.removeItem(key);
            localStorage.removeItem(key);
        });

        // Also cleanup the current key from localStorage just in case it was ever mistakenly saved there
        localStorage.removeItem('_st_kv_');
    }, []);

    useEffect(() => {
        if (apiKey) {
            // Use dynamic salting to bind the key to the environment
            sessionStorage.setItem('_st_kv_', obfuscate(apiKey, envSalt));
        } else {
            sessionStorage.removeItem('_st_kv_');
        }
    }, [apiKey, envSalt]);

    return (
        <AIConfigContext.Provider value={{ apiKey, setApiKey }}>
            {children}
        </AIConfigContext.Provider>
    );
};

export const useAIConfig = () => {
    const context = useContext(AIConfigContext);
    if (context === undefined) {
        throw new Error('useAIConfig must be used within an AIConfigProvider');
    }
    return context;
};
