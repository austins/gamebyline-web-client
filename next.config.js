module.exports = {
    future: {
        webpack5: true,
    },
    images: {
        domains: [new URL(process.env.NEXT_PUBLIC_SITE_URL).host],
    },
    webpack: config => {
        config.module.rules.push({
            exclude: /node_modules/,
            loader: 'graphql-tag/loader',
            test: /\.(graphql|gql)$/,
        });

        return config;
    },
};
