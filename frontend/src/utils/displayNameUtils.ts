import type { Library, GroupedLibrary, LibraryGroups } from '../types';

/**
 * Enhanced display name generation utility with edge case handling
 * Algorithm: Remove version suffixes → Replace dashes with spaces → Title case
 */
export function generateDisplayName(libraryName: string): string {
  if (!libraryName || typeof libraryName !== 'string') {
    return 'Unknown Library';
  }

  try {
    // Remove version suffixes (e.g., -2.3, -1.0, -10.5, -2.0.1)
    const nameWithoutVersion = libraryName.replace(/-\d+(\.\d+)*(\.\d+)*$/, '');
    
    // Handle empty string after version removal
    if (!nameWithoutVersion) {
      return libraryName.charAt(0).toUpperCase() + libraryName.slice(1);
    }
    
    // Replace dashes with spaces and title case each word
    return nameWithoutVersion
      .split('-')
      .filter(word => word.length > 0) // Remove empty strings
      .map(word => {
        // Handle special cases for common abbreviations
        const upperWord = word.toUpperCase();
        if (['HTTP', 'HTTPS', 'SQL', 'JMS', 'RPC', 'AWS', 'API', 'URL', 'URI', 'TCP', 'UDP'].includes(upperWord)) {
          return upperWord;
        }
        
        // Regular title case
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  } catch (error) {
    console.warn(`Error generating display name for "${libraryName}":`, error);
    // Fallback: just capitalize first letter
    return libraryName.charAt(0).toUpperCase() + libraryName.slice(1);
  }
}

/**
 * Get the effective display name for a library
 * Uses explicit display_name if available, otherwise generates one
 */
export function getEffectiveDisplayName(library: Library): string {
  return library.display_name || generateDisplayName(library.name);
}

/**
 * Group libraries by their effective display names
 */
export function groupLibrariesByDisplayName(libraries: Library[]): LibraryGroups {
  const groups: LibraryGroups = {};
  
  for (const library of libraries) {
    const displayName = getEffectiveDisplayName(library);
    
    if (!groups[displayName]) {
      groups[displayName] = {
        display_name: displayName,
        library_link: library.library_link, // Use the first library's link
        libraries: [],
        expanded: false
      };
    }
    
    groups[displayName].libraries.push(library);
    
    // If any library in the group has a library_link, use it
    if (library.library_link && !groups[displayName].library_link) {
      groups[displayName].library_link = library.library_link;
    }
  }
  
  return groups;
}

/**
 * Get all libraries from grouped structure (flattened)
 */
export function getFlatLibrariesFromGroups(groups: LibraryGroups): Library[] {
  return Object.values(groups).flatMap(group => group.libraries);
}

/**
 * Check if a library matches search criteria (name or display name)
 */
export function libraryMatchesSearch(library: Library, searchTerm: string): boolean {
  if (!searchTerm) return true;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  const displayName = getEffectiveDisplayName(library);
  
  return (
    library.name.toLowerCase().includes(lowerSearchTerm) ||
    displayName.toLowerCase().includes(lowerSearchTerm) ||
    (library.description?.toLowerCase().includes(lowerSearchTerm) ?? false)
  );
}

/**
 * Check if any library in a group matches search criteria
 */
export function groupMatchesSearch(group: GroupedLibrary, searchTerm: string): boolean {
  if (!searchTerm) return true;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  // Check group display name
  if (group.display_name.toLowerCase().includes(lowerSearchTerm)) {
    return true;
  }
  
  // Check individual libraries
  return group.libraries.some(library => libraryMatchesSearch(library, searchTerm));
}

/**
 * Generate repository link for a library
 */
export function generateRepositoryLink(library: Library): string {
  const baseUrl = 'https://github.com/open-telemetry/opentelemetry-java-instrumentation/tree/main';
  return `${baseUrl}/${library.source_path}`;
}

/**
 * Generate JavaDoc link for standalone libraries
 * Template: https://javadoc.io/doc/io.opentelemetry.instrumentation/opentelemetry-{library-name}/{version}/io/opentelemetry/instrumentation/{package-name}/package-summary.html
 */
export function generateJavaDocLink(library: Library): string | null {
  // Only generate JavaDoc links for standalone libraries
  if (library.type !== 'standalone' && !library.has_standalone_library) {
    return null;
  }
  
  const baseUrl = 'https://javadoc.io/doc/io.opentelemetry.instrumentation';
  const libraryArtifact = `opentelemetry-${library.name}`;
  const version = '1.21.0-alpha'; // Use latest version - could be made configurable
  
  // Convert library name to package name (replace dashes with lowercase)
  // e.g., apache-dbcp-2.0 -> apachedbcp
  const packageName = library.name.replace(/-\d+(\.\d+)*$/, '').replace(/-/g, '').toLowerCase();
  
  const packagePath = `io/opentelemetry/instrumentation/${packageName}`;
  
  return `${baseUrl}/${libraryArtifact}/${version}/${packagePath}/package-summary.html`;
}
