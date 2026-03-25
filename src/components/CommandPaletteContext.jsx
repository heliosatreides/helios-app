import { createContext, useContext, useState, useCallback } from 'react';

const CommandPaletteContext = createContext({ open: false, setOpen: () => {} });

export function CommandPaletteProvider({ children }) {
  const [open, setOpen] = useState(false);

  const openCommandPalette = useCallback(() => {
    setOpen(true);
  }, []);

  const closeCommandPalette = useCallback(() => {
    setOpen(false);
  }, []);

  const toggleCommandPalette = useCallback(() => {
    setOpen((p) => !p);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, openCommandPalette, closeCommandPalette, toggleCommandPalette }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}
