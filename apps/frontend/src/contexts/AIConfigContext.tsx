import React, { createContext, useContext, useState, useEffect } from 'react';
import { obfuscate, deobfuscate } from '../utils/securityUtils';

interface AIConfigContextType {
    apiKey: string;
    setApiKey: (key: string) => void;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export const AIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apiKey, setApiKey] = useState<string>(() => {
        const stored = sessionStorage.getItem('gemini_api_key');
        return deobfuscate(stored) || '';
    });

    useEffect(() => {
        if (apiKey) {
            // Apply obfuscation before storage to prevent clear-text storage
            sessionStorage.setItem('gemini_api_key', obfuscate(apiKey));
        } else {
            sessionStorage.removeItem('gemini_api_key');
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
