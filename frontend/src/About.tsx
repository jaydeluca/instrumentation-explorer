import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header';
import './About.css';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';


const About: React.FC = () => {
  const navigate = useNavigate();
  const [versions, setVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  

  useEffect(() => {
    fetch('/instrumentation-explorer/instrumentation-list-enriched.json')
      .then(response => response.json())
      .then(data => {
        const versions = Object.keys(data);
        
        setVersions(versions);
        const defaultVersion = versions.includes('2.17') ? '2.17' : versions[0];
        setSelectedVersion(defaultVersion);
      });
  }, []);

  const handleVersionChange = (version: string) => {
    setSelectedVersion(version);
    navigate(`/?version=${version}`); // Navigate to main page with selected version
  };

  return (
    <div className="main-content-wrapper">
      <Header
        onVersionChange={handleVersionChange}
        currentVersion={selectedVersion}
        versions={versions}
      />
      <div className="about-page">
        <h1>About</h1>
        <p>
          This project is a work in progress proof of concept for a web-based tool designed to explore and display information
          about Java instrumentation libraries. The goal is to provide a searchable and filterable interface
          for understanding the capabilities of each library, including the telemetry data they generate (metrics and spans)
          and their adherence to semantic conventions.
        </p>
        <p>
          The OpenTelemetry project related to generating and maintaining the underlying metadata that powers this tool
          is being tracked <a href="https://github.com/orgs/open-telemetry/projects/153?query=sort%3Aupdated-desc+is%3Aopen&pane=info" target="new">
          here</a>.
        </p>
        <h2>Key Features</h2>
        <ul>
          <li><CheckCircleOutlineIcon style={{ fontSize: '1.2em', verticalAlign: 'middle', marginRight: '5px' }} />Display list of available instrumentation libraries with the ability to search and filter by various criteria.</li>
          <li><CheckCircleOutlineIcon style={{ fontSize: '1.2em', verticalAlign: 'middle', marginRight: '5px' }} />Detailed view for each library, including configuration options, telemetry data, and adherence to semantic conventions.</li>
          <li><CheckCircleOutlineIcon style={{ fontSize: '1.2em', verticalAlign: 'middle', marginRight: '5px' }} />Telemetry version diff tool to highlight differences between java agent versions.</li>
        </ul>
        <p>
          The code for this UI can be found <a href="https://github.com/jaydeluca/instrumentation-explorer">here</a>.
        </p>
      </div>
    </div>
  );
};

export default About;
