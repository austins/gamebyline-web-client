import { gql } from '@apollo/client';
import Posts from '../../../components/Posts';
import postsQuery from '../../../lib/data/queries/Posts.gql';
import { apolloClient, flattenEdges } from '../../../lib/data/apollo';
import PostsPager from '../../../components/PostsPager';
import HeadWithTitle from '../../../components/HeadWithTitle';

export default function Category({ categoryName, hasMore, hasPrevious, page, posts, slug }) {
    return (
        <div>
            <HeadWithTitle title={categoryName} noIndex />

            <Posts categoryName={categoryName} posts={posts} />
            <PostsPager categorySlug={slug} hasMore={hasMore} hasPrevious={hasPrevious} page={page} />
        </div>
    );
}

export async function getStaticProps({ params }) {
    const page = 1;
    const { slug } = params;
    const { data } = await apolloClient.query({
        query: postsQuery,
        variables: { categorySlug: slug, size: Number(process.env.POSTS_PER_PAGE) },
    });

    const posts = flattenEdges(data.posts);
    if (!posts.length) return { notFound: true };

    const { hasMore, hasPrevious } = data.posts.pageInfo.offsetPagination;

    return {
        props: {
            categoryName: posts[0].categories.nodes[0].name,
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
                categories {
                    nodes {
                        slug
                    }
                }
            }
        `,
    });

    const categories = data.categories.nodes;

    const paths = categories.map(category => ({
        params: { slug: category.slug },
    }));

    return { fallback: 'blocking', paths };
}
