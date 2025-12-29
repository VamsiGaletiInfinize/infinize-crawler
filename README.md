# Infinize Crawler

A demo web crawler for university websites using **Crawlee**, **Playwright**, and **Next.js**.

## Features

- **Web UI Admin Panel** - Start and monitor crawls from your browser
- **Live Progress Tracking** - Real-time progress bar with page counts
- **Background Processing** - Crawler runs as a detached process, doesn't block the UI
- **Single File Output** - Consolidated markdown file per university
- Extracts page titles, headings, main content, and internal links
- File-only persistence (no database required)

## Tech Stack

- **Next.js 14** - React framework for the admin UI
- **Tailwind CSS** - Styling
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

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000/admin](http://localhost:3000/admin) in your browser.

1. Enter the **Seed URL** (e.g., `https://university.edu`)
2. Enter the **University Name** (e.g., `Example University`)
3. Select **Output Formats** (optional)
4. Click **Start Crawl**
5. Watch the progress bar update in real-time

## Output

### Single Markdown File

The primary output is a consolidated markdown file:

```
output/<university-name>/<university-name>.md
```

Example content:

```markdown
# Example University

**Seed URL:** https://university.edu
**Pages Crawled:** 50
**Generated:** 2025-12-29T10:05:30.000Z

---

## Home Page
**URL:** https://university.edu
**Crawled:** 2025-12-29T10:00:05.000Z

Welcome to Example University...

---

## About Us
**URL:** https://university.edu/about
**Crawled:** 2025-12-29T10:00:10.000Z

Example University was founded in 1900...
```

### Progress Tracking

Progress is stored in:

```
output/<university-name>/progress.json
```

```json
{
  "status": "completed",
  "pagesProcessed": 50,
  "totalEnqueued": 50,
  "currentUrl": "https://university.edu/contact",
  "startTime": "2025-12-29T10:00:00.000Z",
  "endTime": "2025-12-29T10:05:30.000Z",
  "outputFile": "./output/example-university/example-university.md"
}
```

## API Endpoints

### POST /api/crawl/start

Start a new crawl.

**Request:**
```json
{
  "seedUrl": "https://university.edu",
  "universityName": "Example University",
  "outputFormats": ["markdown"]
}
```

**Response:**
```json
{
  "success": true,
  "crawlId": "example-university",
  "message": "Crawler started successfully"
}
```

### GET /api/crawl/status?crawlId=example-university

Get crawl progress.

**Response:**
```json
{
  "status": "running",
  "pagesProcessed": 25,
  "totalEnqueued": 100,
  "currentUrl": "https://university.edu/about"
}
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
    },
    extraction: {
        mainContentSelectors: ['main', 'article', '[role="main"]', ...],
        excludeSelectors: ['nav', 'header', 'footer', '.breadcrumb', ...],
    },
};
```

## Project Structure

```
infinize-crawler/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Redirect to /admin
│   ├── globals.css               # Tailwind imports
│   ├── admin/
│   │   └── page.tsx              # Admin UI page
│   └── api/
│       └── crawl/
│           ├── start/route.ts    # POST: Start crawler
│           └── status/route.ts   # GET: Poll progress
├── components/
│   ├── CrawlForm.tsx             # Form with inputs
│   ├── ProgressBar.tsx           # Live progress display
│   └── OutputFormatSelector.tsx  # Checkbox group
├── crawler/                      # Crawler logic
│   ├── crawler.js                # Crawlee + Playwright setup
│   ├── progressWriter.js         # Progress file management
│   ├── singleFileFormatter.js    # Single MD file output
│   ├── handlers/
│   │   └── pageHandler.js        # Page data extraction
│   └── utils/
│       ├── fileWriter.js         # File I/O utilities
│       ├── sanitizer.js          # Filename sanitization
│       └── urlUtils.js           # URL utilities
├── config/
│   └── default.config.js         # Default configuration
├── output/                       # Generated output (gitignored)
├── next.config.js
├── tailwind.config.cjs
├── postcss.config.cjs
├── tsconfig.json
└── package.json
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |

## License

MIT
