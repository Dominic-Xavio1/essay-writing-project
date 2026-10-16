/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a verification build run into its own folder while `next dev` keeps
  // using .next, e.g. NEXT_DIST_DIR=.next-verify npm run build
  distDir: process.env.NEXT_DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
