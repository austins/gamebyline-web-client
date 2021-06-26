import { gql } from 'graphql-request';
import Posts from '../../../components/Posts';
import PostsPager from '../../../components/PostsPager';
import HeadWithTitle from '../../../components/HeadWithTitle';
import { postsQuery } from '../../../lib/data/queries';
import { flattenEdges } from '../../../lib/data/helpers';
import { graphqlFetcher } from '../../../lib/data/fetchers';

export default function Author({ page, slug, postsData }) {
    const posts = flattenEdges(postsData.posts);

    const { hasMore, hasPrevious } = postsData.posts.pageInfo.offsetPagination;

    const authorName = posts[0].author.node.name;

    return (
        <div>
            <HeadWithTitle title={authorName} noIndex />

            <Posts authorName={authorName} posts={posts} />
            <PostsPager authorSlug={slug} hasMore={hasMore} hasPrevious={hasPrevious} page={page} />
        </div>
    );
}

export async function getStaticProps({ params }) {
    const page = 1;
    const { slug } = params;

    const postsData = await graphqlFetcher(postsQuery, {
        authorSlug: slug,
        size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE),
    });

    if (!postsData.posts.edges.length) return { notFound: true };

    return {
        props: { page, slug, postsData },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const usersData = await graphqlFetcher(gql`
        query {
            users(first: 100, where: { hasPublishedPosts: POST }) {
                nodes {
                    slug
                }
            }
        }
    `);

    const users = usersData.users.nodes;

    const paths = users.map(user => ({
        params: { slug: user.slug },
    }));

    return { fallback: 'blocking', paths };
}
