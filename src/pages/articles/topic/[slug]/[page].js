import isInt from 'validator/lib/isInt';
import { gql } from 'graphql-request';
import { getPlaiceholder } from 'plaiceholder';
import Posts from '../../../../components/Posts';
import Breadcrumbs, { Crumb } from '../../../../components/Breadcrumbs';
import PostsPager from '../../../../components/PostsPager';
import HeadWithTitle from '../../../../components/HeadWithTitle';
import { postsQuery } from '../../../../lib/data/queries';
import { flattenEdges, generateFeaturedImagePlaceholders } from '../../../../lib/data/helpers';
import { graphqlFetcher } from '../../../../lib/data/fetchers';

export default function CategoryByPage({ page, slug, postsData }) {
    const posts = flattenEdges(postsData.posts);
    const { hasMore, hasPrevious } = postsData.posts.pageInfo.offsetPagination;

    const categoryName = posts[0].categories.nodes[0].name;

    const crumbs = [
        new Crumb(`/articles/topic/${slug}`, categoryName),
        new Crumb(`/articles/topic/${slug}/${page}`, `Page ${page}`),
    ];

    const postsPager = <PostsPager categorySlug={slug} hasMore={hasMore} hasPrevious={hasPrevious} page={page} />;

    return (
        <>
            <HeadWithTitle title={categoryName} noIndex />

            <Breadcrumbs crumbs={crumbs} />

            {postsPager}

            <Posts categoryName={categoryName} posts={posts} />

            {postsPager}
        </>
    );
}

export async function getStaticProps({ params }) {
    const { slug } = params;
    const page = params.page && isInt(params.page, { min: 1, allow_leading_zeroes: false }) ? Number(params.page) : 1;

    const postsData = await graphqlFetcher(postsQuery, {
        categorySlug: slug,
        offset: page <= 1 ? 0 : (page - 1) * process.env.NEXT_PUBLIC_POSTS_PER_PAGE,
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
    const categoriesData = await graphqlFetcher(gql`
        query {
            categories(first: 100, where: { hideEmpty: true }) {
                nodes {
                    slug
                }
            }
        }
    `);

    const paths = [];
    const categories = categoriesData.categories.nodes;
    for (const category of categories) {
        const postsData = await graphqlFetcher(
            gql`
                query ($categorySlug: String!, $size: Int!) {
                    posts(where: { status: PUBLISH, categoryName: $categorySlug, offsetPagination: { size: $size } }) {
                        pageInfo {
                            offsetPagination {
                                total
                            }
                        }
                    }
                }
            `,
            { categorySlug: category.slug, size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE) }
        );

        const totalPosts = postsData.posts.pageInfo.offsetPagination.total;
        for (let i = 1; i <= Math.ceil(totalPosts / process.env.NEXT_PUBLIC_POSTS_PER_PAGE); i++) {
            paths.push({ params: { page: i.toString(), slug: category.slug } });
        }
    }

    return { fallback: 'blocking', paths };
}
