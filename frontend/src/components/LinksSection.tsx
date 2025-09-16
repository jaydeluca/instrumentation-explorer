import React from 'react';
import LinkIcon from '@mui/icons-material/Link';
import GitHubIcon from '@mui/icons-material/GitHub';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import type { Library } from '../types';
import { generateRepositoryLink, generateJavaDocLink } from '../utils/displayNameUtils';
import './LinksSection.css';

interface LinksSectionProps {
  library: Library;
}

const LinksSection: React.FC<LinksSectionProps> = ({ library }) => {
  const repositoryLink = generateRepositoryLink(library);
  const javaDocLink = generateJavaDocLink(library);

  // Don't render if no links are available
  if (!library.library_link && !repositoryLink && !javaDocLink) {
    return null;
  }

  return (
    <div className="links-section">
      <h3>Links</h3>
      <div className="links-container">
        {library.library_link && (
          <a
            href={library.library_link}
            target="_blank"
            rel="noopener noreferrer"
            className="link-item library-documentation"
          >
            <LinkIcon />
            <span>Library Documentation</span>
          </a>
        )}
        
        {repositoryLink && (
          <a
            href={repositoryLink}
            target="_blank"
            rel="noopener noreferrer"
            className="link-item repository"
          >
            <GitHubIcon />
            <span>Instrumentation Source</span>
          </a>
        )}
        
        {javaDocLink && (
          <a
            href={javaDocLink}
            target="_blank"
            rel="noopener noreferrer"
            className="link-item javadoc"
          >
            <MenuBookIcon />
            <span>JavaDoc</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default LinksSection;
