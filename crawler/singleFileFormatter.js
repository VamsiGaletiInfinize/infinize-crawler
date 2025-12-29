import fs from 'fs/promises';
import path from 'path';
import { ensureDirectory } from './utils/fileWriter.js';

/**
 * Single File Markdown Formatter
 * Consolidates all crawled pages into a single markdown file per university
 */

/**
 * Gets the single file output path for a university
 * @param {string} baseDir - Base output directory
 * @param {string} universityName - University name
 * @returns {string} Full path to the output file
 */
export function getSingleFilePath(baseDir, universityName) {
    const sanitized = universityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return path.join(baseDir, sanitized, `${sanitized}.md`);
}

/**
 * Initializes the single file output
 * @param {Object} options - Options object
 * @param {string} options.baseDir - Base output directory
 * @param {string} options.universityName - University name
 * @param {string} options.seedUrl - Starting URL
 * @returns {Promise<string>} Path to the output file
 */
export async function initSingleFile({ baseDir, universityName, seedUrl }) {
    const filePath = getSingleFilePath(baseDir, universityName);
    const dirPath = path.dirname(filePath);

    await ensureDirectory(dirPath);

    // Create file with temporary header (will be replaced during finalization)
    const tempHeader = `<!-- TEMP_HEADER: This will be replaced with final stats -->\n\n`;

    await fs.writeFile(filePath, tempHeader, 'utf8');
    return filePath;
}

/**
 * Appends a page's content to the single file
 * @param {Object} options - Options object
 * @param {string} options.baseDir - Base output directory
 * @param {string} options.universityName - University name
 * @param {Object} options.pageData - Page data to append
 * @returns {Promise<void>}
 */
export async function appendToSingleFile({ baseDir, universityName, pageData }) {
    const filePath = getSingleFilePath(baseDir, universityName);

    // Format the page content
    const pageSection = formatPageSection(pageData);

    // Append to file
    await fs.appendFile(filePath, pageSection, 'utf8');
}

/**
 * Formats a single page as a markdown section
 * @param {Object} pageData - Page data
 * @returns {string} Formatted markdown section
 */
function formatPageSection(pageData) {
    const lines = [];

    // Page header
    lines.push('---');
    lines.push('');
    lines.push(`## ${pageData.title || 'Untitled Page'}`);
    lines.push('');
    lines.push(`**URL:** ${pageData.url}`);
    lines.push(`**Crawled:** ${pageData.crawledAt}`);
    lines.push('');

    // Meta description if available
    if (pageData.metaDescription) {
        lines.push(`> ${pageData.metaDescription}`);
        lines.push('');
    }

    // Headings
    if (pageData.headings && pageData.headings.length > 0) {
        lines.push('### Headings');
        lines.push('');
        for (const heading of pageData.headings.slice(0, 10)) {
            const indent = '  '.repeat(Math.max(0, heading.level - 1));
            lines.push(`${indent}- ${heading.text}`);
        }
        if (pageData.headings.length > 10) {
            lines.push(`  - ... and ${pageData.headings.length - 10} more`);
        }
        lines.push('');
    }

    // Main content
    if (pageData.mainContent) {
        lines.push('### Content');
        lines.push('');
        // Limit content length to prevent huge files
        const content = pageData.mainContent.substring(0, 5000);
        lines.push(content);
        if (pageData.mainContent.length > 5000) {
            lines.push('');
            lines.push('*[Content truncated...]*');
        }
        lines.push('');
    }

    // Links found on this page
    if (pageData.links && pageData.links.length > 0) {
        const internalLinks = pageData.links.filter((l) => l.isInternal).slice(0, 10);
        if (internalLinks.length > 0) {
            lines.push('### Links Found');
            lines.push('');
            for (const link of internalLinks) {
                lines.push(`- [${link.text || link.href}](${link.href})`);
            }
            if (pageData.links.filter((l) => l.isInternal).length > 10) {
                lines.push(`- ... and more internal links`);
            }
            lines.push('');
        }
    }

    lines.push('');

    return lines.join('\n');
}

/**
 * Finalizes the single file by prepending a header with stats
 * @param {Object} options - Options object
 * @param {string} options.baseDir - Base output directory
 * @param {string} options.universityName - University name
 * @param {number} options.pagesProcessed - Total pages processed
 * @param {string} options.seedUrl - Starting URL
 * @returns {Promise<void>}
 */
export async function finalizeSingleFile({ baseDir, universityName, pagesProcessed, seedUrl }) {
    const filePath = getSingleFilePath(baseDir, universityName);

    try {
        // Read current content
        let content = await fs.readFile(filePath, 'utf8');

        // Create the final header
        const header = createHeader({
            universityName,
            seedUrl,
            pagesProcessed,
            generatedAt: new Date().toISOString(),
        });

        // Replace temp header with final header
        content = content.replace(/<!-- TEMP_HEADER:.*?-->\n\n/s, header);

        // Write back
        await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
        console.error(`Failed to finalize single file: ${error.message}`);
    }
}

/**
 * Creates the header for the markdown file
 * @param {Object} options - Header options
 * @returns {string} Formatted header
 */
function createHeader({ universityName, seedUrl, pagesProcessed, generatedAt }) {
    const lines = [];

    lines.push(`# ${universityName}`);
    lines.push('');
    lines.push(`**Seed URL:** ${seedUrl}`);
    lines.push(`**Pages Crawled:** ${pagesProcessed}`);
    lines.push(`**Generated:** ${generatedAt}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    return lines.join('\n');
}

export default {
    getSingleFilePath,
    initSingleFile,
    appendToSingleFile,
    finalizeSingleFile,
};
