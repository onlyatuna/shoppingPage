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
        const stored = sessionStorage.getItem('_cfg_g_');
        return deobfuscate(stored, envSalt) || '';
    });

    useEffect(() => {
        // Cleanup legacy plain-text or poorly obfuscated key
        if (sessionStorage.getItem('gemini_api_key')) {
            sessionStorage.removeItem('gemini_api_key');
        }
    }, []);

    useEffect(() => {
        if (apiKey) {
            // Use dynamic salting to bind the key to the environment
            sessionStorage.setItem('_cfg_g_', obfuscate(apiKey, envSalt));
        } else {
            sessionStorage.removeItem('_cfg_g_');
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
