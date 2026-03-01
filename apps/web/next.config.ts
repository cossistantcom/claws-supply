import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/welcome",
        destination: "/onboarding",
        permanent: true,
      },
      {
        source: "/choose-plan",
        destination: "/onboarding?step=2",
        permanent: true,
      },
    ];
  },
};

export default withMDX(nextConfig);
