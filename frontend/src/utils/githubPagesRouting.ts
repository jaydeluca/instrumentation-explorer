/**
 * Handles GitHub Pages client-side routing redirect
 * This function processes the special 'p' parameter that contains the original path
 * when GitHub Pages redirects from a 404 to the base URL
 */
export function handleGitHubPagesRedirect(searchParams: URLSearchParams): string | null {
  const redirectPath = searchParams.get('p');
  
  if (!redirectPath) {
    return null;
  }
  
  // Remove the 'p' parameter and reconstruct the URL
  const newParams = new URLSearchParams(searchParams);
  newParams.delete('p');
  
  const newSearch = newParams.toString();
  const newUrl = redirectPath + (newSearch ? '?' + newSearch : '');
  
  return newUrl;
}

/**
 * Creates a GitHub Pages compatible redirect URL
 * This is used by the 404.html script to encode the original URL
 */
export function createGitHubPagesRedirectUrl(
  baseUrl: string,
  routePath: string,
  search: string = '',
  hash: string = ''
): string {
  let redirectUrl = baseUrl + '?p=' + encodeURIComponent(routePath);
  
  if (search && search.startsWith('?')) {
    redirectUrl += '&' + search.substring(1); // Remove the '?' from search
  } else if (search) {
    redirectUrl += '&' + search;
  }
  
  if (hash) {
    redirectUrl += hash;
  }
  
  return redirectUrl;
}
