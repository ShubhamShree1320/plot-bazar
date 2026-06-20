import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["54.208.40.170"],
  transpilePackages: ["mapbox-gl", "react-map-gl"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  serverExternalPackages: ["bcryptjs", "nodemailer", "twilio", "pg", "@prisma/adapter-pg", "@prisma/client", "@prisma/extension-accelerate"],
};

export default nextConfig;
