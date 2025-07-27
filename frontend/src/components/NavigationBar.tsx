import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeSwitcher from '../ThemeSwitcher';
import GitHubIcon from '@mui/icons-material/GitHub';

interface NavigationBarProps {
  onVersionChange: (version: string) => void;
  currentVersion: string;
  versions: string[];
}

const NavigationBar: React.FC<NavigationBarProps> = ({ onVersionChange, currentVersion, versions }) => {
  const location = useLocation();
  const isMainListActive = location.pathname === '/' || location.pathname.startsWith('/library/');
  const isAnalyzeServiceActive = location.pathname === '/analyze';
  const isAboutActive = location.pathname === '/about';

  return (
    <nav className="navigation-bar">
      <section className="nav-links">
        <Link to="/" className={isMainListActive ? 'active-nav-link' : ''}>Main List</Link>
        <Link to="/analyze" className={isAnalyzeServiceActive ? 'active-nav-link' : ''}>Analyze Service</Link>
        <Link to="/about" className={isAboutActive ? 'active-nav-link' : ''}>About</Link>
        <a href="https://github.com/jaydeluca/instrumentation-explorer" target="_blank" rel="noopener noreferrer">
          <GitHubIcon />
        </a>
      </section>
      <section className="version-selector">
        <label htmlFor="version-select">Version:</label>
        <select id="version-select" onChange={(e) => onVersionChange(e.target.value)} value={currentVersion}>
          {versions.map((version) => (
            <option key={version} value={version}>
              {version}
            </option>
          ))}
        </select>
      </section>
      <section className="theme-selector">
        <ThemeSwitcher />
      </section>
    </nav>
  );
};

export default NavigationBar;
