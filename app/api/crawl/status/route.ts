import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface Progress {
    status: 'starting' | 'running' | 'completed' | 'failed';
    pagesProcessed: number;
    totalEnqueued: number;
    currentUrl: string;
    startTime: string;
    endTime: string | null;
    seedUrl: string;
    universityName: string;
    error: string | null;
    outputFile: string | null;
}

/**
 * GET /api/crawl/status
 * Returns the current crawl progress for a university
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const crawlId = searchParams.get('crawlId');

    if (!crawlId) {
        return NextResponse.json(
            { error: 'crawlId parameter is required' },
            { status: 400 }
        );
    }

    // Sanitize crawlId to prevent path traversal
    const sanitizedId = crawlId
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    if (sanitizedId !== crawlId) {
        return NextResponse.json(
            { error: 'Invalid crawlId format' },
            { status: 400 }
        );
    }

    const baseDir = process.env.OUTPUT_DIR || './output';
    const progressPath = path.join(process.cwd(), baseDir, sanitizedId, 'progress.json');

    try {
        const content = await fs.readFile(progressPath, 'utf8');
        const progress: Progress = JSON.parse(content);

        return NextResponse.json(progress);
    } catch (error) {
        // Check if file doesn't exist
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return NextResponse.json(
                {
                    status: 'not_found',
                    pagesProcessed: 0,
                    totalEnqueued: 0,
                    currentUrl: '',
                    startTime: '',
                    endTime: null,
                    error: 'Crawl not found or not started',
                },
                { status: 404 }
            );
        }

        console.error('Error reading progress:', error);
        return NextResponse.json(
            { error: 'Failed to read crawl status' },
            { status: 500 }
        );
    }
}
