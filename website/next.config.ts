import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseStorageUrl = supabaseUrl ? new URL(supabaseUrl) : null;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: supabaseStorageUrl
      ? [
          {
            protocol: supabaseStorageUrl.protocol === "http:" ? "http" : "https",
            hostname: supabaseStorageUrl.hostname,
            pathname: `${supabaseStorageUrl.pathname.replace(/\/$/, "")}/storage/v1/object/public/vehicle-photos/**`,
          },
        ]
      : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
