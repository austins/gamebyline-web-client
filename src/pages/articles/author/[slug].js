import { gql } from '@apollo/client';
import Posts from '../../../components/Posts';
import postsQuery from '../../../lib/data/queries/Posts.gql';
import { apolloClient, flattenEdges } from '../../../lib/data/apollo';
import PostsPager from '../../../components/PostsPager';
import HeadWithTitle from '../../../components/HeadWithTitle';

export default function Author({ authorName, hasMore, hasPrevious, page, posts, slug }) {
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
    const { data } = await apolloClient.query({
        query: postsQuery,
        variables: { authorSlug: slug, size: Number(process.env.POSTS_PER_PAGE) },
    });

    const posts = flattenEdges(data.posts);
    if (!posts.length) return { notFound: true };

    const { hasMore, hasPrevious } = data.posts.pageInfo.offsetPagination;

    return {
        props: {
            authorName: posts[0].author.node.name,
            hasMore,
            hasPrevious,
            page,
            posts,
            slug,
        },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const { data } = await apolloClient.query({
        query: gql`
            query {
                users(where: { hasPublishedPosts: POST }) {
                    nodes {
                        slug
                    }
                }
            }
        `,
    });

    const users = data.users.nodes;

    const paths = users.map(user => ({
        params: { slug: user.slug },
    }));

    return { fallback: 'blocking', paths };
}
