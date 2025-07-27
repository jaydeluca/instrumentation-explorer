import React from 'react';

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
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="filter-section">
        <h4>Telemetry</h4>
        <div className="filter-buttons">
          {allTelemetryTags.map(tag => (
            <button
              key={tag}
              className={`filter-button ${activeTelemetryFilters.includes(tag) ? 'active' : ''}`}
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
              className={`filter-button ${activeTargetFilters.includes(tag) ? 'active' : ''}`}
              onClick={() => toggleTargetFilter(tag)}
            >
              {tag === 'javaagent' ? 'Java Agent' : tag === 'library' ? 'Library' : tag}
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