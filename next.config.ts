import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    allowedDevOrigins: [
        '192.168.1.*',
    ],
    experimental: {
        serverActions: {
            bodySizeLimit: '8mb',
        },
    },
};

export default nextConfig;
