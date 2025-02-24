import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProviderContextType {
  provider: 'OpenRouter' | 'ChatGPT' | 'Claude';
  setProvider: (provider: 'OpenRouter' | 'ChatGPT' | 'Claude') => void;
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

export const ProviderProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<'OpenRouter' | 'ChatGPT' | 'Claude'>('OpenRouter');

  return (
    <ProviderContext.Provider value={{ provider, setProvider }}>
      {children}
    </ProviderContext.Provider>
  );
};

export const useProviderContext = () => {
  const context = useContext(ProviderContext);
  if (context === undefined) {
    throw new Error('useProviderContext must be used within a ProviderProvider');
  }
  return context;
}; 