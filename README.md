# Infinize Crawler

A demo web crawler for university websites using **Crawlee** and **Playwright**.

## Features

- Crawls university websites starting from a seed URL
- Extracts page titles, headings, main content, and internal links
- Configurable output formats: JSON, Markdown, HTML, Links
- File-only persistence (no database required)
- Interactive prompts for easy configuration

## Tech Stack

- **Node.js** (v18+)
- **Crawlee** - Web crawling orchestration (Apache-2.0)
- **Playwright** - Browser automation for JS-rendered pages (Apache-2.0)

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

You will be prompted for:
- **Seed URL**: The starting URL to crawl
- **University Name**: Used for organizing output files
- **Output Formats**: Choose from json, markdown, html, links

## Output

Extracted data is saved to the `output/` directory, organized by university name and format:

```
output/
└── university-name/
    ├── json/
    ├── markdown/
    ├── html/
    └── links/
```

## License

MIT
