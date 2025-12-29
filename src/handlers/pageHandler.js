/**
 * Page Handler - Extracts structured data from crawled pages
 */

/**
 * Extracts all headings from the page
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<Object>} Object containing arrays of h1, h2, h3 headings
 */
async function extractHeadings(page) {
    const headings = {
        h1: [],
        h2: [],
        h3: [],
    };

    // Extract H1 headings
    headings.h1 = await page.$$eval('h1', (elements) =>
        elements
            .map((el) => el.textContent?.trim())
            .filter((text) => text && text.length > 0)
    );

    // Extract H2 headings
    headings.h2 = await page.$$eval('h2', (elements) =>
        elements
            .map((el) => el.textContent?.trim())
            .filter((text) => text && text.length > 0)
    );

    // Extract H3 headings
    headings.h3 = await page.$$eval('h3', (elements) =>
        elements
            .map((el) => el.textContent?.trim())
            .filter((text) => text && text.length > 0)
    );

    return headings;
}

/**
 * Extracts the main content text from the page
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {Object} config - Extraction configuration
 * @returns {Promise<string>} Main content text
 */
async function extractMainContent(page, config) {
    const { mainContentSelectors, excludeSelectors } = config.extraction;

    // Try each main content selector in order
    for (const selector of mainContentSelectors) {
        const element = await page.$(selector);
        if (element) {
            // Get text content, excluding specified elements
            const text = await page.evaluate(
                ({ selector, excludeSelectors }) => {
                    const mainEl = document.querySelector(selector);
                    if (!mainEl) return '';

                    // Clone the element to avoid modifying the page
                    const clone = mainEl.cloneNode(true);

                    // Remove excluded elements
                    excludeSelectors.forEach((excludeSelector) => {
                        clone
                            .querySelectorAll(excludeSelector)
                            .forEach((el) => el.remove());
                    });

                    // Get and clean the text content
                    return clone.textContent
                        ?.replace(/\s+/g, ' ')
                        .trim() || '';
                },
                { selector, excludeSelectors }
            );

            if (text && text.length > 100) {
                return text;
            }
        }
    }

    // Fallback: extract from body, excluding common non-content areas
    const bodyText = await page.evaluate((excludeSelectors) => {
        const body = document.body;
        if (!body) return '';

        const clone = body.cloneNode(true);

        // Remove excluded elements
        excludeSelectors.forEach((selector) => {
            clone.querySelectorAll(selector).forEach((el) => el.remove());
        });

        return clone.textContent
            ?.replace(/\s+/g, ' ')
            .trim() || '';
    }, excludeSelectors);

    return bodyText;
}

/**
 * Extracts all internal links from the page
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {string} baseDomain - The base domain for filtering internal links
 * @returns {Promise<string[]>} Array of internal URLs
 */
async function extractInternalLinks(page, baseDomain) {
    const links = await page.$$eval('a[href]', (elements) =>
        elements
            .map((el) => el.href)
            .filter((href) => href && href.startsWith('http'))
    );

    // Filter to internal links only
    const internalLinks = links.filter((url) => {
        try {
            const urlObj = new URL(url);
            return (
                urlObj.hostname === baseDomain ||
                urlObj.hostname.endsWith('.' + baseDomain)
            );
        } catch {
            return false;
        }
    });

    // Remove duplicates and sort
    return [...new Set(internalLinks)].sort();
}

/**
 * Extracts structured data from a page
 * @param {Object} context - Crawlee request handler context
 * @param {Object} config - Extraction configuration
 * @returns {Promise<Object>} Extracted page data
 */
export async function extractPageData({ page, request }, config) {
    const url = request.url;
    const baseDomain = new URL(url).hostname;

    // Extract page title
    const title = await page.title();

    // Extract headings
    const headings = await extractHeadings(page);

    // Extract main content
    const mainText = await extractMainContent(page, config);

    // Extract internal links
    const internalLinks = await extractInternalLinks(page, baseDomain);

    return {
        url,
        title: title || '',
        headings,
        mainText,
        internalLinks,
        crawledAt: new Date().toISOString(),
    };
}

/**
 * Creates a request handler function for the crawler
 * @param {Object} options - Handler options
 * @param {Object} options.config - Extraction configuration
 * @param {Function} options.onPageData - Callback when page data is extracted
 * @returns {Function} Request handler function
 */
export function createPageHandler({ config, onPageData }) {
    return async function handlePage(context) {
        const { request, log } = context;

        try {
            // Extract data from the page
            const pageData = await extractPageData(context, config);

            log.info(`Extracted: ${pageData.title || request.url}`);
            log.debug(`  - ${pageData.headings.h1.length} H1, ${pageData.headings.h2.length} H2, ${pageData.headings.h3.length} H3`);
            log.debug(`  - ${pageData.internalLinks.length} internal links`);

            // Call the callback with extracted data
            if (onPageData) {
                await onPageData(pageData);
            }

            return pageData;
        } catch (error) {
            log.error(`Failed to extract data from ${request.url}: ${error.message}`);
            throw error;
        }
    };
}

export default { extractPageData, createPageHandler };
