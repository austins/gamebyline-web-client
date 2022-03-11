const { withPlugins, optional } = require("next-compose-plugins");
const { withPlaiceholder } = require("@plaiceholder/next");

const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    experimental: { outputStandalone: true },
    images: {
        domains: [
            new URL(process.env.NEXT_PUBLIC_SITE_URL).host,
            new URL(process.env.NEXT_PUBLIC_API_GRAPHQL_URL).host,
        ],
        deviceSizes: [540, 720, 960, 1140],
        imageSizes: [16, 32, 64, 128],
    },
    poweredByHeader: false,
};

module.exports = withPlugins(
    [
        [optional(() => require("@next/bundle-analyzer")({ enabled: process.env.ANALYZE === "true" }))],
        [withPlaiceholder],
    ],
    nextConfig
);
