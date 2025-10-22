import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./ConfigurationExplorer.css";
import Header from "./components/Header";
import { getDefaultVersion, sortVersionsDescending } from "./utils/versionUtils";
import { loadVersions, loadAllInstrumentationsForVersion } from "./utils/dataLoader";
import type { InstrumentationData, Configuration } from "./types-v2";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

interface ConfigurationWithInstrumentations extends Configuration {
  instrumentations: { id: string; display_name: string }[];
}

const ConfigurationExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [versions, setVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [allInstrumentations, setAllInstrumentations] = useState<InstrumentationData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const versionsData = await loadVersions();
        const versionList = versionsData.versions.map(v => v.version);
        const sortedVersions = sortVersionsDescending(versionList);
        setVersions(sortedVersions);
        
        const defaultVersion = getDefaultVersion(versionList);
        if (defaultVersion) {
          setSelectedVersion(defaultVersion);
          const instrumentations = await loadAllInstrumentationsForVersion(defaultVersion);
          setAllInstrumentations(instrumentations);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  useEffect(() => {
    async function loadVersionData() {
      if (!selectedVersion) return;
      
      try {
        setLoading(true);
        const instrumentations = await loadAllInstrumentationsForVersion(selectedVersion);
        setAllInstrumentations(instrumentations);
      } catch (error) {
        console.error(`Failed to load version ${selectedVersion}:`, error);
      } finally {
        setLoading(false);
      }
    }
    
    loadVersionData();
  }, [selectedVersion]);

  const handleVersionChange = (version: string) => {
    setSelectedVersion(version);
  };

  // Aggregate all configurations across instrumentations
  const configurationMap = useMemo(() => {
    const map = new Map<string, ConfigurationWithInstrumentations>();

    allInstrumentations.forEach((instrumentation) => {
      if (!instrumentation.configurations) return;

      instrumentation.configurations.forEach((config) => {
        const existing = map.get(config.name);
        const instrumentationInfo = {
          id: instrumentation.id,
          display_name: instrumentation.display_name,
        };

        if (existing) {
          // Add this instrumentation to the list if not already there
          const alreadyExists = existing.instrumentations.some(
            (i) => i.id === instrumentation.id
          );
          if (!alreadyExists) {
            existing.instrumentations.push(instrumentationInfo);
          }
        } else {
          // Create new entry
          map.set(config.name, {
            ...config,
            instrumentations: [instrumentationInfo],
          });
        }
      });
    });

    return map;
  }, [allInstrumentations]);

  // Convert to array and filter by search
  const configurations = useMemo(() => {
    const configArray = Array.from(configurationMap.values());
    
    if (!searchTerm) return configArray;

    const lowerSearch = searchTerm.toLowerCase();
    return configArray.filter((config) => {
      // Search in config name
      if (config.name && config.name.toLowerCase().includes(lowerSearch)) return true;
      
      // Search in description
      if (config.description && config.description.toLowerCase().includes(lowerSearch)) return true;
      
      // Search in instrumentation names
      if (config.instrumentations.some((inst) => 
        inst.display_name && inst.display_name.toLowerCase().includes(lowerSearch)
      )) return true;

      return false;
    });
  }, [configurationMap, searchTerm]);

  // Sort configurations alphabetically by name
  const sortedConfigurations = useMemo(() => {
    return [...configurations].sort((a, b) => a.name.localeCompare(b.name));
  }, [configurations]);

  const toggleRow = (configName: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(configName)) {
        newSet.delete(configName);
      } else {
        newSet.add(configName);
      }
      return newSet;
    });
  };

  const handleInstrumentationClick = (
    e: React.MouseEvent,
    instrumentationId: string
  ) => {
    e.stopPropagation();
    navigate(`/library/${selectedVersion}/${instrumentationId}`);
  };

  if (loading) {
    return (
      <div className="main-content-wrapper">
        <Header
          onVersionChange={handleVersionChange}
          currentVersion={selectedVersion}
          versions={versions}
        />
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading configuration data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content-wrapper">
      <Header
        onVersionChange={handleVersionChange}
        currentVersion={selectedVersion}
        versions={versions}
      />
      <div className="configuration-explorer">
        <div className="configuration-explorer-header">
          <h1>Configuration Options Explorer</h1>
          <p className="configuration-explorer-subtitle">
            Explore all configuration options across instrumentations
          </p>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search configurations, descriptions, or instrumentations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="results-count">
            Found {sortedConfigurations.length} configuration{sortedConfigurations.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="configuration-table-container">
          <table className="configuration-table">
            <thead>
              <tr>
                <th className="expand-column"></th>
                <th className="name-column">Configuration Name</th>
                <th className="instrumentations-column">Instrumentations</th>
                <th className="description-column">Description</th>
              </tr>
            </thead>
            <tbody>
              {sortedConfigurations.map((config) => {
                const isExpanded = expandedRows.has(config.name);
                return (
                  <React.Fragment key={config.name}>
                    <tr
                      className="config-row"
                      onClick={() => toggleRow(config.name)}
                    >
                      <td className="expand-cell">
                        {isExpanded ? (
                          <KeyboardArrowUpIcon />
                        ) : (
                          <KeyboardArrowDownIcon />
                        )}
                      </td>
                      <td className="name-cell">
                        <code>{config.name}</code>
                      </td>
                      <td className="instrumentations-cell">
                        <div className="instrumentation-count">
                          {config.instrumentations.length} instrumentation
                          {config.instrumentations.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="description-cell">{config.description}</td>
                    </tr>
                    {isExpanded && (
                      <tr className="expanded-row">
                        <td colSpan={4}>
                          <div className="expanded-content">
                            <div className="expanded-section">
                              <div className="expanded-field">
                                <span className="field-label">Type:</span>
                                <span className="field-value">
                                  <code>{config.type}</code>
                                </span>
                              </div>
                              <div className="expanded-field">
                                <span className="field-label">Default:</span>
                                <span className="field-value">
                                  <code>{String(config.default)}</code>
                                </span>
                              </div>
                            </div>
                            <div className="expanded-section">
                              <div className="field-label">
                                Instrumentations using this configuration:
                              </div>
                              <div className="instrumentation-list">
                                {config.instrumentations.map((inst) => (
                                  <button
                                    key={inst.id}
                                    className="instrumentation-chip"
                                    onClick={(e) =>
                                      handleInstrumentationClick(e, inst.id)
                                    }
                                    title={inst.display_name}
                                  >
                                    {inst.display_name || inst.id}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {sortedConfigurations.length === 0 && (
            <div className="no-results">
              No configurations found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigurationExplorer;

