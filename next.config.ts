import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    transpilePackages: ["@appwrite.io/react"],
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "sgp.cloud.appwrite.io",
            },
        ],
    },
};

export default nextConfig;
