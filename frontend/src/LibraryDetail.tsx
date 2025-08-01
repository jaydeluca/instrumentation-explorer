import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './LibraryDetail.css';
import type { Library } from './types';
import TelemetryDiff from './TelemetryDiff';
import Header from './components/Header'; // Import the new Header component

function LibraryDetail() {
  const { libraryName, version } = useParams();
  const navigate = useNavigate();
  const [library, setLibrary] = useState<Library | null>(null);
  const [activeTelemetryWhen, setActiveTelemetryWhen] = useState<string | null>(null);
  const [versions, setVersions] = useState<string[]>([]);
  
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(version);

  useEffect(() => {
    fetch('/instrumentation-explorer/instrumentation-list-enriched.json')
      .then(response => response.json())
      .then(data => {
        
        setVersions(Object.keys(data));
        if (selectedVersion && data[selectedVersion]) {
          const foundLibrary = data[selectedVersion].find((lib: Library) => lib.name === libraryName);
          setLibrary(foundLibrary);
        }
      });
  }, [libraryName, selectedVersion]);

  const handleVersionChange = (newVersion: string) => {
    setSelectedVersion(newVersion);
    navigate(`/library/${newVersion}/${libraryName}`);
  };

  useEffect(() => {
    if (library && library.telemetry && library.telemetry.length > 0 && activeTelemetryWhen === null) {
      setActiveTelemetryWhen(library.telemetry[0].when);
    }
  }, [library, activeTelemetryWhen]);

  if (!library) {
    return <div>Library not found.</div>;
  }

  const filteredTelemetry = library.telemetry?.filter(
    (item) => item.when === activeTelemetryWhen
  );

  return (
    <div className="main-content-wrapper">
      <Header
        onVersionChange={handleVersionChange}
        currentVersion={selectedVersion || ''}
        versions={versions}
      />
      <div className="library-detail library-card">
        <h1>{library.name}</h1>
        {library.description && <p>{library.description}</p>}
        {library.technology && <p><strong>Technology:</strong> {library.technology}</p>}
        {library.type && <p><strong>Type:</strong> {library.type}</p>}
        {library.maturity && <p><strong>Maturity:</strong> {library.maturity}</p>}
        {library.links && (
          <div className="links-section">
            <h3>Links:</h3>
            <ul>
              {Object.entries(library.links).map(([key, value]) => (
                <li key={key}><a href={value as string} target="_blank" rel="noopener noreferrer">{key}</a></li>
              ))}
            </ul>
          </div>
        )}
        {library.notes && <p><strong>Notes:</strong> {library.notes}</p>}
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
                    <td>{config.name}</td>
                    <td>{config.description}</td>
                    <td>{config.type}</td>
                    <td>{String(config.default)}</td>
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
              {library.target_versions.javaagent && library.target_versions.javaagent.length > 0 && (
                <div className="target-version-section">
                  <h4 style={{ padding: '10px 0', margin: '10px 0' }}>Javaagent:</h4>
                  <ul>
                    {library.target_versions.javaagent.map((version, index) => (
                      <li key={index}>{version}</li>
                    ))}
                  </ul>
                </div>
              )}
              {library.target_versions.library && library.target_versions.library.length > 0 && (
                <div className="target-version-section">
                  <h4>Library:</h4>
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
                  className={activeTelemetryWhen === item.when ? 'active' : ''}
                  onClick={() => setActiveTelemetryWhen(item.when)}
                >
                  {item.when}
                </button>
              ))}
            </div>
            {filteredTelemetry && filteredTelemetry.length > 0 && filteredTelemetry.map((telemetryItem, index) => (
              <div key={index} className="telemetry-content">
                {telemetryItem.metrics && telemetryItem.metrics.length > 0 && (
                  <div className="telemetry-section metrics-section">
                    <h5>Metrics</h5>
                    <ul>
                      {telemetryItem.metrics.map((metric, metricIndex) => (
                        <li key={metricIndex}>
                          <div className="metric-header">
                            <strong className="metric-name">{metric.name}</strong>
                            {metric.semconv && <span className="semconv-check">✅</span>}
                          </div>
                          <div className="metric-details">
                            <div><strong>Type:</strong> {metric.type}</div>
                            <div><strong>Unit:</strong> {metric.unit}</div>
                            <div className="metric-description"><strong>Description:</strong> {metric.description}</div>
                          </div>
                          {metric.attributes && metric.attributes.length > 0 && (
                            <div className="attributes-section">
                              <h6>Attributes</h6>
                              <ul className="attributes-list">
                                {metric.attributes.map((attr, attrIndex) => (
                                  <li key={attrIndex} className="attribute-item">
                                    <div><span>{attr.name}</span> <span>({attr.type})</span></div>
                                    {attr.semconv && <span className="semconv-check">✅</span>}
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
                {telemetryItem.spans && telemetryItem.spans.length > 0 && (
                  <div className="telemetry-section spans-section">
                    <h5>Spans</h5>
                    <ul>
                      {telemetryItem.spans.map((span, spanIndex) => (
                        <li key={spanIndex}>
                          <div className="span-header">
                            <strong className="span-kind">Kind:&nbsp;</strong> {span.span_kind}
                          </div>
                          {span.attributes && span.attributes.length > 0 && (
                            <div className="attributes-section">
                              <h6>Attributes</h6>
                              <ul className="attributes-list">
                                {span.attributes.map((attr, attrIndex) => (
                                  <li key={attrIndex} className="attribute-item">
                                    <div><span>{attr.name}</span> <span>({attr.type})</span></div>
                                    {attr.semconv && <span className="semconv-check">✅</span>}
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
      </div>
    </div>
  );
}

export default LibraryDetail;
