import isInt from 'validator/lib/isInt';
import Error from 'next/error';
import { gql } from 'graphql-request';
import useSWR from 'swr';
import memoize from 'fast-memoize';
import Posts from '../../components/Posts';
import Breadcrumbs, { Crumb } from '../../components/Breadcrumbs';
import PostsPager from '../../components/PostsPager';
import HeadWithTitle from '../../components/HeadWithTitle';
import { postsQuery } from '../../lib/data/queries';
import LoadingSpinner from '../../components/LoadingSpinner';
import { flattenEdges } from '../../lib/data/helpers';
import { graphqlFetcher } from '../../lib/data/fetchers';

const getPostsQueryVars = memoize(page => ({
    offset: page <= 1 ? 0 : (page - 1) * process.env.NEXT_PUBLIC_POSTS_PER_PAGE,
    size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE),
}));

export default function PostsByPage({ page, initialPostsData }) {
    const { data, error } = useSWR([postsQuery, getPostsQueryVars(page)], graphqlFetcher, {
        initialData: initialPostsData,
    });

    if (!error && !data) return <LoadingSpinner />;
    if (error) return <Error statusCode={500} title="Error retrieving articles" />;

    const posts = flattenEdges(data.posts);

    const { hasMore, hasPrevious } = data.posts.pageInfo.offsetPagination;

    const crumbs = [new Crumb(`/articles/${page}`, `Page ${page}`)];
    const postsPager = <PostsPager hasMore={hasMore} hasPrevious={hasPrevious} page={page} />;

    return (
        <div>
            <HeadWithTitle title="Articles" />

            <Breadcrumbs crumbs={crumbs} />

            {postsPager}

            <Posts posts={posts} />

            {postsPager}
        </div>
    );
}

export async function getStaticProps({ params }) {
    const page = params.page && isInt(params.page, { min: 1, allow_leading_zeroes: false }) ? Number(params.page) : 1;

    const initialPostsData = await graphqlFetcher(postsQuery, getPostsQueryVars(page));

    if (!initialPostsData.posts.edges.length) return { notFound: true };

    return {
        props: { page, initialPostsData },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const postsData = await graphqlFetcher(
        gql`
            query ($size: Int!) {
                posts(
                    first: 100
                    where: { status: PUBLISH, orderby: { field: DATE, order: DESC }, offsetPagination: { size: $size } }
                ) {
                    pageInfo {
                        offsetPagination {
                            total
                        }
                    }
                }
            }
        `,
        { size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE) }
    );

    const paths = [];
    const totalPosts = postsData.posts.pageInfo.offsetPagination.total;
    for (let i = 1; i <= Math.ceil(totalPosts / process.env.NEXT_PUBLIC_POSTS_PER_PAGE); i++) {
        paths.push({ params: { page: i.toString() } });
    }

    return { fallback: 'blocking', paths };
}
