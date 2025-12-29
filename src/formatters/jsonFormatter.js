import { writeJsonFile, getOutputFilePath } from '../utils/fileWriter.js';
import { sanitizeFilename, sanitizeUniversityName } from '../utils/sanitizer.js';

/**
 * JSON Formatter - Formats and saves page data as JSON
 */

/**
 * Formats page data to JSON structure
 * @param {Object} pageData - Extracted page data
 * @returns {Object} Formatted data ready for JSON serialization
 */
export function formatJson(pageData) {
    return {
        url: pageData.url,
        title: pageData.title,
        headings: {
            h1: pageData.headings.h1,
            h2: pageData.headings.h2,
            h3: pageData.headings.h3,
        },
        mainText: pageData.mainText,
        internalLinks: pageData.internalLinks,
        crawledAt: pageData.crawledAt,
    };
}

/**
 * Saves page data as a JSON file
 * @param {Object} pageData - Extracted page data
 * @param {Object} options - Save options
 * @param {string} options.baseDir - Base output directory
 * @param {string} options.universityName - University name for folder
 * @returns {Promise<string>} Path to saved file
 */
export async function saveJson(pageData, options) {
    const { baseDir, universityName } = options;

    // Sanitize names for file system
    const sanitizedUniversity = sanitizeUniversityName(universityName);
    const sanitizedFilename = sanitizeFilename(pageData.url);

    // Get the output file path
    const filePath = getOutputFilePath(
        baseDir,
        sanitizedUniversity,
        'json',
        sanitizedFilename,
        '.json'
    );

    // Format the data
    const formattedData = formatJson(pageData);

    // Write the JSON file
    await writeJsonFile(filePath, formattedData);

    return filePath;
}

export default { formatJson, saveJson };
