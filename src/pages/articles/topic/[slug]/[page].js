import isInt from 'validator/lib/isInt';
import Error from 'next/error';
import useSWR from 'swr';
import { gql } from 'graphql-request';
import memoize from 'fast-memoize';
import Posts from '../../../../components/Posts';
import Breadcrumbs, { Crumb } from '../../../../components/Breadcrumbs';
import PostsPager from '../../../../components/PostsPager';
import HeadWithTitle from '../../../../components/HeadWithTitle';
import { postsQuery } from '../../../../lib/data/queries';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import { flattenEdges } from '../../../../lib/data/helpers';
import { graphqlFetcher } from '../../../../lib/data/fetchers';

const getPostsQueryVars = memoize((slug, page) => ({
    categorySlug: slug,
    offset: page <= 1 ? 0 : (page - 1) * process.env.NEXT_PUBLIC_POSTS_PER_PAGE,
    size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE),
}));

export default function CategoryByPage({ page, slug, initialPostsData }) {
    const { data, error } = useSWR([postsQuery, getPostsQueryVars(slug, page)], graphqlFetcher, {
        initialData: initialPostsData,
    });

    if (!error && !data) return <LoadingSpinner />;
    if (error) return <Error statusCode={500} title="Error retrieving articles" />;

    const posts = flattenEdges(data.posts);
    const { hasMore, hasPrevious } = data.posts.pageInfo.offsetPagination;

    const categoryName = posts[0].categories.nodes[0].name;

    const crumbs = [
        new Crumb(`/articles/topic/${slug}`, categoryName),
        new Crumb(`/articles/topic/${slug}/${page}`, `Page ${page}`),
    ];
    const postsPager = <PostsPager categorySlug={slug} hasMore={hasMore} hasPrevious={hasPrevious} page={page} />;

    return (
        <div>
            <HeadWithTitle title={categoryName} noIndex />

            <Breadcrumbs crumbs={crumbs} />

            {postsPager}

            <Posts categoryName={categoryName} posts={posts} />

            {postsPager}
        </div>
    );
}

export async function getStaticProps({ params }) {
    const { slug } = params;
    const page = params.page && isInt(params.page, { min: 1, allow_leading_zeroes: false }) ? Number(params.page) : 1;

    const initialPostsData = await graphqlFetcher(postsQuery, getPostsQueryVars(slug, page));
    if (!initialPostsData.posts.edges.length) return { notFound: true };

    return {
        props: { page, slug, initialPostsData },
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
