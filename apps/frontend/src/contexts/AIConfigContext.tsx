import React, { createContext, useContext, useState, useEffect } from 'react';

interface AIConfigContextType {
    apiKey: string;
    setApiKey: (key: string) => void;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export const AIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apiKey, setApiKey] = useState<string>(() => {
        return sessionStorage.getItem('gemini_api_key') || '';
    });

    useEffect(() => {
        if (apiKey) {
            sessionStorage.setItem('gemini_api_key', apiKey);
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
