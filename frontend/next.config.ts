/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow CORS images from the backend for QR codes
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
    ],
  },
};

export default nextConfig;
