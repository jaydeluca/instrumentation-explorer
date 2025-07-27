import React from 'react';
import { useTheme } from './hooks/useTheme';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(event.target.value as 'default' | 'grafana');
  };

  return (
    <div className="theme-switcher">
      <label htmlFor="theme-select">Theme: </label>
      <select id="theme-select" value={theme} onChange={handleChange}>
        <option value="default">Default</option>
        <option value="grafana">Grafana</option>
      </select>
    </div>
  );
};

export default ThemeSwitcher;
