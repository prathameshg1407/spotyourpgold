/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode:false,
  images: {
    domains: ['flowbite.com', 'images.unsplash.com',"res.cloudinary.com","placehold.co"],
  },
};

module.exports = nextConfig;