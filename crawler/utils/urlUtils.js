/**
 * URL utility functions
 */

/**
 * Extracts the domain (hostname) from a URL
 * @param {string} url - The URL to parse
 * @returns {string|null} The domain or null if invalid
 */
export function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return null;
    }
}

/**
 * Normalizes a URL by removing fragments, trailing slashes, and standardizing protocol
 * @param {string} url - The URL to normalize
 * @returns {string|null} Normalized URL or null if invalid
 */
export function normalizeUrl(url) {
    try {
        const urlObj = new URL(url);

        // Remove fragment
        urlObj.hash = '';

        // Remove trailing slash from pathname (except for root)
        if (urlObj.pathname !== '/') {
            urlObj.pathname = urlObj.pathname.replace(/\/+$/, '');
        }

        // Sort query parameters for consistency
        const params = new URLSearchParams(urlObj.search);
        const sortedParams = new URLSearchParams([...params.entries()].sort());
        urlObj.search = sortedParams.toString();

        return urlObj.toString();
    } catch {
        return null;
    }
}

/**
 * Checks if a URL is valid
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid
 */
export function isValidUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Checks if a URL is internal to the base domain
 * @param {string} url - The URL to check
 * @param {string} baseDomain - The base domain to compare against
 * @returns {boolean} True if internal
 */
export function isInternalUrl(url, baseDomain) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        // Exact match
        if (hostname === baseDomain) {
            return true;
        }

        // Subdomain match (e.g., www.example.com matches example.com)
        if (hostname.endsWith('.' + baseDomain)) {
            return true;
        }

        return false;
    } catch {
        return false;
    }
}

/**
 * Gets the path segments from a URL
 * @param {string} url - The URL to parse
 * @returns {string[]} Array of path segments
 */
export function getPathSegments(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.pathname
            .split('/')
            .filter((segment) => segment.length > 0);
    } catch {
        return [];
    }
}

/**
 * Gets the base URL (protocol + hostname) from a full URL
 * @param {string} url - The URL to parse
 * @returns {string|null} Base URL or null if invalid
 */
export function getBaseUrl(url) {
    try {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.hostname}`;
    } catch {
        return null;
    }
}

export default {
    extractDomain,
    normalizeUrl,
    isValidUrl,
    isInternalUrl,
    getPathSegments,
    getBaseUrl,
};
