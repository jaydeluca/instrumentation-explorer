import React from 'react';
import type { Metric, Span } from './types';

interface CombinedTelemetryDisplayProps {
  metrics: (Metric & { sourceInstrumentation: string })[];
  spans: (Span & { sourceInstrumentation: string })[];
}

const CombinedTelemetryDisplay: React.FC<CombinedTelemetryDisplayProps> = ({ metrics, spans }) => {
  return (
    <div className="combined-telemetry-display">
      {metrics.length > 0 && (
        <div className="metrics-section">
          <h5>Metrics</h5>
          <ul>
            {metrics.map((metric, index) => (
              <li key={index}>
                <span className="telemetry-source-label">From: {metric.sourceInstrumentation}</span>
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

      {spans.length > 0 && (
        <div className="spans-section">
          <h5>Spans</h5>
          <ul>
            {spans.map((span, index) => (
              <li key={index}>
                <span className="telemetry-source-label">From: {span.sourceInstrumentation}</span>
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
  );
};

export default CombinedTelemetryDisplay;
