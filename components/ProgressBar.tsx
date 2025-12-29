'use client';

import { useEffect, useState } from 'react';

interface Progress {
    status: 'starting' | 'running' | 'completed' | 'failed' | 'not_found';
    pagesProcessed: number;
    totalEnqueued: number;
    currentUrl: string;
    startTime: string;
    endTime: string | null;
    error?: string;
    outputFile?: string;
}

interface ProgressBarProps {
    crawlId: string;
    onComplete: () => void;
}

export default function ProgressBar({ crawlId, onComplete }: ProgressBarProps) {
    const [progress, setProgress] = useState<Progress | null>(null);
    const [polling, setPolling] = useState(true);

    useEffect(() => {
        if (!polling) return;

        const pollProgress = async () => {
            try {
                const res = await fetch(`/api/crawl/status?crawlId=${encodeURIComponent(crawlId)}`);
                const data = await res.json();
                setProgress(data);

                if (data.status === 'completed' || data.status === 'failed') {
                    setPolling(false);
                    onComplete();
                }
            } catch (err) {
                console.error('Failed to fetch progress:', err);
            }
        };

        // Initial fetch
        pollProgress();

        // Poll every second
        const interval = setInterval(pollProgress, 1000);

        return () => clearInterval(interval);
    }, [crawlId, polling, onComplete]);

    if (!progress) {
        return (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600">Initializing crawler...</p>
                </div>
            </div>
        );
    }

    const percentage =
        progress.totalEnqueued > 0
            ? Math.min(Math.round((progress.pagesProcessed / progress.totalEnqueued) * 100), 100)
            : 0;

    const statusConfig = {
        starting: { color: 'bg-yellow-500', text: 'STARTING', bgLight: 'bg-yellow-50' },
        running: { color: 'bg-blue-500', text: 'RUNNING', bgLight: 'bg-blue-50' },
        completed: { color: 'bg-green-500', text: 'COMPLETED', bgLight: 'bg-green-50' },
        failed: { color: 'bg-red-500', text: 'FAILED', bgLight: 'bg-red-50' },
        not_found: { color: 'bg-gray-500', text: 'NOT FOUND', bgLight: 'bg-gray-50' },
    };

    const config = statusConfig[progress.status] || statusConfig.not_found;

    return (
        <div className={`mt-8 p-6 rounded-lg ${config.bgLight} space-y-4`}>
            {/* Header with status and count */}
            <div className="flex items-center justify-between">
                <span
                    className={`px-3 py-1 rounded-full text-white text-sm font-medium ${config.color}`}
                >
                    {config.text}
                </span>
                <span className="text-gray-600 text-sm font-medium">
                    {progress.pagesProcessed} / {progress.totalEnqueued} pages
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                    className={`h-4 rounded-full transition-all duration-500 ease-out ${
                        progress.status === 'completed'
                            ? 'bg-green-500'
                            : progress.status === 'failed'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Percentage */}
            <div className="text-center text-2xl font-bold text-gray-700">{percentage}%</div>

            {/* Current URL */}
            {progress.currentUrl && progress.status === 'running' && (
                <div className="text-sm text-gray-600">
                    <span className="font-medium">Processing:</span>{' '}
                    <span className="truncate block">{progress.currentUrl}</span>
                </div>
            )}

            {/* Error Message */}
            {progress.error && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-medium">Error:</p>
                    <p className="text-sm">{progress.error}</p>
                </div>
            )}

            {/* Completion Message */}
            {progress.status === 'completed' && (
                <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg">
                    <p className="font-medium">Crawl completed successfully!</p>
                    <p className="text-sm">
                        Processed {progress.pagesProcessed} pages.
                    </p>
                    {progress.outputFile && (
                        <p className="text-sm mt-1">
                            Output: <code className="bg-green-200 px-1 rounded">{progress.outputFile}</code>
                        </p>
                    )}
                </div>
            )}

            {/* Time Info */}
            {progress.startTime && (
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                    Started: {new Date(progress.startTime).toLocaleString()}
                    {progress.endTime && (
                        <span className="ml-4">
                            Ended: {new Date(progress.endTime).toLocaleString()}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
