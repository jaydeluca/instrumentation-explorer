import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import InstrumentationInput from './InstrumentationInput';
import CombinedTelemetryDisplay from './CombinedTelemetryDisplay';
import './JarAnalyzerPage.css';
import type { Library, Metric, Span } from './types';

const JarAnalyzerPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [instrumentationNames, setInstrumentationNames] = useState<string[]>([]);
  const [allLibraries, setAllLibraries] = useState<{ [key: string]: Library[] }>({});
  const [versions, setVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [combinedMetrics, setCombinedMetrics] = useState<(Metric & { sourceInstrumentation: string })[]>([]);
  const [combinedSpans, setCombinedSpans] = useState<(Span & { sourceInstrumentation: string })[]>([]);

  useEffect(() => {
    fetch('/instrumentation-list-enriched.json')
      .then(response => response.json())
      .then(data => {
        const loadedVersions = Object.keys(data);
        setAllLibraries(data);
        setVersions(loadedVersions);

        const params = new URLSearchParams(location.search);
        const versionParam = params.get('version');
        if (versionParam && loadedVersions.includes(versionParam)) {
          setSelectedVersion(versionParam);
        } else if (loadedVersions.length > 0) {
          setSelectedVersion(loadedVersions[0]);
        }
        console.log("All Libraries loaded:", data);
      });
  }, [location.search]);

  useEffect(() => {
    console.log("Instrumentation Names:", instrumentationNames);
    console.log("Selected Version:", selectedVersion);
    if (instrumentationNames.length > 0 && selectedVersion && allLibraries[selectedVersion]) {
      const currentVersionLibraries = allLibraries[selectedVersion];
      const metrics: (Metric & { sourceInstrumentation: string })[] = [];
      const spans: (Span & { sourceInstrumentation: string })[] = [];

      instrumentationNames.forEach(name => {
        const library = currentVersionLibraries.find(lib => lib.name === name);
        console.log(`Searching for library ${name}:`, library);
        if (library && library.telemetry) {
          library.telemetry.forEach(telemetryBlock => {
            console.log(`Processing telemetry block for ${library.name} (when: ${telemetryBlock.when}):`, telemetryBlock);
            if (telemetryBlock.when === "default") { // Only consider default telemetry
              telemetryBlock.metrics?.forEach(metric => {
                metrics.push({ ...metric, sourceInstrumentation: library.name });
              });
              telemetryBlock.spans?.forEach(span => {
                spans.push({ ...span, sourceInstrumentation: library.name });
              });
            }
          });
        }
      });
      setCombinedMetrics(metrics);
      setCombinedSpans(spans);
      console.log("Combined Metrics:", metrics);
      console.log("Combined Spans:", spans);
    } else {
      setCombinedMetrics([]);
      setCombinedSpans([]);
      console.log("No instrumentations selected or version not loaded.");
    }
  }, [instrumentationNames, selectedVersion, allLibraries]);

  const handleAnalyze = useCallback((names: string[]) => {
    setInstrumentationNames(names);
  }, []);

  const handleVersionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newVersion = event.target.value;
    setSelectedVersion(newVersion);

    // Update URL with new version while preserving other params
    const params = new URLSearchParams(location.search);
    params.set('version', newVersion);
    navigate(`?${params.toString()}`);
  };

  return (
    <div className="library-detail library-card">
      <div className="detail-header">
        <button onClick={() => navigate(-1)} className="back-button">Back to List</button>
        <div className="version-selector">
          <label htmlFor="version-select">Select Version:</label>
          <select id="version-select" value={selectedVersion} onChange={handleVersionChange}>
            {versions.map(version => (
              <option key={version} value={version}>{version}</option>
            ))}
          </select>
        </div>
      </div>
      <h1>JAR Analyzer</h1>
      <InstrumentationInput onAnalyze={handleAnalyze} selectedVersion={selectedVersion} />

      {instrumentationNames.length > 0 && selectedVersion && (
        <div className="analysis-results">
          <h2>Analysis Results for Version {selectedVersion}</h2>
          <CombinedTelemetryDisplay metrics={combinedMetrics} spans={combinedSpans} />
        </div>
      )}
    </div>
  );
};

export default JarAnalyzerPage;
