/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['flowbite.com', 'images.unsplash.com', "res.cloudinary.com", "placehold.co"],
  },
  // Increase API route body size limit to handle large image uploads
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Configure API routes to handle larger payloads
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

module.exports = nextConfig;