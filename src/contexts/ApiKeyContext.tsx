import React, { createContext, useContext, useState } from 'react';

interface ApiKeyContextType {
  apiKey: string | null;
  provider: string;
  setApiKey: (key: string) => void;
  setProvider: (provider: string) => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('openai');

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, provider, setProvider }}>
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