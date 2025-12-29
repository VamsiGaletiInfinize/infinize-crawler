import readline from 'readline';
import { runCrawler } from './crawler.js';
import { createPageHandler } from './handlers/pageHandler.js';
import { getFormatter, getAvailableFormats, validateFormats } from './formatters/index.js';
import { initLinksAggregator, finalizeLinks } from './formatters/linksFormatter.js';
import { isValidUrl } from './utils/urlUtils.js';
import defaultConfig from '../config/default.config.js';

/**
 * Infinize Crawler - Main Entry Point
 *
 * Interactive CLI for crawling university websites
 */

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

/**
 * Prompts the user for input
 * @param {string} question - The question to ask
 * @returns {Promise<string>} User's answer
 */
function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

/**
 * Validates the seed URL
 * @param {string} url - URL to validate
 * @returns {Object} Validation result with isValid and message
 */
function validateSeedUrl(url) {
    if (!url) {
        return { isValid: false, message: 'URL is required' };
    }

    if (!isValidUrl(url)) {
        return { isValid: false, message: 'Invalid URL format. Please enter a valid HTTP/HTTPS URL' };
    }

    return { isValid: true };
}

/**
 * Validates the university name
 * @param {string} name - Name to validate
 * @returns {Object} Validation result
 */
function validateUniversityName(name) {
    if (!name) {
        return { isValid: false, message: 'University name is required' };
    }

    if (name.length < 2) {
        return { isValid: false, message: 'University name must be at least 2 characters' };
    }

    return { isValid: true };
}

/**
 * Parses the formats input
 * @param {string} input - Comma-separated format names
 * @returns {string[]} Array of format names
 */
function parseFormats(input) {
    if (!input) {
        return defaultConfig.output.defaultFormats;
    }

    return input
        .split(',')
        .map((f) => f.trim().toLowerCase())
        .filter((f) => f.length > 0);
}

/**
 * Gets user configuration through interactive prompts
 * @returns {Promise<Object>} User configuration
 */
async function getUserConfig() {
    console.log('\n========================================');
    console.log('   INFINIZE CRAWLER - University Crawler');
    console.log('========================================\n');

    // Get seed URL
    let seedUrl;
    while (true) {
        seedUrl = await prompt('Enter the seed URL (e.g., https://university.edu): ');
        const validation = validateSeedUrl(seedUrl);
        if (validation.isValid) {
            break;
        }
        console.log(`  Error: ${validation.message}\n`);
    }

    // Get university name
    let universityName;
    while (true) {
        universityName = await prompt('Enter the university name: ');
        const validation = validateUniversityName(universityName);
        if (validation.isValid) {
            break;
        }
        console.log(`  Error: ${validation.message}\n`);
    }

    // Get output formats
    const availableFormats = getAvailableFormats();
    console.log(`\nAvailable formats: ${availableFormats.join(', ')}`);
    console.log(`Default: ${defaultConfig.output.defaultFormats.join(', ')}`);

    const formatsInput = await prompt('Select output formats (comma-separated, or press Enter for default): ');
    const selectedFormats = parseFormats(formatsInput);

    // Validate formats
    const { valid, invalid } = validateFormats(selectedFormats);

    if (invalid.length > 0) {
        console.log(`\n  Warning: Unknown formats will be ignored: ${invalid.join(', ')}`);
    }

    if (valid.length === 0) {
        console.log('  No valid formats selected, using defaults.');
        valid.push(...defaultConfig.output.defaultFormats);
    }

    console.log(`\n  Selected formats: ${valid.join(', ')}`);

    return {
        seedUrl,
        universityName,
        selectedFormats: valid,
    };
}

/**
 * Main crawl function
 * @param {Object} userConfig - User configuration
 */
async function crawl(userConfig) {
    const { seedUrl, universityName, selectedFormats } = userConfig;
    const config = defaultConfig;

    console.log('\n----------------------------------------');
    console.log('Starting crawl...');
    console.log(`  Seed URL: ${seedUrl}`);
    console.log(`  University: ${universityName}`);
    console.log(`  Formats: ${selectedFormats.join(', ')}`);
    console.log(`  Output: ${config.output.baseDir}/${universityName.toLowerCase().replace(/\s+/g, '-')}/`);
    console.log('----------------------------------------\n');

    // Initialize links aggregator if links format is selected
    const hasLinksFormat = selectedFormats.includes('links');
    if (hasLinksFormat) {
        initLinksAggregator({ seedUrl, universityName });
    }

    // Track statistics
    let pagesProcessed = 0;
    let filesSaved = 0;

    // Create the page handler
    const pageHandler = createPageHandler({
        config,
        onPageData: async (pageData) => {
            pagesProcessed++;

            // Save in each selected format
            for (const formatName of selectedFormats) {
                const formatter = getFormatter(formatName);
                if (formatter && formatter.save) {
                    try {
                        const filePath = await formatter.save(pageData, {
                            baseDir: config.output.baseDir,
                            universityName,
                        });
                        if (filePath) {
                            filesSaved++;
                        }
                    } catch (error) {
                        console.error(`  Error saving ${formatName}: ${error.message}`);
                    }
                }
            }

            // Progress indicator
            if (pagesProcessed % 10 === 0) {
                console.log(`  Processed ${pagesProcessed} pages...`);
            }
        },
    });

    // Run the crawler
    const stats = await runCrawler({
        seedUrl,
        config,
        requestHandler: pageHandler,
    });

    // Finalize links aggregator if needed
    if (hasLinksFormat) {
        console.log('\nFinalizing links aggregation...');
        const linksPaths = await finalizeLinks({
            baseDir: config.output.baseDir,
            universityName,
        });
        console.log(`  Links saved to: ${linksPaths.json}`);
    }

    // Print summary
    console.log('\n========================================');
    console.log('   CRAWL COMPLETE');
    console.log('========================================');
    console.log(`  Pages processed: ${pagesProcessed}`);
    console.log(`  Files saved: ${filesSaved}`);
    console.log(`  Requests finished: ${stats.requestsFinished}`);
    console.log(`  Requests failed: ${stats.requestsFailed}`);
    console.log('========================================\n');
}

/**
 * Main entry point
 */
async function main() {
    try {
        // Get user configuration
        const userConfig = await getUserConfig();

        // Close readline before crawling (crawler has its own output)
        rl.close();

        // Run the crawl
        await crawl(userConfig);

        console.log('Done! Check the output directory for results.');
        process.exit(0);
    } catch (error) {
        console.error('\nError:', error.message);
        rl.close();
        process.exit(1);
    }
}

// Run the main function
main();
