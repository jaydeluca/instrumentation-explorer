import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "./LibraryDetail.css";
import TelemetryDiff from "./TelemetryDiff";
import Header from "./components/Header";
import LinksSection from "./components/LinksSection";
import type { Library } from "./types";
import { sortVersionsDescending } from "./utils/versionUtils";
import { getEffectiveDisplayName } from "./utils/displayNameUtils";
import { loadVersions, loadInstrumentationByIdAndVersion, loadMarkdown } from "./utils/dataLoader";
import { convertV2ToV1Library } from "./utils/dataAdapter";

function LibraryDetail() {
  const { libraryName, version } = useParams();
  const navigate = useNavigate();
  const [library, setLibrary] = useState<Library | null>(null);
  const [activeTelemetryWhen, setActiveTelemetryWhen] = useState<string | null>(
    null
  );
  const [versions, setVersions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"details" | "standalone">("details");
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [markdownLoading, setMarkdownLoading] = useState(false);

  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(
    version
  );

  useEffect(() => {
    async function loadData() {
      try {
        const versionsData = await loadVersions();
        const versionList = versionsData.versions.map(v => v.version);
        const sortedVersions = sortVersionsDescending(versionList);
        setVersions(sortedVersions);
        
        if (selectedVersion && libraryName) {
          const instrumentationData = await loadInstrumentationByIdAndVersion(libraryName, selectedVersion);
          const v1Library = convertV2ToV1Library(instrumentationData);
          setLibrary(v1Library);
          
          // Reset markdown content when library changes
          setMarkdownContent(null);
        }
      } catch (error) {
        console.error("Failed to load library:", error);
        setLibrary(null);
      }
    }
    
    loadData();
  }, [libraryName, selectedVersion]);

  // Load markdown content lazily when switching to standalone tab
  useEffect(() => {
    async function loadMarkdownContent() {
      if (activeTab === "standalone" && library?.markdown_hash && !markdownContent && !markdownLoading) {
        setMarkdownLoading(true);
        try {
          const content = await loadMarkdown(library.markdown_hash);
          setMarkdownContent(content);
        } catch (error) {
          console.error("Failed to load markdown:", error);
          setMarkdownContent(null);
        } finally {
          setMarkdownLoading(false);
        }
      }
    }
    
    loadMarkdownContent();
  }, [activeTab, library?.markdown_hash, markdownContent, markdownLoading]);

  const handleVersionChange = (newVersion: string) => {
    setSelectedVersion(newVersion);
    navigate(`/library/${newVersion}/${libraryName}`);
  };

  useEffect(() => {
    if (
      library &&
      library.telemetry &&
      library.telemetry.length > 0 &&
      activeTelemetryWhen === null
    ) {
      setActiveTelemetryWhen(library.telemetry[0].when);
    }
  }, [library, activeTelemetryWhen]);

  if (!library) {
    return <div>Library not found.</div>;
  }

  const filteredTelemetry = library.telemetry?.filter(
    (item) => item.when === activeTelemetryWhen
  );

  const renderDetailsTab = () => (
    <>
      {library.configurations && library.configurations.length > 0 && (
        <div className="configurations-section">
          <h3>Configurations:</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Type</th>
                <th>Default</th>
              </tr>
            </thead>
            <tbody>
              {library.configurations.map((config) => (
                <tr key={config.name}>
                  <td data-label="Name">{config.name}</td>
                  <td data-label="Description">{config.description}</td>
                  <td data-label="Type">{config.type}</td>
                  <td data-label="Default">{String(config.default)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {library.target_versions && (
        <div className="target-versions-main-section">
          <h3>Target Versions:</h3>
          <div className="target-versions-container">
            {library.target_versions.javaagent &&
              library.target_versions.javaagent.length > 0 && (
                <div className="target-version-section">
                  <h4 style={{ padding: "10px 0", margin: "10px 0" }}>
                    Javaagent:
                  </h4>
                  <ul>
                    {library.target_versions.javaagent.map(
                      (version, index) => (
                        <li key={index}>{version}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            {library.target_versions.library &&
              library.target_versions.library.length > 0 && (
                <div className="target-version-section">
                  <h4>Standalone Library:</h4>
                  <ul>
                    {library.target_versions.library.map((version, index) => (
                      <li key={index}>{version}</li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>
      )}
      {library.telemetry && library.telemetry.length > 0 && (
        <div className="telemetry-main-section">
          <h3>Telemetry:</h3>
          <div className="semconv-key">
            <span className="semconv-check">✅</span> = Semantic Conventions
          </div>
          <div className="telemetry-tabs">
            {library.telemetry.map((item) => (
              <button
                key={item.when}
                className={activeTelemetryWhen === item.when ? "active" : ""}
                onClick={() => setActiveTelemetryWhen(item.when)}
              >
                {item.when}
              </button>
            ))}
          </div>
          {filteredTelemetry &&
            filteredTelemetry.length > 0 &&
            filteredTelemetry.map((telemetryItem, index) => (
              <div key={index} className="telemetry-content">
                {telemetryItem.metrics &&
                  telemetryItem.metrics.length > 0 && (
                    <div className="telemetry-section metrics-section">
                      <h5>Metrics</h5>
                      <ul>
                        {telemetryItem.metrics.map((metric, metricIndex) => (
                          <li key={metricIndex}>
                            <div className="metric-header">
                              <strong className="metric-name">
                                {metric.name}
                              </strong>
                              {metric.semconv && (
                                <span className="semconv-check">✅</span>
                              )}
                            </div>
                            <div className="metric-details">
                              <div>
                                <strong>Type:</strong> {metric.type}
                              </div>
                              <div>
                                <strong>Unit:</strong> {metric.unit}
                              </div>
                              <div className="metric-description">
                                <strong>Description:</strong>{" "}
                                {metric.description}
                              </div>
                            </div>
                            {metric.attributes &&
                              metric.attributes.length > 0 && (
                                <div className="attributes-section">
                                  <h6>Attributes</h6>
                                  <ul className="attributes-list">
                                    {metric.attributes.map(
                                      (attr, attrIndex) => (
                                        <li
                                          key={attrIndex}
                                          className="attribute-item"
                                        >
                                          <div>
                                            <span>{attr.name}</span>{" "}
                                            <span>({attr.type})</span>
                                          </div>
                                          {attr.semconv && (
                                            <span className="semconv-check">
                                              ✅
                                            </span>
                                          )}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {telemetryItem.spans && telemetryItem.spans.length > 0 && (
                  <div className="telemetry-section spans-section">
                    <h5>Spans</h5>
                    <ul>
                      {telemetryItem.spans.map((span, spanIndex) => (
                        <li key={spanIndex}>
                          <div className="span-header">
                            <strong className="span-kind">Kind:&nbsp;</strong>{" "}
                            {span.span_kind}
                          </div>
                          {span.attributes && span.attributes.length > 0 && (
                            <div className="attributes-section">
                              <h6>Attributes</h6>
                              <ul className="attributes-list">
                                {span.attributes.map((attr, attrIndex) => (
                                  <li
                                    key={attrIndex}
                                    className="attribute-item"
                                  >
                                    <div>
                                      <span>{attr.name}</span>{" "}
                                      <span>({attr.type})</span>
                                    </div>
                                    {attr.semconv && (
                                      <span className="semconv-check">
                                        ✅
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
      <TelemetryDiff versions={versions} library={library} />
    </>
  );

  return (
    <div className="main-content-wrapper">
      <Header
        onVersionChange={handleVersionChange}
        currentVersion={selectedVersion || ""}
        versions={versions}
      />
      <div className="library-detail library-card">
        <div className="library-header">
          <div className="library-title-section">
            <h1>{getEffectiveDisplayName(library)}</h1>
            {library.display_name && library.display_name !== library.name && (
              <p className="library-raw-name">
                <span className="raw-name-label">Instrumentation Name:</span> 
                <code>{library.name}</code>
              </p>
            )}
          </div>
        </div>
        
        {library.description && <p className="library-description">{library.description}</p>}
        
        <LinksSection library={library} />
        
        {/* Tab Navigation - only show when there's markdown content */}
        {library.markdown_hash && (
          <div className="tab-navigation">
            <button 
              className={activeTab === "details" ? "tab-button active" : "tab-button"}
              onClick={() => setActiveTab("details")}
            >
              Details
            </button>
            <button 
              className={activeTab === "standalone" ? "tab-button active" : "tab-button"}
              onClick={() => setActiveTab("standalone")}
            >
              Standalone Library
            </button>
          </div>
        )}

        {/* Tab Content */}
        {library.markdown_hash ? (
          <>
            {activeTab === "details" && (
              <div className="tab-content">{renderDetailsTab()}</div>
            )}
            
            {activeTab === "standalone" && (
              <div className="tab-content">
                {markdownLoading && <div>Loading...</div>}
                {!markdownLoading && markdownContent && (
                  <ReactMarkdown>{markdownContent}</ReactMarkdown>
                )}
                {!markdownLoading && !markdownContent && (
                  <div>Failed to load content</div>
                )}
              </div>
            )}
          </>
        ) : (
          /* No tabs needed - just show details directly */
          renderDetailsTab()
        )}
      </div>
    </div>
  );
}

export default LibraryDetail;
