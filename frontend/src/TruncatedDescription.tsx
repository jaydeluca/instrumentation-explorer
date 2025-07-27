
import { useState } from 'react';
import './TruncatedDescription.css';

interface TruncatedDescriptionProps {
  description: string | undefined;
}

const TruncatedDescription = ({ description }: TruncatedDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) {
    return null;
  }

  const needsTruncation = description.length > 180;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const truncatedText = needsTruncation
    ? `${description.substring(0, 180)}...`
    : description;

  return (
    <div className="truncated-description-container">
      <p className="truncated-description-content">
        {isExpanded ? description : truncatedText}
      </p>
      {needsTruncation && (
        <button onClick={toggleExpanded} className="toggle-button">
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

export default TruncatedDescription;
