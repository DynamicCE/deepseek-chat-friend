import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSecureApiKey, removeSecureApiKey, setSecureApiKey } from '../utils/security';

interface ApiKeyContextType {
  apiKey: string | null;
  provider: string;
  setApiKey: (key: string) => void;
  setProvider: (provider: string) => void;
  clearApiKey: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider = ({ children }: { children: ReactNode }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('openai');

  // Component mount olduğunda güvenli bir şekilde saklanan API key'i al
  useEffect(() => {
    const savedApiKey = getSecureApiKey(provider);
    if (savedApiKey) {
      setApiKeyState(savedApiKey);
    }
  }, [provider]);

  const setApiKey = (key: string) => {
    setSecureApiKey(provider, key);
    setApiKeyState(key);
  };

  const clearApiKey = () => {
    setApiKeyState(null);
    removeSecureApiKey(provider);
  };

  return (
    <ApiKeyContext.Provider value={{ 
      apiKey, 
      setApiKey, 
      provider, 
      setProvider,
      clearApiKey 
    }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}; 