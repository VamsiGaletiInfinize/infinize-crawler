/**
 * Formatter Registry - Central registry for output formatters
 */

import { formatJson, saveJson } from './jsonFormatter.js';

// Formatter registry - will be populated as formatters are added
const formatters = {
    json: {
        name: 'JSON',
        extension: '.json',
        format: formatJson,
        save: saveJson,
    },
    // markdown, html, and links formatters will be added in subsequent branches
};

/**
 * Gets a formatter by name
 * @param {string} formatName - Name of the format (json, markdown, html, links)
 * @returns {Object|null} Formatter object or null if not found
 */
export function getFormatter(formatName) {
    return formatters[formatName.toLowerCase()] || null;
}

/**
 * Gets all available format names
 * @returns {string[]} Array of format names
 */
export function getAvailableFormats() {
    return Object.keys(formatters);
}

/**
 * Validates that requested formats are available
 * @param {string[]} requestedFormats - Array of format names
 * @returns {Object} Object with valid and invalid format arrays
 */
export function validateFormats(requestedFormats) {
    const available = getAvailableFormats();
    const valid = [];
    const invalid = [];

    for (const format of requestedFormats) {
        if (available.includes(format.toLowerCase())) {
            valid.push(format.toLowerCase());
        } else {
            invalid.push(format);
        }
    }

    return { valid, invalid };
}

/**
 * Registers a new formatter
 * @param {string} name - Format name
 * @param {Object} formatter - Formatter configuration
 */
export function registerFormatter(name, formatter) {
    formatters[name.toLowerCase()] = formatter;
}

export default {
    getFormatter,
    getAvailableFormats,
    validateFormats,
    registerFormatter,
};
