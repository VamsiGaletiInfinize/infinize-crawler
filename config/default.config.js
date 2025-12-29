/**
 * Default configuration for the Infinize Crawler
 */
export default {
    // Crawler behavior settings
    crawler: {
        // Maximum requests per minute (rate limiting)
        maxRequestsPerMinute: 60,

        // Number of concurrent browser contexts
        maxConcurrency: 5,

        // Timeout for each page request in seconds
        requestHandlerTimeoutSecs: 60,

        // Number of retries for failed requests
        maxRequestRetries: 3,

        // Run browser in headless mode
        headless: true,
    },

    // Output settings
    output: {
        // Base directory for output files
        baseDir: './output',

        // Available output formats
        availableFormats: ['json', 'markdown', 'html', 'links'],

        // Default formats if none specified
        defaultFormats: ['json', 'markdown'],
    },

    // Content extraction settings
    extraction: {
        // Selectors to find main content (tried in order)
        mainContentSelectors: [
            'main',
            'article',
            '[role="main"]',
            '.content',
            '#content',
            '.main-content',
            '#main-content',
        ],

        // Selectors to exclude from content extraction
        excludeSelectors: [
            // Navigation and structure
            'nav',
            'header',
            'footer',
            'aside',
            '.sidebar',
            '.navigation',
            '.menu',
            '[role="navigation"]',
            '[role="banner"]',
            '[role="contentinfo"]',

            // Ads and promotional
            '.ads',
            '.advertisement',
            '.ad-container',
            '.sponsored',
            '.promo',

            // Scripts and styles
            'script',
            'style',
            'noscript',
            'iframe',
            'svg',

            // Common UI elements
            '.breadcrumb',
            '.breadcrumbs',
            '[aria-label="breadcrumb"]',
            '.pagination',
            '.pager',
            '.social-share',
            '.social-links',
            '.share-buttons',
            '.cookie-notice',
            '.cookie-banner',
            '.cookie-consent',
            '.gdpr-notice',
            '#cookie-notice',
            '#cookie-banner',

            // Search and forms
            '.search-form',
            '.search-box',
            '#search',
            '.login-form',
            '.signup-form',

            // Comments and user content
            '.comments',
            '#comments',
            '.comment-form',
            '.related-posts',
            '.recommended',

            // Widgets
            '.widget',
            '.newsletter',
            '.subscribe',
            '.popup',
            '.modal',
            '.overlay',

            // Print and accessibility
            '.skip-link',
            '.screen-reader-text',
            '.sr-only',
            '.print-only',
        ],
    },
};
