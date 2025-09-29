import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PrimeBotContextType {
  isFullscreen: boolean;
  setIsFullscreen: (isFullscreen: boolean) => void;
}

const PrimeBotContext = createContext<PrimeBotContextType | undefined>(undefined);

export const usePrimeBot = () => {
  const context = useContext(PrimeBotContext);
  if (context === undefined) {
    throw new Error('usePrimeBot must be used within a PrimeBotProvider');
  }
  return context;
};

interface PrimeBotProviderProps {
  children: ReactNode;
}

export const PrimeBotProvider: React.FC<PrimeBotProviderProps> = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <PrimeBotContext.Provider value={{ isFullscreen, setIsFullscreen }}>
      {children}
    </PrimeBotContext.Provider>
  );
};
