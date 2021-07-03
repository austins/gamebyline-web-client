const { withPlaiceholder } = require('@plaiceholder/next');

module.exports = withPlaiceholder({
    reactStrictMode: true,
    images: {
        domains: [
            new URL(process.env.NEXT_PUBLIC_SITE_URL).host,
            new URL(process.env.NEXT_PUBLIC_API_GRAPHQL_URL).host,
        ],
        deviceSizes: [540, 720, 960, 1140],
        imageSizes: [16, 32, 64, 128],
    },
    webpack: config => {
        config.module.rules.push({
            exclude: /node_modules/,
            loader: 'graphql-tag/loader',
            test: /\.(graphql|gql)$/,
        });

        return config;
    },
});
