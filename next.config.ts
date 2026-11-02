import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF trước (nhẹ hơn WebP khoảng 20–30% ở cùng độ nét), WebP cho trình duyệt cũ hơn.
    formats: ['image/avif', 'image/webp'],
    // 75 cho ảnh thẻ, 85 cho ảnh lớn (bìa, ảnh chương) nơi chi tiết được nhìn kỹ.
    qualities: [75, 85],
  },
};

export default nextConfig;
