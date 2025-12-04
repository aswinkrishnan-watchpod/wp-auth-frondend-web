import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  output: "export", // enables next export
  images: {
    unoptimized: true, // disables image optimization (required for static hosting)
  }
};

export default nextConfig;
