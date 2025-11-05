import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./AgentSummary.css";
import Header from "./components/Header";
import { getDefaultVersion, sortVersionsDescending } from "./utils/versionUtils";
import { loadVersions, loadAllInstrumentationsForVersion } from "./utils/dataLoader";
import type { InstrumentationData, Metric } from "./types-v2";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

interface InstrumentationSummary {
  id: string;
  display_name: string;
}

const AgentSummary: React.FC = () => {
  const navigate = useNavigate();
  const [versions, setVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [allInstrumentations, setAllInstrumentations] = useState<InstrumentationData[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["enabled", "disabled", "metrics"]));

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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Split instrumentations into enabled and disabled
  const { enabledInstrumentations, disabledInstrumentations } = useMemo(() => {
    const enabled: InstrumentationSummary[] = [];
    const disabled: InstrumentationSummary[] = [];

    allInstrumentations.forEach(instrumentation => {
      const summary: InstrumentationSummary = {
        id: instrumentation.id,
        display_name: instrumentation.display_name,
      };

      if (instrumentation.disabled_by_default) {
        disabled.push(summary);
      } else {
        enabled.push(summary);
      }
    });

    // Sort alphabetically by display name
    enabled.sort((a, b) => {
      const nameA = a.display_name || a.id;
      const nameB = b.display_name || b.id;
      return nameA.localeCompare(nameB);
    });
    disabled.sort((a, b) => {
      const nameA = a.display_name || a.id;
      const nameB = b.display_name || b.id;
      return nameA.localeCompare(nameB);
    });

    return { enabledInstrumentations: enabled, disabledInstrumentations: disabled };
  }, [allInstrumentations]);

  // Extract all default metrics from all instrumentations
  const defaultMetrics = useMemo(() => {
    const metricsMap = new Map<string, Metric>();

    allInstrumentations.forEach(instrumentation => {
      // Only include metrics from enabled instrumentations
      if (instrumentation.disabled_by_default) return;
      
      if (instrumentation.telemetry?.default?.metrics) {
        instrumentation.telemetry.default.metrics.forEach(metric => {
          // Use metric name as key to deduplicate
          if (!metricsMap.has(metric.name)) {
            metricsMap.set(metric.name, metric);
          }
        });
      }
    });

    // Convert to array and sort alphabetically
    return Array.from(metricsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allInstrumentations]);

  const handleInstrumentationClick = (instrumentationId: string) => {
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
        <div className="agent-summary-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading agent summary...</p>
          </div>
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
      <div className="agent-summary-container">
        <div className="agent-summary-header">
          <h1>Agent Summary</h1>
          <p className="agent-summary-description">
            Overview of instrumentations and metrics for Java Agent version {selectedVersion}
          </p>
        </div>

        {/* Enabled Instrumentations Section */}
        <div className="summary-section">
          <div 
            className="summary-section-header"
            onClick={() => toggleSection("enabled")}
          >
            <h2>
              Enabled by Default ({enabledInstrumentations.length})
              {expandedSections.has("enabled") ? (
                <KeyboardArrowUpIcon className="expand-icon" />
              ) : (
                <KeyboardArrowDownIcon className="expand-icon" />
              )}
            </h2>
          </div>
          {expandedSections.has("enabled") && (
            <div className="summary-section-content">
              <table className="instrumentations-table">
                <thead>
                  <tr>
                    <th>Display Name</th>
                    <th>Instrumentation Name</th>
                  </tr>
                </thead>
                <tbody>
                  {enabledInstrumentations.map(instr => (
                    <tr 
                      key={instr.id}
                      onClick={() => handleInstrumentationClick(instr.id)}
                      className="clickable-row"
                    >
                      <td className="display-name">{instr.display_name || instr.id}</td>
                      <td className="instrumentation-name">{instr.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Disabled Instrumentations Section */}
        <div className="summary-section">
          <div 
            className="summary-section-header"
            onClick={() => toggleSection("disabled")}
          >
            <h2>
              Disabled by Default ({disabledInstrumentations.length})
              {expandedSections.has("disabled") ? (
                <KeyboardArrowUpIcon className="expand-icon" />
              ) : (
                <KeyboardArrowDownIcon className="expand-icon" />
              )}
            </h2>
          </div>
          {expandedSections.has("disabled") && (
            <div className="summary-section-content">
              {disabledInstrumentations.length === 0 ? (
                <p className="empty-state">No instrumentations are disabled by default in this version.</p>
              ) : (
                <table className="instrumentations-table">
                  <thead>
                    <tr>
                      <th>Display Name</th>
                      <th>Instrumentation Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disabledInstrumentations.map(instr => (
                      <tr 
                        key={instr.id}
                        onClick={() => handleInstrumentationClick(instr.id)}
                        className="clickable-row"
                      >
                        <td className="display-name">{instr.display_name || instr.id}</td>
                        <td className="instrumentation-name">{instr.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Default Metrics Section */}
        <div className="summary-section">
          <div 
            className="summary-section-header"
            onClick={() => toggleSection("metrics")}
          >
            <h2>
              Default Metrics ({defaultMetrics.length})
              {expandedSections.has("metrics") ? (
                <KeyboardArrowUpIcon className="expand-icon" />
              ) : (
                <KeyboardArrowDownIcon className="expand-icon" />
              )}
            </h2>
          </div>
          {expandedSections.has("metrics") && (
            <div className="summary-section-content">
              <p className="metrics-note">
                These are all metrics emitted by default across all enabled instrumentations.
              </p>
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Metric Name</th>
                    <th>Type</th>
                    <th>Unit</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {defaultMetrics.map(metric => (
                    <tr key={metric.name}>
                      <td className="metric-name">{metric.name}</td>
                      <td className="metric-type">{metric.type}</td>
                      <td className="metric-unit">{metric.unit}</td>
                      <td className="metric-description">{metric.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {defaultMetrics.length === 0 && (
                <p className="empty-state">No default metrics found for enabled instrumentations in this version.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentSummary;

