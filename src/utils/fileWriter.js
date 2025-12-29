import fs from 'fs/promises';
import path from 'path';

/**
 * File writing utilities for output persistence
 */

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath - Directory path to ensure
 * @returns {Promise<void>}
 */
export async function ensureDirectory(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        // Ignore EEXIST errors (directory already exists)
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}

/**
 * Writes content to a file, creating directories as needed
 * @param {string} filePath - Full path to the file
 * @param {string} content - Content to write
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function writeOutput(filePath, content) {
    try {
        // Ensure parent directory exists
        const dirPath = path.dirname(filePath);
        await ensureDirectory(dirPath);

        // Write the file
        await fs.writeFile(filePath, content, 'utf8');
        return true;
    } catch (error) {
        // Log error but don't throw - allow crawler to continue
        console.error(`Failed to write file ${filePath}: ${error.message}`);
        return false;
    }
}

/**
 * Appends content to a file, creating it if necessary
 * @param {string} filePath - Full path to the file
 * @param {string} content - Content to append
 * @returns {Promise<void>}
 */
export async function appendToFile(filePath, content) {
    // Ensure parent directory exists
    const dirPath = path.dirname(filePath);
    await ensureDirectory(dirPath);

    // Append to the file
    await fs.appendFile(filePath, content, 'utf8');
}

/**
 * Checks if a file exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>}
 */
export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Reads a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<Object|null>} Parsed JSON or null if not found
 */
export async function readJsonFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

/**
 * Writes a JSON file with pretty formatting
 * @param {string} filePath - Path to write to
 * @param {Object} data - Data to write
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function writeJsonFile(filePath, data) {
    try {
        const content = JSON.stringify(data, null, 2);
        return await writeOutput(filePath, content);
    } catch (error) {
        console.error(`Failed to serialize JSON for ${filePath}: ${error.message}`);
        return false;
    }
}

/**
 * Gets the output directory path for a specific university and format
 * @param {string} baseDir - Base output directory
 * @param {string} universityName - Sanitized university name
 * @param {string} format - Output format (json, markdown, html, links)
 * @returns {string} Full directory path
 */
export function getOutputDir(baseDir, universityName, format) {
    return path.join(baseDir, universityName, format);
}

/**
 * Gets the full file path for a page output
 * @param {string} baseDir - Base output directory
 * @param {string} universityName - Sanitized university name
 * @param {string} format - Output format
 * @param {string} filename - Sanitized filename (without extension)
 * @param {string} extension - File extension (with dot, e.g., '.json')
 * @returns {string} Full file path
 */
export function getOutputFilePath(baseDir, universityName, format, filename, extension) {
    const dir = getOutputDir(baseDir, universityName, format);
    return path.join(dir, `${filename}${extension}`);
}

export default {
    ensureDirectory,
    writeOutput,
    appendToFile,
    fileExists,
    readJsonFile,
    writeJsonFile,
    getOutputDir,
    getOutputFilePath,
};
