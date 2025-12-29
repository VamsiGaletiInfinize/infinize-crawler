import fs from 'fs/promises';
import path from 'path';
import { ensureDirectory } from './utils/fileWriter.js';

/**
 * Progress Writer Module
 * Manages progress.json file for tracking crawl status
 */

/**
 * Gets the progress file path for a university
 * @param {string} baseDir - Base output directory
 * @param {string} universityName - Sanitized university name
 * @returns {string} Full path to progress.json
 */
export function getProgressFilePath(baseDir, universityName) {
    const sanitized = universityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return path.join(baseDir, sanitized, 'progress.json');
}

/**
 * Initializes progress tracking for a new crawl
 * @param {Object} options - Options object
 * @param {string} options.baseDir - Base output directory
 * @param {string} options.universityName - University name
 * @param {string} options.seedUrl - Starting URL
 * @returns {Promise<string>} Path to progress file
 */
export async function initProgress({ baseDir, universityName, seedUrl }) {
    const progressPath = getProgressFilePath(baseDir, universityName);
    const dirPath = path.dirname(progressPath);

    await ensureDirectory(dirPath);

    const progress = {
        status: 'starting',
        pagesProcessed: 0,
        totalEnqueued: 0,
        currentUrl: seedUrl,
        startTime: new Date().toISOString(),
        endTime: null,
        seedUrl,
        universityName,
        error: null,
        outputFile: null,
    };

    await fs.writeFile(progressPath, JSON.stringify(progress, null, 2), 'utf8');
    return progressPath;
}

/**
 * Updates progress during crawl
 * @param {Object} options - Options object
 * @param {string} options.baseDir - Base output directory
 * @param {string} options.universityName - University name
 * @param {number} options.pagesProcessed - Number of pages processed
 * @param {number} options.totalEnqueued - Total URLs in queue
 * @param {string} options.currentUrl - Current URL being processed
 * @returns {Promise<void>}
 */
export async function updateProgress({ baseDir, universityName, pagesProcessed, totalEnqueued, currentUrl }) {
    const progressPath = getProgressFilePath(baseDir, universityName);

    try {
        const content = await fs.readFile(progressPath, 'utf8');
        const progress = JSON.parse(content);

        progress.status = 'running';
        progress.pagesProcessed = pagesProcessed;
        progress.totalEnqueued = totalEnqueued;
        progress.currentUrl = currentUrl;

        await fs.writeFile(progressPath, JSON.stringify(progress, null, 2), 'utf8');
    } catch (error) {
        console.error(`Failed to update progress: ${error.message}`);
    }
}

/**
 * Marks the crawl as completed
 * @param {Object} options - Options object
 * @param {string} options.baseDir - Base output directory
 * @param {string} options.universityName - University name
 * @param {number} options.pagesProcessed - Final page count
 * @param {string} options.outputFile - Path to output file
 * @returns {Promise<void>}
 */
export async function completeProgress({ baseDir, universityName, pagesProcessed, outputFile }) {
    const progressPath = getProgressFilePath(baseDir, universityName);

    try {
        const content = await fs.readFile(progressPath, 'utf8');
        const progress = JSON.parse(content);

        progress.status = 'completed';
        progress.pagesProcessed = pagesProcessed;
        progress.totalEnqueued = pagesProcessed;
        progress.endTime = new Date().toISOString();
        progress.outputFile = outputFile;
        progress.currentUrl = '';

        await fs.writeFile(progressPath, JSON.stringify(progress, null, 2), 'utf8');
    } catch (error) {
        console.error(`Failed to complete progress: ${error.message}`);
    }
}

/**
 * Marks the crawl as failed
 * @param {Object} options - Options object
 * @param {string} options.baseDir - Base output directory
 * @param {string} options.universityName - University name
 * @param {string} options.error - Error message
 * @returns {Promise<void>}
 */
export async function failProgress({ baseDir, universityName, error }) {
    const progressPath = getProgressFilePath(baseDir, universityName);

    try {
        const content = await fs.readFile(progressPath, 'utf8');
        const progress = JSON.parse(content);

        progress.status = 'failed';
        progress.endTime = new Date().toISOString();
        progress.error = error;

        await fs.writeFile(progressPath, JSON.stringify(progress, null, 2), 'utf8');
    } catch (err) {
        console.error(`Failed to write failure progress: ${err.message}`);
    }
}

/**
 * Reads the current progress
 * @param {Object} options - Options object
 * @param {string} options.baseDir - Base output directory
 * @param {string} options.universityName - University name
 * @returns {Promise<Object|null>} Progress object or null if not found
 */
export async function readProgress({ baseDir, universityName }) {
    const progressPath = getProgressFilePath(baseDir, universityName);

    try {
        const content = await fs.readFile(progressPath, 'utf8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

export default {
    getProgressFilePath,
    initProgress,
    updateProgress,
    completeProgress,
    failProgress,
    readProgress,
};
