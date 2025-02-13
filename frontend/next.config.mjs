/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static exports
  basePath: process.env.NODE_ENV === 'production' ? '/trusted-travel-quick' : '',
  images: {
    unoptimized: true, // Required for static export
  },
}

export default nextConfig;
