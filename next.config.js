/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['flowbite.com', 'images.unsplash.com', "res.cloudinary.com", "placehold.co"],
  },
  eslint: {
    // This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This allows production builds to successfully complete even if
    // your project has TypeScript type errors.
    ignoreBuildErrors: true,
  },
  // Increase API route body size limit to handle large image uploads
  serverExternalPackages: [],
};

module.exports = nextConfig;