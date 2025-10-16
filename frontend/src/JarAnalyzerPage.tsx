import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CombinedTelemetryDisplay from "./CombinedTelemetryDisplay";
import Header from "./components/Header"; // Import the new Header component
import InstrumentationInput from "./InstrumentationInput";
import "./JarAnalyzerPage.css";
import type { Library, Metric, Span } from "./types";
import { getDefaultVersion, sortVersionsDescending } from "./utils/versionUtils";

const JarAnalyzerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [instrumentationNames, setInstrumentationNames] = useState<string[]>(
    []
  );
  const [allLibraries, setAllLibraries] = useState<{
    [key: string]: Library[];
  }>({});
  const [versions, setVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [combinedMetrics, setCombinedMetrics] = useState<
    (Metric & { sourceInstrumentation: string })[]
  >([]);
  const [combinedSpans, setCombinedSpans] = useState<
    (Span & { sourceInstrumentation: string })[]
  >([]);

  useEffect(() => {
    fetch("/instrumentation-explorer/instrumentation-list-enriched.json")
      .then((response) => response.json())
      .then((data) => {
        const loadedVersions = Object.keys(data);
        const sortedVersions = sortVersionsDescending(loadedVersions);
        setAllLibraries(data);
        setVersions(sortedVersions);

        const params = new URLSearchParams(location.search);
        const versionParam = params.get("version");
        if (versionParam && loadedVersions.includes(versionParam)) {
          setSelectedVersion(versionParam);
        } else {
          const defaultVersion = getDefaultVersion(loadedVersions);
          if (defaultVersion) {
            setSelectedVersion(defaultVersion);
          }
        }
      });
  }, [location.search]);

  useEffect(() => {
    if (
      instrumentationNames.length > 0 &&
      selectedVersion &&
      allLibraries[selectedVersion]
    ) {
      const currentVersionLibraries = allLibraries[selectedVersion];
      const metrics: (Metric & { sourceInstrumentation: string })[] = [];
      const spans: (Span & { sourceInstrumentation: string })[] = [];

      instrumentationNames.forEach((name) => {
        const library = currentVersionLibraries.find(
          (lib) => lib.name === name
        );
        if (library && library.telemetry) {
          library.telemetry.forEach((telemetryBlock) => {
            if (telemetryBlock.when === "default") {
              // Only consider default telemetry
              telemetryBlock.metrics?.forEach((metric) => {
                metrics.push({
                  ...metric,
                  sourceInstrumentation: library.name,
                });
              });
              telemetryBlock.spans?.forEach((span) => {
                spans.push({ ...span, sourceInstrumentation: library.name });
              });
            }
          });
        }
      });
      setCombinedMetrics(metrics);
      setCombinedSpans(spans);
    } else {
      setCombinedMetrics([]);
      setCombinedSpans([]);
    }
  }, [instrumentationNames, selectedVersion, allLibraries]);

  const handleAnalyze = useCallback((names: string[]) => {
    setInstrumentationNames(names);
  }, []);

  const handleVersionChange = (newVersion: string) => {
    setSelectedVersion(newVersion);

    // Update URL with new version while preserving other params
    const params = new URLSearchParams(location.search);
    params.set("version", newVersion);
    navigate(`?${params.toString()}`);
  };

  return (
    <div className="main-content-wrapper">
      <Header
        onVersionChange={handleVersionChange}
        currentVersion={selectedVersion}
        versions={versions}
      />
      <div className="library-detail library-card">
        <h1>JAR Analyzer</h1>
        <InstrumentationInput
          onAnalyze={handleAnalyze}
          selectedVersion={selectedVersion}
        />

        {instrumentationNames.length > 0 && selectedVersion && (
          <div className="analysis-results">
            <h2>Analysis Results for Version {selectedVersion}</h2>
            
            {combinedMetrics.length > 0 && (
              <div className="metrics-list-section">
                <h3>All Metrics Emitted</h3>
                <ul>
                  {combinedMetrics.map((metric, index) => (
                    <li key={index}>{metric.name}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <CombinedTelemetryDisplay
              metrics={combinedMetrics}
              spans={combinedSpans}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default JarAnalyzerPage;
