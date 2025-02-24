import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProviderContextType {
  provider: string;
  setProvider: (provider: string) => void;
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

export const ProviderProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<string>('DeepSeek');

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