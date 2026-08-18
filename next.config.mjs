/** @type {import('next').NextConfig} */
const nextConfig = {
  // Windows without Developer Mode cannot create the standalone symlinks.
  // Docker/CI leave this flag unset and always build the production image.
  ...(process.env.DISABLE_STANDALONE === "true" ? {} : { output: "standalone" }),
  images: {
    unoptimized: true,
    qualities: [75, 95],
  },
}

export default nextConfig
