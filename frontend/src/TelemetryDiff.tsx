import React, { useState } from 'react';
import type { Library, Metric, Span, Attribute, DiffResult } from './types';
import DiffResults from './DiffResults';
import './TelemetryDiff.css';

interface TelemetryDiffProps {
  versions: string[];
  library: Library | null;
}

const TelemetryDiff: React.FC<TelemetryDiffProps> = ({ versions, library }) => {
  const [baseVersion, setBaseVersion] = useState<string>('');
  const [compareVersion, setCompareVersion] = useState<string>('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);

  const compareAttributes = (baseAttrs: Attribute[], compareAttrs: Attribute[]) => {
    const added: Attribute[] = [];
    const removed: Attribute[] = [];

    const baseAttrMap = new Map(baseAttrs.map(attr => [attr.name, attr]));
    const compareAttrMap = new Map(compareAttrs.map(attr => [attr.name, attr]));

    compareAttrs.forEach(attr => {
      if (!baseAttrMap.has(attr.name)) {
        added.push(attr);
      }
    });

    baseAttrs.forEach(attr => {
      if (!compareAttrMap.has(attr.name)) {
        removed.push(attr);
      }
    });

    return { added, removed };
  };

  const compareTelemetry = (baseLib: Library, compareLib: Library): DiffResult => {
    const added: (Metric | Span)[] = [];
    const removed: (Metric | Span)[] = [];
    const common: DiffResult['common'] = [];

    // Filter for telemetry with when: "default"
    const baseDefaultTelemetry = baseLib.telemetry?.find(t => t.when === "default");
    const compareDefaultTelemetry = compareLib.telemetry?.find(t => t.when === "default");

    const baseMetrics = baseDefaultTelemetry?.metrics || [];
    const compareMetrics = compareDefaultTelemetry?.metrics || [];
    const baseSpans = baseDefaultTelemetry?.spans || [];
    const compareSpans = compareDefaultTelemetry?.spans || [];

    const baseMetricMap = new Map(baseMetrics.map(m => [m.name, m]));
    const compareMetricMap = new Map(compareMetrics.map(m => [m.name, m]));
    const baseSpanMap = new Map(baseSpans.map(s => [s.span_kind, s]));
    const compareSpanMap = new Map(compareSpans.map(s => [s.span_kind, s]));

    // Compare Metrics
    compareMetrics.forEach(metric => {
      if (!baseMetricMap.has(metric.name)) {
        added.push(metric);
      } else {
        const baseMetric = baseMetricMap.get(metric.name)!;
        const attributeDiff = compareAttributes(baseMetric.attributes, metric.attributes);
        if (attributeDiff.added.length > 0 || attributeDiff.removed.length > 0) {
          common.push({
            base: baseMetric,
            compare: metric,
            attributeDiff,
          });
        }
      }
    });

    baseMetrics.forEach(metric => {
      if (!compareMetricMap.has(metric.name)) {
        removed.push(metric);
      }
    });

    // Compare Spans
    compareSpans.forEach(span => {
      if (!baseSpanMap.has(span.span_kind)) {
        added.push(span);
      } else {
        const baseSpan = baseSpanMap.get(span.span_kind)!;
        const attributeDiff = compareAttributes(baseSpan.attributes, span.attributes);
        if (attributeDiff.added.length > 0 || attributeDiff.removed.length > 0) {
          common.push({
            base: baseSpan,
            compare: span,
            attributeDiff,
          });
        }
      }
    });

    baseSpans.forEach(span => {
      if (!compareSpanMap.has(span.span_kind)) {
        removed.push(span);
      }
    });

    return { added, removed, common };
  };

  const handleCompare = async () => {
    if (!baseVersion || !compareVersion || !library) {
      return;
    }

    const response = await fetch('/instrumentation-explorer/instrumentation-list-enriched.json');
    const allData: { [key: string]: Library[] } = await response.json();

    const baseLib = allData[baseVersion]?.find(lib => lib.name === library.name);
    const compareLib = allData[compareVersion]?.find(lib => lib.name === library.name);

    if (baseLib && compareLib) {
      const calculatedDiff = compareTelemetry(baseLib, compareLib);
      setDiffResult(calculatedDiff);
    } else {
      setDiffResult(null);
      console.error("Could not find library data for one or both versions.");
    }
  };

  if (!library) {
    return null;
  }

  return (
    <div className="telemetry-diff">
      <h3>Telemetry Version Diff</h3>
      <div className="diff-controls">
        <div className="version-selector">
          <label htmlFor="base-version-select">Base Version:</label>
          <select id="base-version-select" value={baseVersion} onChange={(e) => {
              setBaseVersion(e.target.value);
            }}>
            <option value="">Select Version</option>
            {versions.map(version => (
              <option key={`base-${version}`} value={version}>{version}</option>
            ))}
          </select>
        </div>
        <div className="version-selector">
          <label htmlFor="compare-version-select">Compare Version:</label>
          <select id="compare-version-select" value={compareVersion} onChange={(e) => {
              setCompareVersion(e.target.value);
            }}>
            <option value="">Select Version</option>
            {versions.map(version => (
              <option key={`compare-${version}`} value={version}>{version}</option>
            ))}
          </select>
        </div>
        <button onClick={handleCompare} disabled={!baseVersion || !compareVersion}>Compare</button>
      </div>
      <div className="diff-results">
        {baseVersion && compareVersion && (
          <DiffResults diff={diffResult} baseVersion={baseVersion} compareVersion={compareVersion} />
        )}
      </div>
    </div>
  );
};

export default TelemetryDiff;