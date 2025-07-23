import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import type { Library } from './types';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import SearchAndFilter from './SearchAndFilter';

import { matchRoutes } from 'react-router-dom';
import { initializeFaro, createReactRouterV6DataOptions, ReactIntegration, getWebInstrumentations, } from '@grafana/faro-react';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

function App() {

    initializeFaro({
        url: 'https://faro-collector-prod-us-east-2.grafana.net/collect/40daccd6ee8227fd2eb316a9e81e7436',
        app: {
            name: 'Instrumentation Explorer (POC)',
            version: '1.0.0',
            environment: 'production'
        },

        instrumentations: [
            // Mandatory, omits default instrumentations otherwise.
            ...getWebInstrumentations(),

            // Tracing package to get end-to-end visibility for HTTP requests.
            new TracingInstrumentation(),

            // React integration for React applications.
            new ReactIntegration({
                router: createReactRouterV6DataOptions({
                    matchRoutes,
                }),
            }),
        ],
    });

  const [libraries, setLibraries] = useState<Library[]>([]);
  const [allLibraries, setAllLibraries] = useState<{ [key: string]: Library[] }>({});
  const [versions, setVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSemconvFilters, setActiveSemconvFilters] = useState<string[]>([]);
  const [activeTelemetryFilters, setActiveTelemetryFilters] = useState<string[]>([]);
  const [activeTargetFilters, setActiveTargetFilters] = useState<string[]>([]);

  useEffect(() => {
    fetch('/instrumentation-list-enriched.json')
      .then(response => response.json())
      .then(data => {
        const versions = Object.keys(data);
        setAllLibraries(data);
        setVersions(versions);
        setSelectedVersion(versions[0]);
        setLibraries(data[versions[0]]);
      });
  }, []);

  useEffect(() => {
    if (selectedVersion) {
      setLibraries(allLibraries[selectedVersion]);
    }
  }, [selectedVersion, allLibraries]);

  const allSemconvTags = Array.from(new Set(libraries.flatMap(lib => lib.semconv || [])));
  const allTelemetryTags = Array.from(new Set(libraries.flatMap(lib => {
    const tags = [];
    if (lib.telemetry?.some(t => t.spans?.length)) {
      tags.push('Spans');
    }
    if (lib.telemetry?.some(t => t.metrics?.length)) {
      tags.push('Metrics');
    }
    return tags;
  })));
  const allTargetTags = Array.from(new Set(libraries.flatMap(lib => Object.keys(lib.target_versions || {}))));

  const toggleFilter = (filter: string, activeFilters: string[], setActiveFilters: (filters: string[]) => void) => {
    const newFilters = activeFilters.includes(filter) ? activeFilters.filter(f => f !== filter) : [...activeFilters, filter];
    setActiveFilters(newFilters);
  };

  const filteredLibraries = libraries.filter((library) => {
    const matchesSearchTerm = library.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemconvFilters = activeSemconvFilters.length > 0 ? activeSemconvFilters.every(filter => library.semconv?.includes(filter)) : true;
    const matchesTelemetryFilters = activeTelemetryFilters.length > 0 ? activeTelemetryFilters.every(filter => {
      if (filter === 'Spans') return library.telemetry?.some(t => t.spans?.length);
      if (filter === 'Metrics') return library.telemetry?.some(t => t.metrics?.length);
      return false;
    }) : true;
    const matchesTargetFilters = activeTargetFilters.length > 0 ? activeTargetFilters.every(filter => library.target_versions && (library.target_versions[filter as keyof typeof library.target_versions]?.length || 0) > 0) : true;
    return matchesSearchTerm && matchesSemconvFilters && matchesTelemetryFilters && matchesTargetFilters;
  });

  return (
    <div className="App">
      <div className="header-container">
        <h1>Instrumentation Libraries</h1>
        <Link to="/analyze" className="analyze-link">Analyze Service</Link>
      </div>
      <div className="version-selector" style={{ marginBottom: '10px' }}>
        <label htmlFor="version-select">Select Version:</label>
        <select id="version-select" value={selectedVersion} onChange={(e) => setSelectedVersion(e.target.value)}>
          {versions.map(version => (
            <option key={version} value={version}>{version}</option>
          ))}
        </select>
      </div>
      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        allTelemetryTags={allTelemetryTags}
        activeTelemetryFilters={activeTelemetryFilters}
        toggleTelemetryFilter={(tag) => toggleFilter(tag, activeTelemetryFilters, setActiveTelemetryFilters)}
        allSemconvTags={allSemconvTags}
        activeSemconvFilters={activeSemconvFilters}
        toggleSemconvFilter={(tag) => toggleFilter(tag, activeSemconvFilters, setActiveSemconvFilters)}
        allTargetTags={allTargetTags}
        activeTargetFilters={activeTargetFilters}
        toggleTargetFilter={(tag) => toggleFilter(tag, activeTargetFilters, setActiveTargetFilters)}
      />
      <div className="library-list">
        {filteredLibraries.map((library) => (
          <div key={library.name} className="library-card">
            <a href={`/library/${selectedVersion}/${library.name}`}>
              <h2>{library.name}</h2>
            </a>
            <div className="target-tags">
              {library.target_versions?.javaagent && <span className="target-tag javaagent"><SmartToyIcon sx={{ fontSize: 12 }} /></span>}
              {library.target_versions?.library && <span className="target-tag library"><LocalLibraryIcon sx={{ fontSize: 12 }} /></span>}
            </div>
            <p style={{ flexGrow: 1 }}>{library.description}</p>
            <div className="telemetry-tags">
              {library.telemetry?.some(t => t.spans?.length) && <span className="telemetry-tag spans">Spans</span>}
              {library.telemetry?.some(t => t.metrics?.length) && <span className="telemetry-tag metrics">Metrics</span>}
            </div>
            {library.semconv && library.semconv.length > 0 && (
              <div className="semconv-tags">
                {library.semconv.map((tag) => (
                  <span key={tag} className="semconv-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
