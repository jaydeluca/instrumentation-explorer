import GitHubIcon from "@mui/icons-material/GitHub";
import MenuIcon from "@mui/icons-material/Menu";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ThemeSwitcher from "../ThemeSwitcher";
import "./NavigationBar.css";

interface NavigationBarProps {
  onVersionChange: (version: string) => void;
  currentVersion: string;
  versions: string[];
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  onVersionChange,
  currentVersion,
  versions,
}) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isMainListActive =
    location.pathname === "/" || location.pathname.startsWith("/library/");
  const isAnalyzeServiceActive = location.pathname === "/analyze";
  const isConfigurationsActive = location.pathname === "/configurations";
  const isAgentSummaryActive = location.pathname === "/agent-summary";
  const isAboutActive = location.pathname === "/about";

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navigation-bar">
      {/* Mobile menu toggle */}
      <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
        <div className="nav-links-mobile">
          <Link to="/" className={isMainListActive ? "active-nav-link" : ""}>
            Main List
          </Link>
          <Link
            to="/analyze"
            className={isAnalyzeServiceActive ? "active-nav-link" : ""}
          >
            Analyze Service
          </Link>
          <Link
            to="/configurations"
            className={isConfigurationsActive ? "active-nav-link" : ""}
          >
            Configurations
          </Link>
          <Link
            to="/agent-summary"
            className={isAgentSummaryActive ? "active-nav-link" : ""}
          >
            Agent Summary
          </Link>
          <Link to="/about" className={isAboutActive ? "active-nav-link" : ""}>
            About
          </Link>
        </div>
        <div className="mobile-controls">
          <Link
            to="https://github.com/jaydeluca/instrumentation-explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link-mobile"
          >
            <GitHubIcon />
          </Link>
          <MenuIcon
            className={`menu-icon ${isMobileMenuOpen ? "rotated" : ""}`}
          />
        </div>
      </div>

      {/* Mobile menu content */}
      <div
        className={`mobile-menu-content ${
          !isMobileMenuOpen ? "collapsed" : ""
        }`}
      >
        <section className="nav-links ">
          <Link
            to="/"
            className={isMainListActive ? "active-nav-link lg-only" : "lg-only"}
          >
            Main List
          </Link>
          <Link
            to="/analyze"
            className={
              isAnalyzeServiceActive ? "active-nav-link lg-only" : "lg-only"
            }
          >
            Analyze Service
          </Link>
          <Link
            to="/configurations"
            className={
              isConfigurationsActive ? "active-nav-link lg-only" : "lg-only"
            }
          >
            Configurations
          </Link>
          <Link
            to="/agent-summary"
            className={
              isAgentSummaryActive ? "active-nav-link lg-only" : "lg-only"
            }
          >
            Agent Summary
          </Link>
          <Link to="/about" className={isAboutActive ? "active-nav-link" : ""}>
            About
          </Link>
          <Link
            to="https://github.com/jaydeluca/instrumentation-explorer"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon />
          </Link>
        </section>

        <section className="nav-controls">
          <section className="version-selector">
            <label htmlFor="version-select">Version:</label>
            <select
              id="version-select"
              onChange={(e) => onVersionChange(e.target.value)}
              value={currentVersion}
            >
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
        </section>
      </div>
    </nav>
  );
};

export default NavigationBar;
