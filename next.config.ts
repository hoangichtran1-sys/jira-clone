import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
