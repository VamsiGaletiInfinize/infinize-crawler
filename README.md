# Infinize Crawler

A demo web crawler for university websites using **Crawlee** and **Playwright**.

## Features

- Crawls university websites starting from a seed URL
- Extracts page titles, headings, main content, and internal links
- Configurable output formats: JSON, Markdown, HTML, Links
- File-only persistence (no database required)
- Interactive prompts for easy configuration
- Graceful shutdown handling

## Tech Stack

- **Node.js** (v18+)
- **Crawlee** - Web crawling orchestration (Apache-2.0)
- **Playwright** - Browser automation for JS-rendered pages (Apache-2.0)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd infinize-crawler

# Install dependencies
npm install
```

## Usage

### Interactive Mode

Run the crawler with interactive prompts:

```bash
npm start
```

You will be prompted for:
- **Seed URL**: The starting URL to crawl (e.g., `https://university.edu`)
- **University Name**: Used for organizing output files (e.g., `Example University`)
- **Output Formats**: Choose from json, markdown, html, links (comma-separated)

### Example Session

```
========================================
   INFINIZE CRAWLER - University Crawler
========================================

Enter the seed URL (e.g., https://university.edu): https://example-university.edu
Enter the university name: Example University

Available formats: json, markdown, html, links
Default: json, markdown
Select output formats (comma-separated, or press Enter for default): json,markdown,links

  Selected formats: json, markdown, links

----------------------------------------
Starting crawl...
  Seed URL: https://example-university.edu
  University: Example University
  Formats: json, markdown, links
  Output: ./output/example-university/
----------------------------------------

Processing: https://example-university.edu
  Processed 10 pages...
  Processed 20 pages...

========================================
   CRAWL COMPLETE
========================================
  Pages processed: 25
  Files saved: 50
  Requests finished: 25
  Requests failed: 0
========================================

Done! Check the output directory for results.
```

## Output Formats

### JSON

Structured JSON files containing all extracted data:

```json
{
  "url": "https://example-university.edu/about",
  "title": "About Us",
  "headings": {
    "h1": ["About Example University"],
    "h2": ["History", "Mission", "Values"],
    "h3": []
  },
  "mainText": "Example University was founded in...",
  "internalLinks": [
    "https://example-university.edu/contact",
    "https://example-university.edu/history"
  ],
  "crawledAt": "2025-12-29T10:30:00.000Z"
}
```

### Markdown

Human-readable Markdown files with structured content:

```markdown
# About Us

**URL:** https://example-university.edu/about
**Crawled:** 2025-12-29T10:30:00.000Z

---

## Page Structure

### H1 Headings
- About Example University

### H2 Headings
- History
- Mission
- Values

---

## Content

Example University was founded in...

---

## Internal Links

- [https://example-university.edu/contact](https://example-university.edu/contact)
```

### HTML

Styled HTML reports for browser viewing with sections for structure, content, and links.

### Links

Aggregated list of all discovered internal links (JSON and TXT formats):

```json
{
  "universityName": "Example University",
  "seedUrl": "https://example-university.edu",
  "totalLinks": 150,
  "generatedAt": "2025-12-29T10:30:00.000Z",
  "links": [
    "https://example-university.edu/",
    "https://example-university.edu/about",
    ...
  ]
}
```

## Output Directory Structure

```
output/
└── example-university/
    ├── json/
    │   ├── index.json
    │   ├── about.json
    │   └── admissions.json
    ├── markdown/
    │   ├── index.md
    │   ├── about.md
    │   └── admissions.md
    ├── html/
    │   ├── index.html
    │   ├── about.html
    │   └── admissions.html
    └── links/
        ├── all-links.json
        └── all-links.txt
```

## Configuration

Default settings are in `config/default.config.js`:

```javascript
export default {
    crawler: {
        maxRequestsPerMinute: 60,
        maxConcurrency: 5,
        requestHandlerTimeoutSecs: 60,
        maxRequestRetries: 3,
        headless: true,
    },
    output: {
        baseDir: './output',
        availableFormats: ['json', 'markdown', 'html', 'links'],
        defaultFormats: ['json', 'markdown'],
    },
    extraction: {
        mainContentSelectors: ['main', 'article', '[role="main"]', ...],
        excludeSelectors: ['nav', 'header', 'footer', ...],
    },
};
```

## Debug Mode

For verbose error output, run with the DEBUG environment variable:

```bash
DEBUG=1 npm start
```

## Project Structure

```
infinize-crawler/
├── package.json              # Dependencies and scripts
├── config/
│   └── default.config.js     # Default configuration
├── src/
│   ├── index.js              # CLI entry point
│   ├── crawler.js            # Crawlee + Playwright setup
│   ├── handlers/
│   │   └── pageHandler.js    # Page data extraction
│   ├── formatters/
│   │   ├── index.js          # Formatter registry
│   │   ├── jsonFormatter.js
│   │   ├── markdownFormatter.js
│   │   ├── htmlFormatter.js
│   │   └── linksFormatter.js
│   └── utils/
│       ├── fileWriter.js     # File I/O utilities
│       ├── sanitizer.js      # Filename sanitization
│       └── urlUtils.js       # URL utilities
├── output/                   # Generated output (gitignored)
└── storage/                  # Crawlee storage (gitignored)
```

## Constraints

This demo application follows strict constraints:

- **No databases** - File system only for persistence
- **No external storage** - All data stored locally
- **No AGPL libraries** - Only Apache-2.0 and MIT licensed dependencies
- **JavaScript only** - Node.js with ES modules

## License

MIT
