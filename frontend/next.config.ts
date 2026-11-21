import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets-prod.grocer.nz",
        pathname: "/public/product_images/**",
      },
      {
        protocol: "https",
        hostname: "a.fsimg.co.nz",
        pathname: "/product/retail/fan/image/**",
      },
      {
        protocol: "https",
        hostname: "assets.woolworths.com.au",
        pathname: "/images/2010/**",
      },
    ],
  },
};

export default nextConfig;
