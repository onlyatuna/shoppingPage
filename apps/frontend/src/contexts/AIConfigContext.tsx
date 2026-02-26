import React, { createContext, useContext, useState, useEffect } from 'react';
import { obfuscate, deobfuscate } from '../utils/securityUtils';

interface AIConfigContextType {
    apiKey: string;
    setApiKey: (key: string) => void;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export const AIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Environmental salt to bind the obfuscated key to this specific browser/device
    const envSalt = typeof window !== 'undefined' ? window.navigator.userAgent : '';

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
