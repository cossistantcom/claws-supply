import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
