import React from 'react';
import { Link } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import type { GroupedLibrary, Library, Telemetry } from '../types';
import TruncatedDescription from '../TruncatedDescription';
import './LibraryGroup.css';

interface LibraryGroupProps {
  group: GroupedLibrary;
  selectedVersion: string;
  onToggleExpanded: (displayName: string) => void;
}

const LibraryGroup: React.FC<LibraryGroupProps> = ({
  group,
  selectedVersion,
  onToggleExpanded
}) => {
  const { display_name, libraries, expanded } = group;
  const isMultiLibrary = libraries.length > 1;

  // Aggregate telemetry and target information across all libraries in the group
  const hasSpans = libraries.some(lib => lib.telemetry?.some(t => t.spans?.length));
  const hasMetrics = libraries.some(lib => lib.telemetry?.some(t => t.metrics?.length));
  const hasJavaagent = libraries.some(lib => lib.target_versions?.javaagent);
  const hasLibrary = libraries.some(lib => lib.target_versions?.library);
  
  // Aggregate semantic conventions
  const allSemconv = Array.from(
    new Set(libraries.flatMap(lib => lib.semconv || []))
  );

  // Get primary description (from first library or most descriptive one)
  const primaryDescription = libraries.find(lib => lib.description)?.description || '';

  const handleGroupClick = () => {
    if (isMultiLibrary) {
      onToggleExpanded(display_name);
    }
  };

  const renderLibraryCard = (library: Library, isGrouped = false) => (
    <div key={library.name} className={`library-card ${isGrouped ? 'grouped-library' : ''}`}>
      <Link to={`/library/${selectedVersion}/${library.name}`}>
        <h3 className={isGrouped ? 'grouped-library-title' : 'single-library-title'}>
          {isGrouped ? library.name : display_name}
        </h3>
      </Link>
      
      <div className="target-tags">
        {(isGrouped ? library.target_versions?.javaagent : hasJavaagent) && (
          <span className="target-tag javaagent">
            <SmartToyIcon />
          </span>
        )}
        {(isGrouped ? library.target_versions?.library : hasLibrary) && (
          <span className="target-tag library">
            <LocalLibraryIcon />
          </span>
        )}
      </div>

      <TruncatedDescription 
        description={isGrouped ? library.description : primaryDescription} 
      />

      {((isGrouped ? library.telemetry : (hasSpans || hasMetrics)) || 
        (isGrouped ? library.semconv : allSemconv.length > 0)) && (
        <div className="divider"></div>
      )}

      <div className="library-card-footer">
        {((isGrouped ? 
          (library.telemetry?.some((t: Telemetry) => t.spans?.length) || library.telemetry?.some((t: Telemetry) => t.metrics?.length)) :
          (hasSpans || hasMetrics)
        )) && (
          <div className="telemetry-tags">
            <h4>Telemetry</h4>
            {(isGrouped ? library.telemetry?.some((t: Telemetry) => t.spans?.length) : hasSpans) && (
              <span className="telemetry-tag spans">Spans</span>
            )}
            {(isGrouped ? library.telemetry?.some((t: Telemetry) => t.metrics?.length) : hasMetrics) && (
              <span className="telemetry-tag metrics">Metrics</span>
            )}
          </div>
        )}
        
        {((isGrouped ? (library.semconv?.length ?? 0) > 0 : allSemconv.length > 0)) && (
          <div className="semconv-tags-container">
            <h4>Semantic Conventions</h4>
            <div className="semconv-tags">
              {(isGrouped ? library.semconv || [] : allSemconv).map((tag: string) => (
                <span key={tag} className="semconv-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Single library - render as regular card
  if (!isMultiLibrary) {
    return (
      <div className="library-group single-library">
        {renderLibraryCard(libraries[0])}
      </div>
    );
  }

  // Multiple libraries - render as collapsible group
  return (
    <div className="library-group multi-library">
      <div className="group-header" onClick={handleGroupClick}>
        <div className="group-title-section">
          <h2 className="group-title">
            {display_name}
            <span className="library-count">({libraries.length} libraries)</span>
          </h2>
        </div>
        
        <div className="group-controls">
          <div className="target-tags">
            {hasJavaagent && (
              <span className="target-tag javaagent">
                <SmartToyIcon />
              </span>
            )}
            {hasLibrary && (
              <span className="target-tag library">
                <LocalLibraryIcon />
              </span>
            )}
          </div>
          <button className="expand-button" aria-label={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </button>
        </div>
      </div>

      <div className="group-summary">
        <TruncatedDescription description={primaryDescription} />
        
        {(hasSpans || hasMetrics || allSemconv.length > 0) && (
          <div className="divider"></div>
        )}

        <div className="library-card-footer">
          {(hasSpans || hasMetrics) && (
            <div className="telemetry-tags">
              <h4>Telemetry</h4>
              {hasSpans && <span className="telemetry-tag spans">Spans</span>}
              {hasMetrics && <span className="telemetry-tag metrics">Metrics</span>}
            </div>
          )}
          
          {allSemconv.length > 0 && (
            <div className="semconv-tags-container">
              <h4>Semantic Conventions</h4>
              <div className="semconv-tags">
                {allSemconv.map((tag) => (
                  <span key={tag} className="semconv-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="expanded-libraries">
          <h4 className="expanded-title">Individual Libraries:</h4>
          <div className="grouped-libraries-list">
            {libraries.map(library => renderLibraryCard(library, true))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryGroup;
