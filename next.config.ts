import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
