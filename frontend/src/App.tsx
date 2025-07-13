import { useState } from 'react';
import './App.css';
import data from './instrumentation-list-enriched.json';
import type { Library } from './types';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSemconvFilter, setActiveSemconvFilter] = useState<string | null>(null);
  const libraries: Library[] = data;

  const allSemconvTags = Array.from(new Set(libraries.flatMap(lib => lib.semconv || [])));

  const filteredLibraries = libraries.filter((library) => {
    const matchesSearchTerm = library.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemconvFilter = activeSemconvFilter ? library.semconv?.includes(activeSemconvFilter) : true;
    return matchesSearchTerm && matchesSemconvFilter;
  });

  return (
    <div className="App">
      <h1>Instrumentation Libraries</h1>
      <input
        type="text"
        placeholder="Search by name..."
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar"
      />
      <div className="filter-buttons">
        {allSemconvTags.map(tag => (
          <button
            key={tag}
            className={activeSemconvFilter === tag ? 'active' : ''}
            onClick={() => setActiveSemconvFilter(activeSemconvFilter === tag ? null : tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="library-list">
        {filteredLibraries.map((library) => (
          <div key={library.name} className="library-card">
            <a href={`/library/${library.name}`}>
              <h2>{library.name}</h2>
            </a>
            <p style={{ flexGrow: 1 }}>{library.description}</p>
            {library.semconv && library.semconv.length > 0 && (
              <div className="semconv-tags">
                {library.semconv.map((tag) => (
                  <span key={tag} className="semconv-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
