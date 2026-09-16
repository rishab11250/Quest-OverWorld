import React, { createContext, useContext, useState, useCallback } from 'react';
import { triggerHaptic } from '../lib/haptics';

const DrawerContext = createContext({
  isOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
});

export const useRpgDrawer = () => useContext(DrawerContext);

export function DrawerProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = useCallback(() => {
    triggerHaptic('light');
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    triggerHaptic('light');
    setIsOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    triggerHaptic('medium');
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <DrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer, toggleDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
}
