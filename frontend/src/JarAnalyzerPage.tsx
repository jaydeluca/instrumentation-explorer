import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CombinedTelemetryDisplay from "./CombinedTelemetryDisplay";
import Header from "./components/Header"; // Import the new Header component
import InstrumentationInput from "./InstrumentationInput";
import "./JarAnalyzerPage.css";
import type { Library, Metric, Span } from "./types";
import { getDefaultVersion, sortVersionsDescending } from "./utils/versionUtils";
import { loadVersions, loadAllInstrumentationsForVersion } from "./utils/dataLoader";
import { convertV2ArrayToV1Libraries } from "./utils/dataAdapter";

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
    async function loadData() {
      try {
        const versionsData = await loadVersions();
        const versionList = versionsData.versions.map(v => v.version);
        const sortedVersions = sortVersionsDescending(versionList);
        setVersions(sortedVersions);

        const params = new URLSearchParams(location.search);
        const versionParam = params.get("version");
        let versionToLoad: string | undefined = undefined;
        
        if (versionParam && versionList.includes(versionParam)) {
          versionToLoad = versionParam;
        } else {
          const defaultVer = getDefaultVersion(versionList);
          if (defaultVer) {
            versionToLoad = defaultVer;
          }
        }
        
        if (versionToLoad) {
          setSelectedVersion(versionToLoad);
          const instrumentations = await loadAllInstrumentationsForVersion(versionToLoad);
          const v1Libraries = convertV2ArrayToV1Libraries(instrumentations);
          setAllLibraries({ [versionToLoad]: v1Libraries });
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    }
    
    loadData();
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
