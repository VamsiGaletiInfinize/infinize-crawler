#!/usr/bin/env node
import { runCrawler } from './crawler.js';
import { createPageHandler } from './handlers/pageHandler.js';
import { initProgress, updateProgress, completeProgress, failProgress } from './progressWriter.js';
import { appendToSingleFile, finalizeSingleFile, initSingleFile } from './singleFileFormatter.js';
import defaultConfig from '../config/default.config.js';

/**
 * Background Runner - Child Process Entry Point
 *
 * This script is spawned as a detached child process by the API.
 * It runs the crawler and writes progress to progress.json.
 *
 * Usage: node backgroundRunner.js --seedUrl <url> --universityName <name> [--formats <formats>]
 */

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const result = {
        seedUrl: null,
        universityName: null,
        formats: ['markdown'],
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--seedUrl':
                result.seedUrl = args[++i];
                break;
            case '--universityName':
                result.universityName = args[++i];
                break;
            case '--formats':
                result.formats = args[++i].split(',').map((f) => f.trim());
                break;
        }
    }

    return result;
}

/**
 * Main background crawl function
 */
async function main() {
    const { seedUrl, universityName, formats } = parseArgs();

    // Validate required arguments
    if (!seedUrl) {
        console.error('Error: --seedUrl is required');
        process.exit(1);
    }

    if (!universityName) {
        console.error('Error: --universityName is required');
        process.exit(1);
    }

    const config = defaultConfig;
    const baseDir = config.output.baseDir;
    const sanitizedName = universityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    console.log('Background Crawler Starting...');
    console.log(`  Seed URL: ${seedUrl}`);
    console.log(`  University: ${universityName}`);
    console.log(`  Formats: ${formats.join(', ')}`);

    try {
        // Initialize progress tracking
        await initProgress({
            baseDir,
            universityName,
            seedUrl,
        });

        // Initialize single file output
        const outputFilePath = await initSingleFile({
            baseDir,
            universityName,
            seedUrl,
        });

        // Track statistics
        let pagesProcessed = 0;
        let totalEnqueued = 1; // Start with seed URL
        const processedUrls = new Set();

        // Create page handler with progress updates
        const pageHandler = createPageHandler({
            config,
            onPageData: async (pageData) => {
                // Skip if URL already processed (deduplication)
                if (processedUrls.has(pageData.url)) {
                    return;
                }
                processedUrls.add(pageData.url);

                pagesProcessed++;

                // Append to single markdown file
                await appendToSingleFile({
                    baseDir,
                    universityName,
                    pageData,
                });

                // Update progress
                await updateProgress({
                    baseDir,
                    universityName,
                    pagesProcessed,
                    totalEnqueued,
                    currentUrl: pageData.url,
                });

                // Progress indicator
                if (pagesProcessed % 10 === 0) {
                    console.log(`  Processed ${pagesProcessed} pages...`);
                }
            },
            onEnqueue: (count) => {
                totalEnqueued = count;
            },
        });

        // Run the crawler
        const stats = await runCrawler({
            seedUrl,
            config,
            requestHandler: pageHandler,
            onQueueUpdate: (count) => {
                totalEnqueued = Math.max(totalEnqueued, count);
            },
        });

        // Finalize single file with header
        await finalizeSingleFile({
            baseDir,
            universityName,
            pagesProcessed,
            seedUrl,
        });

        // Mark progress as completed
        await completeProgress({
            baseDir,
            universityName,
            pagesProcessed,
            outputFile: outputFilePath,
        });

        console.log('\n========================================');
        console.log('   CRAWL COMPLETE');
        console.log('========================================');
        console.log(`  Pages processed: ${pagesProcessed}`);
        console.log(`  Requests finished: ${stats.requestsFinished}`);
        console.log(`  Requests failed: ${stats.requestsFailed}`);
        console.log(`  Output: ${outputFilePath}`);
        console.log('========================================');

        process.exit(0);
    } catch (error) {
        console.error('Crawler failed:', error.message);

        // Mark progress as failed
        await failProgress({
            baseDir,
            universityName,
            error: error.message,
        });

        process.exit(1);
    }
}

// Run the main function
main();
