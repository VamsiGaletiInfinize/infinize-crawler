import { PlaywrightCrawler, Configuration } from 'crawlee';

/**
 * Creates and configures the Playwright crawler
 * @param {Object} options - Crawler options
 * @param {string} options.seedUrl - The starting URL to crawl
 * @param {Object} options.config - Crawler configuration settings
 * @param {Function} options.requestHandler - Function to handle each page
 * @returns {PlaywrightCrawler} Configured crawler instance
 */
export function createCrawler({ seedUrl, config, requestHandler }) {
    // Extract the base domain from the seed URL for internal link filtering
    const seedUrlObj = new URL(seedUrl);
    const baseDomain = seedUrlObj.hostname;

    // Configure Crawlee to use local storage
    Configuration.getGlobalConfig().set('persistStorage', false);

    const crawler = new PlaywrightCrawler({
        // Rate limiting
        maxRequestsPerMinute: config.crawler.maxRequestsPerMinute,

        // Concurrency settings
        maxConcurrency: config.crawler.maxConcurrency,

        // Timeout for each request
        requestHandlerTimeoutSecs: config.crawler.requestHandlerTimeoutSecs,

        // Retry settings
        maxRequestRetries: config.crawler.maxRequestRetries,

        // Browser launch options
        launchContext: {
            launchOptions: {
                headless: config.crawler.headless,
            },
        },

        // Main request handler
        async requestHandler(context) {
            const { request, page, enqueueLinks, log } = context;

            log.info(`Processing: ${request.url}`);

            // Call the provided request handler
            await requestHandler(context);

            // Enqueue only internal links (same domain)
            await enqueueLinks({
                strategy: 'same-domain',
                transformRequestFunction: (req) => {
                    // Skip non-HTTP URLs
                    if (!req.url.startsWith('http')) {
                        return false;
                    }

                    // Skip common non-content URLs
                    const skipPatterns = [
                        /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz)$/i,
                        /\.(jpg|jpeg|png|gif|svg|webp|ico|bmp)$/i,
                        /\.(mp3|mp4|avi|mov|wmv|flv|webm)$/i,
                        /\.(css|js|json|xml)$/i,
                        /#.*$/,
                        /\?.*print/i,
                        /\/feed\/?$/i,
                        /\/rss\/?$/i,
                    ];

                    for (const pattern of skipPatterns) {
                        if (pattern.test(req.url)) {
                            return false;
                        }
                    }

                    return req;
                },
            });
        },

        // Handle failed requests
        failedRequestHandler({ request, log }) {
            log.error(`Request failed after retries: ${request.url}`);
        },
    });

    return crawler;
}

/**
 * Runs the crawler starting from the seed URL
 * @param {Object} options - Run options
 * @param {string} options.seedUrl - The starting URL to crawl
 * @param {Object} options.config - Crawler configuration
 * @param {Function} options.requestHandler - Function to handle each page
 * @returns {Promise<Object>} Crawl statistics
 */
export async function runCrawler({ seedUrl, config, requestHandler }) {
    const crawler = createCrawler({ seedUrl, config, requestHandler });

    console.log(`\nStarting crawl from: ${seedUrl}\n`);

    // Run the crawler with the seed URL
    await crawler.run([seedUrl]);

    // Return crawl statistics
    const stats = crawler.stats;
    return {
        requestsFinished: stats.state.requestsFinished,
        requestsFailed: stats.state.requestsFailed,
        requestsRetries: stats.state.requestsRetries,
    };
}

export default { createCrawler, runCrawler };
