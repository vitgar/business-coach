/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configure allowed image domains for profile pictures from authentication providers
  images: {
    domains: [
      'lh3.googleusercontent.com',  // Google profile images
      'platform-lookaside.fbsbx.com', // Facebook profile images
      'media.licdn.com',            // LinkedIn profile images
      'avatars.githubusercontent.com' // GitHub profile images
    ],
  },
}

export default nextConfig 