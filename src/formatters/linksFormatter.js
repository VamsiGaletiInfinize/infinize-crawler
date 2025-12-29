import { writeJsonFile, writeOutput, getOutputDir, fileExists, readJsonFile } from '../utils/fileWriter.js';
import { sanitizeUniversityName } from '../utils/sanitizer.js';
import path from 'path';

/**
 * Links Formatter - Aggregates and saves all discovered internal links
 *
 * Unlike other formatters, this one aggregates links from all pages
 * into a single output file.
 */

/**
 * Links aggregator state
 */
const linksState = {
    allLinks: new Set(),
    seedUrl: '',
    universityName: '',
};

/**
 * Initializes the links aggregator
 * @param {Object} options - Initialization options
 * @param {string} options.seedUrl - The seed URL
 * @param {string} options.universityName - The university name
 */
export function initLinksAggregator(options) {
    linksState.allLinks = new Set();
    linksState.seedUrl = options.seedUrl;
    linksState.universityName = options.universityName;
}

/**
 * Adds links from a page to the aggregator
 * @param {Object} pageData - Extracted page data
 * @returns {number} Total number of unique links so far
 */
export function addLinks(pageData) {
    // Add the page URL itself
    linksState.allLinks.add(pageData.url);

    // Add all internal links from this page
    if (pageData.internalLinks && Array.isArray(pageData.internalLinks)) {
        for (const link of pageData.internalLinks) {
            linksState.allLinks.add(link);
        }
    }

    return linksState.allLinks.size;
}

/**
 * Formats the aggregated links to JSON structure
 * @returns {Object} Formatted links data
 */
export function formatLinks() {
    const sortedLinks = Array.from(linksState.allLinks).sort();

    return {
        universityName: linksState.universityName,
        seedUrl: linksState.seedUrl,
        totalLinks: sortedLinks.length,
        generatedAt: new Date().toISOString(),
        links: sortedLinks,
    };
}

/**
 * Formats the aggregated links to plain text
 * @returns {string} Plain text list of links
 */
export function formatLinksAsText() {
    const data = formatLinks();
    const lines = [
        `# Internal Links for ${data.universityName}`,
        `# Seed URL: ${data.seedUrl}`,
        `# Total Links: ${data.totalLinks}`,
        `# Generated: ${data.generatedAt}`,
        '',
        ...data.links,
    ];
    return lines.join('\n');
}

/**
 * Saves the aggregated links
 * @param {Object} pageData - Page data (used to accumulate links)
 * @param {Object} options - Save options
 * @param {string} options.baseDir - Base output directory
 * @param {string} options.universityName - University name for folder
 * @returns {Promise<string>} Path to saved file
 */
export async function saveLinks(pageData, options) {
    // Add links from this page
    addLinks(pageData);

    // Note: The actual file is written at the end of crawling
    // This function just accumulates links
    return '';
}

/**
 * Finalizes and saves all aggregated links
 * @param {Object} options - Save options
 * @param {string} options.baseDir - Base output directory
 * @param {string} options.universityName - University name for folder
 * @returns {Promise<Object>} Paths to saved files
 */
export async function finalizeLinks(options) {
    const { baseDir, universityName } = options;
    const sanitizedUniversity = sanitizeUniversityName(universityName);
    const outputDir = getOutputDir(baseDir, sanitizedUniversity, 'links');

    const paths = {};

    // Save as JSON
    const jsonPath = path.join(outputDir, 'all-links.json');
    const jsonData = formatLinks();
    await writeJsonFile(jsonPath, jsonData);
    paths.json = jsonPath;

    // Save as plain text
    const txtPath = path.join(outputDir, 'all-links.txt');
    const txtData = formatLinksAsText();
    await writeOutput(txtPath, txtData);
    paths.txt = txtPath;

    return paths;
}

/**
 * Gets the current state of aggregated links
 * @returns {Object} Current links state
 */
export function getLinksState() {
    return {
        totalLinks: linksState.allLinks.size,
        seedUrl: linksState.seedUrl,
        universityName: linksState.universityName,
    };
}

/**
 * Resets the links aggregator state
 */
export function resetLinksAggregator() {
    linksState.allLinks = new Set();
    linksState.seedUrl = '';
    linksState.universityName = '';
}

export default {
    initLinksAggregator,
    addLinks,
    formatLinks,
    formatLinksAsText,
    saveLinks,
    finalizeLinks,
    getLinksState,
    resetLinksAggregator,
};
