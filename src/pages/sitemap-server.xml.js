import { getServerSideSitemap } from "next-sitemap";
import has from "lodash/has";
import { graphqlFetcher } from "../lib/data/fetchers";
import { pagePathsQuery, postPathsQuery } from "../lib/data/queries";

function SitemapUrl(loc, lastmod, priority = "0.5", changefreq = "daily") {
    this.loc = loc;
    this.lastmod = lastmod;
    this.priority = priority;
    this.changefreq = changefreq;
}

export default function SitemapServer() {}

export async function getServerSideProps(context) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const fields = [];

    // Get paths.
    const pagesData = await graphqlFetcher(pagePathsQuery);
    const postsData = await graphqlFetcher(postPathsQuery);

    // Root url.
    fields.push(
        new SitemapUrl(
            siteUrl,
            has(postsData, "posts.nodes[0].modifiedGmt")
                ? new Date(`${postsData.posts.nodes[0].modifiedGmt}Z`).toISOString()
                : new Date().toISOString()
        )
    );

    // Page urls.
    pagesData.pages.nodes.forEach((page) => {
        fields.push(new SitemapUrl(`${siteUrl}/${page.slug}`, new Date(`${page.modifiedGmt}Z`).toISOString(), "0.7"));
    });

    // Post urls.
    postsData.posts.nodes.forEach((post) => {
        fields.push(new SitemapUrl(`${siteUrl}${post.uri}`, new Date(`${post.modifiedGmt}Z`).toISOString(), "0.7"));
    });

    return getServerSideSitemap(context, fields);
}
