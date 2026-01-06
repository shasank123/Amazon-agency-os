/** @type {import('next').NextConfig} */
const nextConfig = {
    // Proxy API calls to FastAPI backend
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8000/:path*',
            },
        ]
    },
}

export default nextConfig
