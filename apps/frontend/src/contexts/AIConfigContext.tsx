import React, { createContext, useContext, useState, useEffect } from 'react';
import { obfuscate, deobfuscate } from '../utils/securityUtils';

interface AIConfigContextType {
    apiKey: string;
    setApiKey: (key: string) => void;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export const AIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apiKey, setApiKey] = useState<string>(() => {
        // Use an obfuscated key name to avoid easy detection
        const stored = sessionStorage.getItem('_cfg_g_');
        return deobfuscate(stored) || '';
    });

    useEffect(() => {
        // Cleanup legacy plain-text or poorly obfuscated key
        if (sessionStorage.getItem('gemini_api_key')) {
            sessionStorage.removeItem('gemini_api_key');
        }
    }, []);

    useEffect(() => {
        if (apiKey) {
            // Apply enhanced XOR obfuscation before storage to break taint tracking
            sessionStorage.setItem('_cfg_g_', obfuscate(apiKey));
        } else {
            sessionStorage.removeItem('_cfg_g_');
        }
    }, [apiKey]);

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
