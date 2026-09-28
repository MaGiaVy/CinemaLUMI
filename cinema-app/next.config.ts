import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      { source: '/admin', destination: '/admin/dashboard' },
      { source: '/admin-dashboard', destination: '/admin/dashboard' },
      { source: '/admin-reports', destination: '/admin/reports' },
      { source: '/staff-lookup', destination: '/staff/lookup' },
      { source: '/staff-dashboard', destination: '/staff' },
      // Chuyển tiếp nếu truy cập qua /movies/:id/edit sang trang admin
      { source: '/movies/:id/edit', destination: '/admin/movies/:id/edit' },
    ];
  },
};

export default nextConfig;
