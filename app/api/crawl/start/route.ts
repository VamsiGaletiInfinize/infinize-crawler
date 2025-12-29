import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

interface StartRequest {
    seedUrl: string;
    universityName: string;
    outputFormats?: string[];
}

/**
 * POST /api/crawl/start
 * Starts a new crawl as a background process
 */
export async function POST(request: NextRequest) {
    try {
        const body: StartRequest = await request.json();

        const { seedUrl, universityName, outputFormats = ['markdown'] } = body;

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

        // Generate crawlId from university name
        const crawlId = universityName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        // Initialize progress file before spawning
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

        // Path to the background runner
        const crawlerPath = path.join(process.cwd(), 'crawler', 'backgroundRunner.js');

        // Build arguments
        const args = [
            crawlerPath,
            '--seedUrl',
            seedUrl,
            '--universityName',
            universityName,
            '--formats',
            outputFormats.join(','),
        ];

        // Spawn the crawler as a detached child process
        const child = spawn('node', args, {
            detached: true,
            stdio: 'ignore',
            cwd: process.cwd(),
            env: {
                ...process.env,
                NODE_ENV: 'production',
            },
        });

        // Unref to allow parent to exit independently
        child.unref();

        console.log(`Started crawler process with PID: ${child.pid}`);

        return NextResponse.json({
            success: true,
            crawlId,
            message: 'Crawler started successfully',
            pid: child.pid,
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
