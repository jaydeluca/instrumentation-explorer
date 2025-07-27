import React from 'react';
import Disclaimer from './Disclaimer';
import NavigationBar from './NavigationBar';

interface HeaderProps {
  onVersionChange: (version: string) => void;
  currentVersion: string;
  versions: string[];
}

const Header: React.FC<HeaderProps> = ({ onVersionChange, currentVersion, versions }) => {
  return (
    <header className="app-header main-content-wrapper">
      <Disclaimer />
      <NavigationBar
        onVersionChange={onVersionChange}
        currentVersion={currentVersion}
        versions={versions}
      />
    </header>
  );
};

export default Header;
