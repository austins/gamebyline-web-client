module.exports = {
    images: {
        domains: [
            new URL(process.env.NEXT_PUBLIC_SITE_URL).host,
            new URL(process.env.API_GRAPHQL_URL).host,
            'secure.gravatar.com',
        ],
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
