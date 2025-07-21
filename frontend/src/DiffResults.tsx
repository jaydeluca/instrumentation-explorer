import React from 'react';
import type { DiffResult, Metric, Span, Attribute } from './types';
import './DiffResults.css';

interface DiffResultsProps {
  diff: DiffResult | null;
  baseVersion: string;
  compareVersion: string;
}

const DiffResults: React.FC<DiffResultsProps> = ({ diff, baseVersion, compareVersion }) => {
  console.log("DiffResults props received:", { diff, baseVersion, compareVersion });
  if (!diff) {
    return null;
  }

  const renderAttribute = (attr: Attribute, type: 'added' | 'removed' | 'common') => (
    <li key={attr.name} className={`attribute-item ${type}`}>
      <div><span className="attribute-name">{attr.name}</span> <span className="attribute-type">({attr.type})</span></div>
      {attr.semconv && <span className="semconv-check">✅</span>}
    </li>
  );

  const renderMetric = (metric: Metric, type: 'added' | 'removed' | 'common', attributesToHighlight?: { added: Attribute[], removed: Attribute[] }) => (
    <div className={`telemetry-item ${type}`}>
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
            {metric.attributes.map(attr => {
              const isAdded = attributesToHighlight?.added.some(a => a.name === attr.name);
              const isRemoved = attributesToHighlight?.removed.some(a => a.name === attr.name);
              let attrType: 'added' | 'removed' | 'common' = 'common';
              if (isAdded) attrType = 'added';
              if (isRemoved) attrType = 'removed';
              return renderAttribute(attr, attrType);
            })}
          </ul>
        </div>
      )}
    </div>
  );

  const renderSpan = (span: Span, type: 'added' | 'removed' | 'common', attributesToHighlight?: { added: Attribute[], removed: Attribute[] }) => (
    <div className={`telemetry-item ${type}`}>
      <div className="span-header">
        <strong className="span-kind">Kind:&nbsp;</strong> {span.span_kind}
      </div>
      {span.attributes && span.attributes.length > 0 && (
        <div className="attributes-section">
          <h6>Attributes</h6>
          <ul className="attributes-list">
            {span.attributes.map(attr => {
              const isAdded = attributesToHighlight?.added.some(a => a.name === attr.name);
              const isRemoved = attributesToHighlight?.removed.some(a => a.name === attr.name);
              let attrType: 'added' | 'removed' | 'common' = 'common';
              if (isAdded) attrType = 'added';
              if (isRemoved) attrType = 'removed';
              return renderAttribute(attr, attrType);
            })}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="diff-results-container">
      <h3>Telemetry Differences</h3>
      <div className="diff-sections">
        <div className="diff-section">
          <h4>Added</h4>
          {diff.added.filter(item => 'description' in item).length > 0 && (
            <>
              <h5>Metrics</h5>
              {diff.added.filter(item => 'description' in item).map(item => renderMetric(item as Metric, 'added'))}
            </>
          )}
          {diff.added.filter(item => !('description' in item)).length > 0 && (
            <>
              <h5>Spans</h5>
              {diff.added.filter(item => !('description' in item)).map(item => renderSpan(item as Span, 'added'))}
            </>
          )}
        </div>
        <div className="diff-section">
          <h4>Removed</h4>
          {diff.removed.filter(item => 'description' in item).length > 0 && (
            <>
              <h5>Metrics</h5>
              {diff.removed.filter(item => 'description' in item).map(item => renderMetric(item as Metric, 'removed'))}
            </>
          )}
          {diff.removed.filter(item => !('description' in item)).length > 0 && (
            <>
              <h5>Spans</h5>
              {diff.removed.filter(item => !('description' in item)).map(item => renderSpan(item as Span, 'removed'))}
            </>
          )}
        </div>
      </div>

      <h3>Common Telemetry with Attribute Changes</h3>
      <div className="diff-sections">
        <div className="diff-section">
          <h4>Base Version ({baseVersion})</h4>
          {diff.common.filter(item => 'description' in item.base).length > 0 && (
            <>
              <h5>Metrics</h5>
              {diff.common.filter(item => 'description' in item.base).map(item => renderMetric(item.base as Metric, 'common', item.attributeDiff))}
            </>
          )}
          {diff.common.filter(item => !('description' in item.base)).length > 0 && (
            <>
              <h5>Spans</h5>
              {diff.common.filter(item => !('description' in item.base)).map(item => renderSpan(item.base as Span, 'common', item.attributeDiff))}
            </>
          )}
        </div>
        <div className="diff-section">
          <h4>Compare Version ({compareVersion})</h4>
          {diff.common.filter(item => 'description' in item.compare).length > 0 && (
            <>
              <h5>Metrics</h5>
              {diff.common.filter(item => 'description' in item.compare).map(item => renderMetric(item.compare as Metric, 'common', item.attributeDiff))}
            </>
          )}
          {diff.common.filter(item => !('description' in item.compare)).length > 0 && (
            <>
              <h5>Spans</h5>
              {diff.common.filter(item => !('description' in item.compare)).map(item => renderSpan(item.compare as Span, 'common', item.attributeDiff))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiffResults;
