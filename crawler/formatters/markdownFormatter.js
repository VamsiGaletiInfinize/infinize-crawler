import { writeOutput, getOutputFilePath } from '../utils/fileWriter.js';
import { sanitizeFilename, sanitizeUniversityName } from '../utils/sanitizer.js';

/**
 * Markdown Formatter - Formats and saves page data as Markdown
 */

/**
 * Formats page data to Markdown string
 * @param {Object} pageData - Extracted page data
 * @returns {string} Formatted Markdown content
 */
export function formatMarkdown(pageData) {
    const lines = [];

    // Title
    const title = pageData.title || 'Untitled Page';
    lines.push(`# ${title}`);
    lines.push('');

    // Metadata
    lines.push(`**URL:** [${pageData.url}](${pageData.url})`);
    lines.push(`**Crawled:** ${pageData.crawledAt}`);
    lines.push('');

    // Headings section
    if (hasHeadings(pageData.headings)) {
        lines.push('---');
        lines.push('');
        lines.push('## Page Structure');
        lines.push('');

        if (pageData.headings.h1.length > 0) {
            lines.push('### H1 Headings');
            for (const h1 of pageData.headings.h1) {
                lines.push(`- ${h1}`);
            }
            lines.push('');
        }

        if (pageData.headings.h2.length > 0) {
            lines.push('### H2 Headings');
            for (const h2 of pageData.headings.h2) {
                lines.push(`- ${h2}`);
            }
            lines.push('');
        }

        if (pageData.headings.h3.length > 0) {
            lines.push('### H3 Headings');
            for (const h3 of pageData.headings.h3) {
                lines.push(`- ${h3}`);
            }
            lines.push('');
        }
    }

    // Main content section
    if (pageData.mainText && pageData.mainText.length > 0) {
        lines.push('---');
        lines.push('');
        lines.push('## Content');
        lines.push('');

        // Truncate very long content for readability
        const maxLength = 5000;
        let content = pageData.mainText;
        if (content.length > maxLength) {
            content = content.substring(0, maxLength) + '...';
        }

        lines.push(content);
        lines.push('');
    }

    // Internal links section
    if (pageData.internalLinks && pageData.internalLinks.length > 0) {
        lines.push('---');
        lines.push('');
        lines.push('## Internal Links');
        lines.push('');
        lines.push(`Found ${pageData.internalLinks.length} internal links:`);
        lines.push('');

        // Limit to first 50 links for readability
        const linksToShow = pageData.internalLinks.slice(0, 50);
        for (const link of linksToShow) {
            lines.push(`- [${link}](${link})`);
        }

        if (pageData.internalLinks.length > 50) {
            lines.push('');
            lines.push(`_...and ${pageData.internalLinks.length - 50} more links_`);
        }
        lines.push('');
    }

    return lines.join('\n');
}

/**
 * Checks if there are any headings
 * @param {Object} headings - Headings object
 * @returns {boolean}
 */
function hasHeadings(headings) {
    return (
        headings.h1.length > 0 ||
        headings.h2.length > 0 ||
        headings.h3.length > 0
    );
}

/**
 * Saves page data as a Markdown file
 * @param {Object} pageData - Extracted page data
 * @param {Object} options - Save options
 * @param {string} options.baseDir - Base output directory
 * @param {string} options.universityName - University name for folder
 * @returns {Promise<string>} Path to saved file
 */
export async function saveMarkdown(pageData, options) {
    const { baseDir, universityName } = options;

    // Sanitize names for file system
    const sanitizedUniversity = sanitizeUniversityName(universityName);
    const sanitizedFilename = sanitizeFilename(pageData.url);

    // Get the output file path
    const filePath = getOutputFilePath(
        baseDir,
        sanitizedUniversity,
        'markdown',
        sanitizedFilename,
        '.md'
    );

    // Format the data
    const markdownContent = formatMarkdown(pageData);

    // Write the Markdown file
    await writeOutput(filePath, markdownContent);

    return filePath;
}

export default { formatMarkdown, saveMarkdown };
