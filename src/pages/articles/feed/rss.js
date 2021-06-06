import { Feed } from 'feed';
import striptags from 'striptags';
import postsQuery from '../../../lib/data/queries/Posts.gql';
import { apolloClient, flattenEdges } from '../../../lib/data/apollo';

export default function ArticlesRssFeed() {}

export async function getServerSideProps({ req, res }) {
    const { data } = await apolloClient.query({
        query: postsQuery,
        variables: { size: Number(process.env.POSTS_PER_PAGE) },
    });

    const posts = flattenEdges(data.posts);
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME;
    const siteLink =
        process.env.NEXT_PUBLIC_SITE_URL ?? `${req.headers['x-forwarded-proto'] ?? 'http'}://${req.headers.host}`;

    const feed = new Feed({
        description: `Latest articles from ${siteName}.`,
        language: 'en',
        link: siteLink,
        title: siteName,
        updated: posts.length ? new Date(`${posts[0].dateGmt}Z`) : null,
    });

    posts.forEach(post => {
        const postDate = new Date(`${post.dateGmt}Z`);
        const postLink = new URL(`/article/${postDate.getUTCFullYear()}/${post.slug}`, siteLink).href;

        feed.addItem({
            content: post.content,
            date: postDate,
            description: striptags(post.excerpt),
            id: postLink,
            image: post.featuredImage.node.mediaItemUrl ?? null,
            link: postLink,
            title: post.title,
        });
    });

    res.setHeader('Content-Type', 'text/xml');
    res.write(feed.rss2());
    res.end();

    return { props: {} };
}
