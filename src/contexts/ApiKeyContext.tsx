import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSecureApiKey, removeSecureApiKey } from '../utils/security';

interface ApiKeyContextType {
  apiKey: string | null;
  provider: string;
  setApiKey: (key: string | null) => void;
  setProvider: (provider: string) => void;
  clearApiKey: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('openai');

  // Component mount olduğunda güvenli bir şekilde saklanan API key'i al
  useEffect(() => {
    const savedApiKey = getSecureApiKey(provider);
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, [provider]);

  const clearApiKey = () => {
    setApiKey(null);
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
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}; 