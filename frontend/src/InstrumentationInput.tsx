import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface InstrumentationInputProps {
  onAnalyze: (instrumentations: string[]) => void;
  selectedVersion: string;
}

const InstrumentationInput: React.FC<InstrumentationInputProps> = ({ onAnalyze, selectedVersion }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const encodedInstrumentations = params.get('instrumentations');

    if (encodedInstrumentations) {
      try {
        const decoded = atob(encodedInstrumentations);
        setInputValue(decoded);
        onAnalyze(decoded.split(',').map(s => s.trim()).filter(s => s.length > 0));
      } catch (e) {
        console.error("Failed to decode base64 instrumentation list:", e);
        // Fallback to showing the text input if decoding fails
      }
    }
  }, [location.search, onAnalyze]);

  const handleAnalyzeClick = () => {
    const instrumentationsArray = inputValue.split(',').map(s => s.trim()).filter(s => s.length > 0);
    onAnalyze(instrumentationsArray);

    // Update the URL query parameter
    const encoded = btoa(instrumentationsArray.join(','));
    navigate(`?instrumentations=${encoded}&version=${selectedVersion}`, { replace: true });
  };

  return (
    <div className="instrumentation-input">
      <p>Enter a comma-separated list of instrumentation names (e.g., `clickhouse-client-0.5,activej-http-6.0`):</p>
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        rows={5}
        cols={50}
        placeholder="Instrumentation names..."
      />
      <button onClick={handleAnalyzeClick}>Analyze</button>
    </div>
  );
};

export default InstrumentationInput;
