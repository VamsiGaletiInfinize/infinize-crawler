import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

interface StartRequest {
    seedUrl: string;
    universityName: string;
    outputFormats?: string[];
}

// Store for active crawls to prevent duplicates
const activeCrawls = new Set<string>();

/**
 * Dynamically import and run the crawler
 * This runs asynchronously without blocking the API response
 */
async function runCrawlerAsync(seedUrl: string, universityName: string, crawlId: string) {
    try {
        // Dynamic imports for crawler modules
        const { runCrawler } = await import('../../../../crawler/crawler.js');
        const { createPageHandler } = await import('../../../../crawler/handlers/pageHandler.js');
        const { updateProgress, completeProgress, failProgress } = await import('../../../../crawler/progressWriter.js');
        const { initSingleFile, appendToSingleFile, finalizeSingleFile } = await import('../../../../crawler/singleFileFormatter.js');
        const defaultConfig = (await import('../../../../config/default.config.js')).default;

        const config = defaultConfig;
        const baseDir = config.output.baseDir;

        // Initialize single file output
        const outputFilePath = await initSingleFile({
            baseDir,
            universityName,
            seedUrl,
        });

        // Track statistics
        let pagesProcessed = 0;
        let totalEnqueued = 1;
        const processedUrls = new Set<string>();

        // Create page handler with progress updates
        const pageHandler = createPageHandler({
            config,
            onPageData: async (pageData: { url: string; [key: string]: unknown }) => {
                if (processedUrls.has(pageData.url)) {
                    return;
                }
                processedUrls.add(pageData.url);
                pagesProcessed++;

                await appendToSingleFile({
                    baseDir,
                    universityName,
                    pageData,
                });

                await updateProgress({
                    baseDir,
                    universityName,
                    pagesProcessed,
                    totalEnqueued,
                    currentUrl: pageData.url,
                });
            },
            onEnqueue: (count: number) => {
                totalEnqueued = count;
            },
        });

        // Run the crawler
        await runCrawler({
            seedUrl,
            config,
            requestHandler: pageHandler,
            onQueueUpdate: (count: number) => {
                totalEnqueued = Math.max(totalEnqueued, count);
            },
        });

        // Finalize
        await finalizeSingleFile({
            baseDir,
            universityName,
            pagesProcessed,
            seedUrl,
        });

        await completeProgress({
            baseDir,
            universityName,
            pagesProcessed,
            outputFile: outputFilePath,
        });

        console.log(`Crawl completed for ${universityName}: ${pagesProcessed} pages`);
    } catch (error) {
        console.error(`Crawl failed for ${universityName}:`, error);

        const defaultConfig = (await import('../../../../config/default.config.js')).default;
        const { failProgress } = await import('../../../../crawler/progressWriter.js');

        await failProgress({
            baseDir: defaultConfig.output.baseDir,
            universityName,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    } finally {
        activeCrawls.delete(crawlId);
    }
}

/**
 * POST /api/crawl/start
 * Starts a new crawl asynchronously
 */
export async function POST(request: NextRequest) {
    try {
        const body: StartRequest = await request.json();
        const { seedUrl, universityName } = body;

        // Validate required fields
        if (!seedUrl) {
            return NextResponse.json(
                { success: false, error: 'seedUrl is required' },
                { status: 400 }
            );
        }

        if (!universityName) {
            return NextResponse.json(
                { success: false, error: 'universityName is required' },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            const url = new URL(seedUrl);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                throw new Error('Invalid protocol');
            }
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid URL format. Must be http or https.' },
                { status: 400 }
            );
        }

        // Generate crawlId
        const crawlId = universityName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        // Check if crawl is already running
        if (activeCrawls.has(crawlId)) {
            return NextResponse.json(
                { success: false, error: 'A crawl for this university is already running' },
                { status: 409 }
            );
        }

        // Initialize progress file
        const baseDir = process.env.OUTPUT_DIR || './output';
        const progressDir = path.join(process.cwd(), baseDir, crawlId);
        const progressPath = path.join(progressDir, 'progress.json');

        await fs.mkdir(progressDir, { recursive: true });

        const initialProgress = {
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

        await fs.writeFile(progressPath, JSON.stringify(initialProgress, null, 2), 'utf8');

        // Mark as active and start crawl asynchronously (don't await)
        activeCrawls.add(crawlId);
        runCrawlerAsync(seedUrl, universityName, crawlId);

        console.log(`Started crawler for: ${universityName}`);

        return NextResponse.json({
            success: true,
            crawlId,
            message: 'Crawler started successfully',
        });
    } catch (error) {
        console.error('Failed to start crawler:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to start crawler',
            },
            { status: 500 }
        );
    }
}
