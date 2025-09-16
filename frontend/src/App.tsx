import { useEffect, useState, useCallback, useLayoutEffect } from "react";
import "./App.css";
import SearchAndFilter from "./SearchAndFilter";
import type { Library, LibraryGroups } from "./types";
import { getDefaultVersion, sortVersionsDescending } from "./utils/versionUtils";
import { 
  groupLibrariesByDisplayName, 
  groupMatchesSearch
} from "./utils/displayNameUtils";

import Header from "./components/Header";
import LibraryGroup from "./components/LibraryGroup";

function App() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [allLibraries, setAllLibraries] = useState<{
    [key: string]: Library[];
  }>({});
  const [libraryGroups, setLibraryGroups] = useState<LibraryGroups>({});
  const [versions, setVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState("");
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
        const sortedVersions = sortVersionsDescending(versions);
        setAllLibraries(data);
        setVersions(sortedVersions);
        const defaultVersion = getDefaultVersion(versions);
        if (defaultVersion) {
          setSelectedVersion(defaultVersion);
          setLibraries(data[defaultVersion]);
        }
      });
  }, []);

  useEffect(() => {
    if (selectedVersion && allLibraries[selectedVersion]) {
      const versionLibraries = allLibraries[selectedVersion];
      setLibraries(versionLibraries);
      const groups = groupLibrariesByDisplayName(versionLibraries);
      setLibraryGroups(groups);
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

  const handleToggleExpanded = (displayName: string) => {
    setLibraryGroups(prev => ({
      ...prev,
      [displayName]: {
        ...prev[displayName],
        expanded: !prev[displayName].expanded
      }
    }));
  };

  // Function to equalize heights of collapsed library groups
  const equalizeCollapsedHeights = useCallback(() => {
    const libraryList = document.querySelector('.library-list') as HTMLElement;
    if (!libraryList) return;

    const libraryGroups = libraryList.querySelectorAll('.library-group') as NodeListOf<HTMLElement>;
    
    // Reset all heights first
    libraryGroups.forEach(group => {
      group.style.height = 'auto';
    });

    // Group elements by row (based on their top position)
    const rows: HTMLElement[][] = [];
    const groupPositions = Array.from(libraryGroups).map(group => ({
      element: group,
      top: group.getBoundingClientRect().top
    }));

    groupPositions.forEach(({ element, top }) => {
      const existingRow = rows.find(row => 
        Math.abs(row[0].getBoundingClientRect().top - top) < 5
      );
      
      if (existingRow) {
        existingRow.push(element);
      } else {
        rows.push([element]);
      }
    });

    // For each row, equalize heights only if no items are expanded
    rows.forEach(row => {
      const hasExpandedItem = row.some(element => 
        element.querySelector('.expanded-libraries') !== null
      );

      if (!hasExpandedItem && row.length > 1) {
        // Get the natural height of each collapsed item
        const heights = row.map(element => {
          const rect = element.getBoundingClientRect();
          return rect.height;
        });
        
        const maxHeight = Math.max(...heights);
        
        // Apply the max height to all items in the row
        row.forEach(element => {
          element.style.height = `${maxHeight}px`;
        });
      }
    });
  }, []);

  // Run height equalization after layout changes
  useLayoutEffect(() => {
    const timeoutId = setTimeout(equalizeCollapsedHeights, 0);
    return () => clearTimeout(timeoutId);
  }, [libraryGroups, equalizeCollapsedHeights]);

  // Also run on window resize
  useEffect(() => {
    const handleResize = () => {
      equalizeCollapsedHeights();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [equalizeCollapsedHeights]);

  // Filter groups based on search and filters
  const filteredGroups = Object.values(libraryGroups).filter((group) => {
    // Check if group matches search
    if (!groupMatchesSearch(group, searchTerm)) {
      return false;
    }

    // Check if any library in the group matches filters
    const matchingLibraries = group.libraries.filter((library) => {
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
        matchesSemconvFilters &&
        matchesTelemetryFilters &&
        matchesTargetFilters
      );
    });

    return matchingLibraries.length > 0;
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
        {filteredGroups.map((group) => (
          <LibraryGroup
            key={group.display_name}
            group={group}
            selectedVersion={selectedVersion}
            onToggleExpanded={handleToggleExpanded}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
