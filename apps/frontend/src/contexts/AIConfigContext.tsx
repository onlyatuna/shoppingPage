import React, { createContext, useContext, useState, useEffect } from 'react';

interface AIConfigContextType {
    apiKey: string;
    setApiKey: (key: string) => void;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export const AIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apiKey, setApiKey] = useState<string>('');

    useEffect(() => {
        // [FORCE CLEANUP] Ensure no legacy keys exist to prevent accidental persistence
        const legacyKeys = ['gemini_api_key', 'apiKey', 'google_ai_key', '_st_kv_', '_cfg_g_'];
        legacyKeys.forEach(key => {
            sessionStorage.removeItem(key);
            localStorage.removeItem(key);
        });
    }, []);

    // No useEffect to save apiKey to storage - keep it in memory only

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
