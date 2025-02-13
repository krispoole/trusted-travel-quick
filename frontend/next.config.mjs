/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static exports
  basePath: process.env.NODE_ENV === 'production' ? '/trusted-travel-quick' : '',
  images: {
    unoptimized: true, // Required for static export
  },
  // Disable server-side features when exporting
  experimental: {
    appDir: true,
  }
}

export default nextConfig;
