import { writeOutput, getOutputFilePath } from '../utils/fileWriter.js';
import { sanitizeFilename, sanitizeUniversityName } from '../utils/sanitizer.js';

/**
 * HTML Formatter - Formats and saves page data as HTML
 */

/**
 * Escapes HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Formats page data to HTML string
 * @param {Object} pageData - Extracted page data
 * @returns {string} Formatted HTML content
 */
export function formatHtml(pageData) {
    const title = escapeHtml(pageData.title || 'Untitled Page');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Crawl Report</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
        }
        .metadata {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .metadata a {
            color: #3498db;
            word-break: break-all;
        }
        .headings-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        .heading-group {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
        }
        .heading-group h3 {
            margin-top: 0;
            color: #2980b9;
        }
        .heading-group ul {
            margin: 0;
            padding-left: 20px;
        }
        .content-section {
            background: #fafafa;
            padding: 20px;
            border-radius: 5px;
            border-left: 4px solid #3498db;
            max-height: 400px;
            overflow-y: auto;
        }
        .links-section ul {
            max-height: 300px;
            overflow-y: auto;
            padding-left: 20px;
        }
        .links-section a {
            color: #3498db;
            text-decoration: none;
        }
        .links-section a:hover {
            text-decoration: underline;
        }
        .timestamp {
            color: #7f8c8d;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>

        <div class="metadata">
            <p><strong>Source URL:</strong> <a href="${escapeHtml(pageData.url)}" target="_blank">${escapeHtml(pageData.url)}</a></p>
            <p class="timestamp"><strong>Crawled:</strong> ${escapeHtml(pageData.crawledAt)}</p>
        </div>

        ${formatHeadingsSection(pageData.headings)}
        ${formatContentSection(pageData.mainText)}
        ${formatLinksSection(pageData.internalLinks)}
    </div>
</body>
</html>`;
}

/**
 * Formats the headings section
 * @param {Object} headings - Headings object
 * @returns {string} HTML for headings section
 */
function formatHeadingsSection(headings) {
    const hasHeadings =
        headings.h1.length > 0 ||
        headings.h2.length > 0 ||
        headings.h3.length > 0;

    if (!hasHeadings) {
        return '';
    }

    let html = '<h2>Page Structure</h2><div class="headings-section">';

    if (headings.h1.length > 0) {
        html += `
            <div class="heading-group">
                <h3>H1 Headings (${headings.h1.length})</h3>
                <ul>
                    ${headings.h1.map(h => `<li>${escapeHtml(h)}</li>`).join('')}
                </ul>
            </div>`;
    }

    if (headings.h2.length > 0) {
        html += `
            <div class="heading-group">
                <h3>H2 Headings (${headings.h2.length})</h3>
                <ul>
                    ${headings.h2.map(h => `<li>${escapeHtml(h)}</li>`).join('')}
                </ul>
            </div>`;
    }

    if (headings.h3.length > 0) {
        html += `
            <div class="heading-group">
                <h3>H3 Headings (${headings.h3.length})</h3>
                <ul>
                    ${headings.h3.map(h => `<li>${escapeHtml(h)}</li>`).join('')}
                </ul>
            </div>`;
    }

    html += '</div>';
    return html;
}

/**
 * Formats the content section
 * @param {string} mainText - Main content text
 * @returns {string} HTML for content section
 */
function formatContentSection(mainText) {
    if (!mainText || mainText.length === 0) {
        return '';
    }

    // Truncate very long content
    let content = mainText;
    const maxLength = 5000;
    if (content.length > maxLength) {
        content = content.substring(0, maxLength) + '...';
    }

    return `
        <h2>Content</h2>
        <div class="content-section">
            <p>${escapeHtml(content)}</p>
        </div>`;
}

/**
 * Formats the links section
 * @param {string[]} internalLinks - Array of internal links
 * @returns {string} HTML for links section
 */
function formatLinksSection(internalLinks) {
    if (!internalLinks || internalLinks.length === 0) {
        return '';
    }

    // Limit to first 50 links
    const linksToShow = internalLinks.slice(0, 50);
    const remaining = internalLinks.length - linksToShow.length;

    let html = `
        <h2>Internal Links (${internalLinks.length})</h2>
        <div class="links-section">
            <ul>
                ${linksToShow.map(link => `<li><a href="${escapeHtml(link)}" target="_blank">${escapeHtml(link)}</a></li>`).join('')}
            </ul>`;

    if (remaining > 0) {
        html += `<p><em>...and ${remaining} more links</em></p>`;
    }

    html += '</div>';
    return html;
}

/**
 * Saves page data as an HTML file
 * @param {Object} pageData - Extracted page data
 * @param {Object} options - Save options
 * @param {string} options.baseDir - Base output directory
 * @param {string} options.universityName - University name for folder
 * @returns {Promise<string>} Path to saved file
 */
export async function saveHtml(pageData, options) {
    const { baseDir, universityName } = options;

    // Sanitize names for file system
    const sanitizedUniversity = sanitizeUniversityName(universityName);
    const sanitizedFilename = sanitizeFilename(pageData.url);

    // Get the output file path
    const filePath = getOutputFilePath(
        baseDir,
        sanitizedUniversity,
        'html',
        sanitizedFilename,
        '.html'
    );

    // Format the data
    const htmlContent = formatHtml(pageData);

    // Write the HTML file
    await writeOutput(filePath, htmlContent);

    return filePath;
}

export default { formatHtml, saveHtml };
