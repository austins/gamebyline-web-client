import { gql } from 'graphql-request';
import { getPlaiceholder } from 'plaiceholder';
import Posts from '../../../components/Posts';
import PostsPager from '../../../components/PostsPager';
import HeadWithTitle from '../../../components/HeadWithTitle';
import { postsQuery } from '../../../lib/data/queries';
import { flattenEdges, generateFeaturedImagePlaceholders } from '../../../lib/data/helpers';
import { graphqlFetcher } from '../../../lib/data/fetchers';

export default function Category({ page, slug, postsData }) {
    const posts = flattenEdges(postsData.posts);
    const { hasMore, hasPrevious } = postsData.posts.pageInfo.offsetPagination;

    const categoryName = posts[0].categories.nodes[0].name;

    return (
        <>
            <HeadWithTitle title={categoryName} noIndex />

            <Posts categoryName={categoryName} posts={posts} />

            <PostsPager categorySlug={slug} hasMore={hasMore} hasPrevious={hasPrevious} page={page} />
        </>
    );
}

export async function getStaticProps({ params }) {
    const page = 1;
    const { slug } = params;

    const postsData = await graphqlFetcher(postsQuery, {
        categorySlug: slug,
        size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE),
    });

    if (!postsData.posts.edges.length) return { notFound: true };

    await generateFeaturedImagePlaceholders(getPlaiceholder, postsData.posts.edges);

    return {
        props: { page, slug, postsData },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const categoriesData = await graphqlFetcher(
        gql`
            query {
                categories(first: 100, where: { hideEmpty: true }) {
                    nodes {
                        slug
                    }
                }
            }
        `
    );

    const categories = categoriesData.categories.nodes;

    const paths = categories.map(category => ({
        params: { slug: category.slug },
    }));

    return { fallback: 'blocking', paths };
}
