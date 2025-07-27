import React from 'react';

const Disclaimer: React.FC = () => {
  return (
    <div className="disclaimer-box">
      <p>
          Disclaimer: This is a work in progress proof of concept related to <a href="https://github.com/open-telemetry/opentelemetry-java-instrumentation/issues/13468" target="_blank" rel="noopener noreferrer">this GitHub issue/project</a>. The data may be incomplete and is unverified.
      </p>
    </div>
  );
};

export default Disclaimer;
