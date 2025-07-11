import { useState } from 'react';
import './App.css';
import data from './instrumentation-list.json';
import type { Library, InstrumentationData } from './types';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const typedData: InstrumentationData = data;
  const libraries: Library[] = Object.values(typedData.libraries).flat();

  const filteredLibraries = libraries.filter((library) =>
    library.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="App">
      <h1>Instrumentation Libraries</h1>
      <input
        type="text"
        placeholder="Search by name..."
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="library-list">
        {filteredLibraries.map((library) => (
          <div key={library.name} className="library-card">
            <a href={`/library/${library.name}`}>
              <h2>{library.name}</h2>
            </a>
            <p style={{ flexGrow: 1 }}>{library.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
