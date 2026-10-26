import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Old links from before Snapit moved under /snapit.
      { source: "/scenes/:path*", destination: "/snapit/scenes/:path*", permanent: false },
    ];
  },
  // Scene configs are read with fs at runtime; make sure they ship with the API functions.
  outputFileTracingIncludes: {
    "/snapit/api/**/*": ["./public/snapit/scenes/**/*"],
  },
};

export default nextConfig;
