import React, { useState, useEffect } from 'react';
import type { Theme } from './context/ThemeContext';
import { ThemeContext } from './context/ThemeContext';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('app-theme');
    return (savedTheme as Theme) || 'default';
  });

  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};