import type { NextConfig } from "next";

// Sub-app served at the site root ("/"). Change it to point "/" at another sub-app.
const DEFAULT_APP = "/observeit";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Not permanent, so browsers don't cache it when DEFAULT_APP changes.
      { source: "/", destination: DEFAULT_APP, permanent: false },
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
