/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app has no eslint-config-next; skip the build-time lint step (TypeScript type-checking
  // still runs). Product images come from Cloudinary / picsum via plain <img> (no next/image domains).
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
