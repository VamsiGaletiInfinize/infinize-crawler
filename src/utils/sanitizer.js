/**
 * Sanitizer utilities for filenames and university names
 */

/**
 * Converts a URL to a safe filename
 * @param {string} url - The URL to convert
 * @returns {string} Safe filename (without extension)
 */
export function sanitizeFilename(url) {
    try {
        const urlObj = new URL(url);
        let pathname = urlObj.pathname;

        // Remove leading and trailing slashes
        pathname = pathname.replace(/^\/+|\/+$/g, '');

        // Handle root/index pages
        if (!pathname || pathname === '') {
            return 'index';
        }

        // Replace slashes with hyphens
        let filename = pathname.replace(/\//g, '-');

        // Remove file extensions
        filename = filename.replace(/\.[^.]+$/, '');

        // Replace invalid filename characters
        filename = filename.replace(/[<>:"/\\|?*]/g, '-');

        // Replace multiple hyphens with single hyphen
        filename = filename.replace(/-+/g, '-');

        // Remove leading/trailing hyphens
        filename = filename.replace(/^-+|-+$/g, '');

        // Convert to lowercase
        filename = filename.toLowerCase();

        // Truncate if too long (max 100 chars)
        if (filename.length > 100) {
            filename = filename.substring(0, 100);
            // Remove trailing hyphen if truncation split a word
            filename = filename.replace(/-+$/, '');
        }

        // Fallback for empty result
        if (!filename) {
            return 'page';
        }

        return filename;
    } catch {
        // If URL parsing fails, create a hash-based name
        return 'page-' + simpleHash(url);
    }
}

/**
 * Sanitizes a university name for use as a folder name
 * @param {string} name - The university name
 * @returns {string} Safe folder name
 */
export function sanitizeUniversityName(name) {
    if (!name || typeof name !== 'string') {
        return 'unknown-university';
    }

    // Convert to lowercase
    let sanitized = name.toLowerCase();

    // Replace common words/punctuation
    sanitized = sanitized.replace(/university|college|institute|of|the|and|&/gi, ' ');

    // Replace non-alphanumeric characters with hyphens
    sanitized = sanitized.replace(/[^a-z0-9]+/g, '-');

    // Remove multiple hyphens
    sanitized = sanitized.replace(/-+/g, '-');

    // Remove leading/trailing hyphens
    sanitized = sanitized.replace(/^-+|-+$/g, '');

    // Truncate if too long
    if (sanitized.length > 50) {
        sanitized = sanitized.substring(0, 50);
        sanitized = sanitized.replace(/-+$/, '');
    }

    // Fallback
    if (!sanitized) {
        return 'university';
    }

    return sanitized;
}

/**
 * Creates a simple hash from a string
 * @param {string} str - Input string
 * @returns {string} Short hash string
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 8);
}

export default { sanitizeFilename, sanitizeUniversityName };
