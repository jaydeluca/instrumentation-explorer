import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { useEffect, useState } from "react";
import "./App.css";
import SearchAndFilter from "./SearchAndFilter";
import TruncatedDescription from "./TruncatedDescription";
import type { Library } from "./types";

import { Link } from "react-router-dom"; // Keep Link for library cards
import Header from "./components/Header"; // Import the new Header component

function App() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [allLibraries, setAllLibraries] = useState<{
    [key: string]: Library[];
  }>({});
  const [versions, setVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSemconvFilters, setActiveSemconvFilters] = useState<string[]>(
    []
  );
  const [activeTelemetryFilters, setActiveTelemetryFilters] = useState<
    string[]
  >([]);
  const [activeTargetFilters, setActiveTargetFilters] = useState<string[]>([]);

  useEffect(() => {
    fetch("/instrumentation-explorer/instrumentation-list-enriched.json")
      .then((response) => response.json())
      .then((data) => {
        const versions = Object.keys(data);
        setAllLibraries(data);
        setVersions(versions);
        const defaultVersion = versions.includes("2.17") ? "2.17" : versions[0];
        setSelectedVersion(defaultVersion);
        setLibraries(data[defaultVersion]);
      });
  }, []);

  useEffect(() => {
    if (selectedVersion) {
      setLibraries(allLibraries[selectedVersion]);
    }
  }, [selectedVersion, allLibraries]);

  const handleVersionChange = (version: string) => {
    setSelectedVersion(version);
  };

  const allSemconvTags = Array.from(
    new Set(libraries.flatMap((lib) => lib.semconv || []))
  );
  const allTelemetryTags = Array.from(
    new Set(
      libraries.flatMap((lib) => {
        const tags = [];
        if (lib.telemetry?.some((t) => t.spans?.length)) {
          tags.push("Spans");
        }
        if (lib.telemetry?.some((t) => t.metrics?.length)) {
          tags.push("Metrics");
        }
        return tags;
      })
    )
  );
  const allTargetTags = Array.from(
    new Set(libraries.flatMap((lib) => Object.keys(lib.target_versions || {})))
  );

  const toggleFilter = (
    filter: string,
    activeFilters: string[],
    setActiveFilters: (filters: string[]) => void
  ) => {
    const newFilters = activeFilters.includes(filter)
      ? activeFilters.filter((f) => f !== filter)
      : [...activeFilters, filter];
    setActiveFilters(newFilters);
  };

  const filteredLibraries = libraries.filter((library) => {
    const matchesSearchTerm = library.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSemconvFilters =
      activeSemconvFilters.length > 0
        ? activeSemconvFilters.every((filter) =>
            library.semconv?.includes(filter)
          )
        : true;
    const matchesTelemetryFilters =
      activeTelemetryFilters.length > 0
        ? activeTelemetryFilters.every((filter) => {
            if (filter === "Spans")
              return library.telemetry?.some((t) => t.spans?.length);
            if (filter === "Metrics")
              return library.telemetry?.some((t) => t.metrics?.length);
            return false;
          })
        : true;
    const matchesTargetFilters =
      activeTargetFilters.length > 0
        ? activeTargetFilters.every(
            (filter) =>
              library.target_versions &&
              (library.target_versions[
                filter as keyof typeof library.target_versions
              ]?.length || 0) > 0
          )
        : true;
    return (
      matchesSearchTerm &&
      matchesSemconvFilters &&
      matchesTelemetryFilters &&
      matchesTargetFilters
    );
  });

  return (
    <div className="main-content-wrapper">
      <Header
        onVersionChange={handleVersionChange}
        currentVersion={selectedVersion}
        versions={versions}
      />
      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        allTelemetryTags={allTelemetryTags}
        activeTelemetryFilters={activeTelemetryFilters}
        toggleTelemetryFilter={(tag) =>
          toggleFilter(tag, activeTelemetryFilters, setActiveTelemetryFilters)
        }
        allSemconvTags={allSemconvTags}
        activeSemconvFilters={activeSemconvFilters}
        toggleSemconvFilter={(tag) =>
          toggleFilter(tag, activeSemconvFilters, setActiveSemconvFilters)
        }
        allTargetTags={allTargetTags}
        activeTargetFilters={activeTargetFilters}
        toggleTargetFilter={(tag) =>
          toggleFilter(tag, activeTargetFilters, setActiveTargetFilters)
        }
      />
      <div className="library-list">
        {filteredLibraries.map((library) => (
          <div key={library.name} className="library-card">
            <Link to={`/library/${selectedVersion}/${library.name}`}>
              <h2>{library.name}</h2>
            </Link>
            <div className="target-tags">
              {library.target_versions?.javaagent && (
                <span className="target-tag javaagent">
                  <SmartToyIcon />
                </span>
              )}
              {library.target_versions?.library && (
                <span className="target-tag library">
                  <LocalLibraryIcon />
                </span>
              )}
            </div>
            <TruncatedDescription description={library.description} />
            {library.telemetry && library.semconv && (
              <div className="divider"></div>
            )}

            <div className="library-card-footer">
              {(library.telemetry?.some((t) => t.spans?.length) ||
                library.telemetry?.some((t) => t.metrics?.length)) && (
                <div className="telemetry-tags">
                  <h4>Telemetry</h4>
                  {library.telemetry?.some((t) => t.spans?.length) && (
                    <span className="telemetry-tag spans">Spans</span>
                  )}
                  {library.telemetry?.some((t) => t.metrics?.length) && (
                    <span className="telemetry-tag metrics">Metrics</span>
                  )}
                </div>
              )}
              {library.semconv && library.semconv.length > 0 && (
                <div className="semconv-tags-container">
                  <h4>Semantic Conventions</h4>
                  <div className="semconv-tags">
                    {library.semconv.map((tag) => (
                      <span key={tag} className="semconv-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
