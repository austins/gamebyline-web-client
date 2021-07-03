const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

module.exports = {
    exclude: ['*'],
    priority: 0.5,
    generateRobotsTxt: true,
    robotsTxtOptions: {
        additionalSitemaps: [`${siteUrl}/sitemap-server.xml`],
    },
    siteUrl,
};
