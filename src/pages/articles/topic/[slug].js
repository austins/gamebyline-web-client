import Error from 'next/error';
import useSWR from 'swr';
import { gql } from 'graphql-request';
import memoize from 'fast-memoize';
import Posts from '../../../components/Posts';
import PostsPager from '../../../components/PostsPager';
import HeadWithTitle from '../../../components/HeadWithTitle';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { postsQuery } from '../../../lib/data/queries';
import { flattenEdges } from '../../../lib/data/helpers';
import { graphqlFetcher } from '../../../lib/data/fetchers';

const getPostsQueryVars = memoize(slug => ({
    categorySlug: slug,
    size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE),
}));

export default function Category({ page, slug, initialPostsData }) {
    const { data, error } = useSWR([postsQuery, getPostsQueryVars(slug)], graphqlFetcher, {
        initialData: initialPostsData,
    });

    if (!error && !data) return <LoadingSpinner />;
    if (error) return <Error statusCode={500} title="Error retrieving articles" />;

    const posts = flattenEdges(data.posts);
    const { hasMore, hasPrevious } = data.posts.pageInfo.offsetPagination;

    const categoryName = posts[0].categories.nodes[0].name;

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

    const initialPostsData = await graphqlFetcher(postsQuery, getPostsQueryVars(slug));
    if (!initialPostsData.posts.edges.length) return { notFound: true };

    return {
        props: { page, slug, initialPostsData },
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
