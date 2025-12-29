'use client';

import { useState } from 'react';
import OutputFormatSelector from './OutputFormatSelector';
import ProgressBar from './ProgressBar';

export default function CrawlForm() {
    const [seedUrl, setSeedUrl] = useState('');
    const [universityName, setUniversityName] = useState('');
    const [formats, setFormats] = useState<string[]>(['markdown']);
    const [isRunning, setIsRunning] = useState(false);
    const [crawlId, setCrawlId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const res = await fetch('/api/crawl/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    seedUrl,
                    universityName,
                    outputFormats: formats,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setIsRunning(true);
                setCrawlId(data.crawlId);
            } else {
                setError(data.message || 'Failed to start crawler');
            }
        } catch (err) {
            setError('Failed to connect to server');
        }
    };

    const handleComplete = () => {
        setIsRunning(false);
    };

    const handleReset = () => {
        setSeedUrl('');
        setUniversityName('');
        setFormats(['markdown']);
        setCrawlId(null);
        setError(null);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Infinize Crawler
                </h1>
                <p className="text-gray-600 mb-8">
                    University website crawler admin panel
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Seed URL Input */}
                    <div>
                        <label
                            htmlFor="seedUrl"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Seed URL
                        </label>
                        <input
                            type="url"
                            id="seedUrl"
                            value={seedUrl}
                            onChange={(e) => setSeedUrl(e.target.value)}
                            placeholder="https://university.edu"
                            required
                            disabled={isRunning}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg
                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                     disabled:bg-gray-100 disabled:cursor-not-allowed
                                     transition-colors"
                        />
                    </div>

                    {/* University Name Input */}
                    <div>
                        <label
                            htmlFor="universityName"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            University Name
                        </label>
                        <input
                            type="text"
                            id="universityName"
                            value={universityName}
                            onChange={(e) => setUniversityName(e.target.value)}
                            placeholder="Stanford University"
                            required
                            disabled={isRunning}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg
                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                     disabled:bg-gray-100 disabled:cursor-not-allowed
                                     transition-colors"
                        />
                    </div>

                    {/* Output Format Selector */}
                    <OutputFormatSelector
                        selected={formats}
                        onChange={setFormats}
                        disabled={isRunning}
                    />

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isRunning}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium
                                 hover:bg-blue-700 transition-colors
                                 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        {isRunning ? 'Crawling...' : 'Start Crawl'}
                    </button>
                </form>

                {/* Progress Bar */}
                {isRunning && crawlId && (
                    <ProgressBar crawlId={crawlId} onComplete={handleComplete} />
                )}

                {/* Reset Button (shown after completion) */}
                {!isRunning && crawlId && (
                    <button
                        onClick={handleReset}
                        className="w-full mt-4 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium
                                 hover:bg-gray-300 transition-colors"
                    >
                        Start New Crawl
                    </button>
                )}
            </div>
        </div>
    );
}
