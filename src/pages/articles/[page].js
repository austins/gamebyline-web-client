import isInt from 'validator/lib/isInt';
import { gql, useQuery } from 'urql';

import Error from 'next/error';
import Posts from '../../components/Posts';
import Breadcrumbs, { Crumb } from '../../components/Breadcrumbs';
import PostsPager from '../../components/PostsPager';
import HeadWithTitle from '../../components/HeadWithTitle';
import { postsQuery } from '../../lib/data/queries';
import { getUrqlClient, wrapUrqlClient } from '../../lib/data/urql';
import LoadingSpinner from '../../components/LoadingSpinner';
import { flattenEdges } from '../../lib/data/helpers';

const getPostsQueryVars = page => ({
    offset: page <= 1 ? 0 : (page - 1) * process.env.NEXT_PUBLIC_POSTS_PER_PAGE,
    size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE),
});

function PostsByPage({ page }) {
    const [result] = useQuery({
        query: postsQuery,
        variables: getPostsQueryVars(page),
    });

    const { data, fetching, error } = result;

    if (fetching) return <LoadingSpinner />;
    if (error) return <Error statusCode={500} title="Error retrieving articles" />;

    const posts = flattenEdges(data.posts);
    if (!posts.length) return <Error statusCode={404} title="Articles not found" />;

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

    const { urqlClient, ssrCache } = getUrqlClient();
    await urqlClient.query(postsQuery, getPostsQueryVars(page)).toPromise();

    return {
        props: { urqlState: ssrCache.extractData(), page },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const { urqlClient } = getUrqlClient();
    const { data } = await urqlClient
        .query(
            gql`
                query ($size: Int!) {
                    posts(
                        first: 100
                        where: {
                            status: PUBLISH
                            orderby: { field: DATE, order: DESC }
                            offsetPagination: { size: $size }
                        }
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
        )
        .toPromise();

    const paths = [];
    const totalPosts = data.posts.pageInfo.offsetPagination.total;
    for (let i = 1; i <= Math.ceil(totalPosts / process.env.NEXT_PUBLIC_POSTS_PER_PAGE); i++) {
        paths.push({ params: { page: i.toString() } });
    }

    return { fallback: 'blocking', paths };
}

export default wrapUrqlClient(PostsByPage);
