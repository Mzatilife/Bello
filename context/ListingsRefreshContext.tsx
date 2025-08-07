import React, { createContext, useContext, useState } from 'react';

interface ListingsRefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ListingsRefreshContext = createContext<ListingsRefreshContextType | undefined>(undefined);

export const useListingsRefresh = () => {
  const context = useContext(ListingsRefreshContext);
  if (!context) {
    throw new Error('useListingsRefresh must be used within a ListingsRefreshProvider');
  }
  return context;
};

interface ListingsRefreshProviderProps {
  children: React.ReactNode;
}

export const ListingsRefreshProvider: React.FC<ListingsRefreshProviderProps> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <ListingsRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </ListingsRefreshContext.Provider>
  );
};
