import React from 'react';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';

interface SearchAndFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  allTelemetryTags: string[];
  activeTelemetryFilters: string[];
  toggleTelemetryFilter: (filter: string) => void;
  allSemconvTags: string[];
  activeSemconvFilters: string[];
  toggleSemconvFilter: (filter: string) => void;
  allTargetTags: string[];
  activeTargetFilters: string[];
  toggleTargetFilter: (filter: string) => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  setSearchTerm,
  allTelemetryTags,
  activeTelemetryFilters,
  toggleTelemetryFilter,
  allSemconvTags,
  activeSemconvFilters,
  toggleSemconvFilter,
  allTargetTags,
  activeTargetFilters,
  toggleTargetFilter
}) => {
  return (
    <div className="search-filter-container">
      <div className="filter-section">
        <h4>Search</h4>
        <div className="search-input-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="filter-section">
        <h4>Telemetry</h4>
        <div className="filter-buttons">
          {allTelemetryTags.map(tag => (
            <button
              key={tag}
              className={`filter-button ${tag.toLowerCase()} ${activeTelemetryFilters.includes(tag) ? 'active' : ''}`}
              onClick={() => toggleTelemetryFilter(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4>Target</h4>
        <div className="filter-buttons">
          {allTargetTags.map(tag => (
            <button
              key={tag}
              className={`filter-button ${tag} ${activeTargetFilters.includes(tag) ? 'active' : ''}`}
              onClick={() => toggleTargetFilter(tag)}
            >
              {tag === 'javaagent' ? (
                <>
                  <SmartToyIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  Java Agent
                </>
              ) : tag === 'library' ? (
                <>
                  <LocalLibraryIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  Standalone
                </>
              ) : (
                tag
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4>Semantic Conventions</h4>
        <div className="filter-buttons">
          {allSemconvTags.map(tag => (
            <button
              key={tag}
              className={`filter-button ${activeSemconvFilters.includes(tag) ? 'active' : ''}`}
              onClick={() => toggleSemconvFilter(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilter;