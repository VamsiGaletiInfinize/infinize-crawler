/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable server actions for form handling
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
    // Ignore crawler directory during Next.js build
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                child_process: false,
                path: false,
            };
        }
        return config;
    },
};

export default nextConfig;
