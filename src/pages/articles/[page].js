import isInt from 'validator/lib/isInt';
import { gql } from '@apollo/client';
import Posts from '../../components/Posts';
import postsQuery from '../../lib/data/queries/Posts.gql';
import { apolloClient, flattenEdges } from '../../lib/data/apollo';
import Breadcrumbs, { Crumb } from '../../components/Breadcrumbs';
import PostsPager from '../../components/PostsPager';
import HeadWithTitle from '../../components/HeadWithTitle';

export default function PostsByPage({ hasMore, hasPrevious, page, posts }) {
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
    const { data } = await apolloClient.query({
        query: postsQuery,
        variables: {
            offset: page <= 1 ? 0 : (page - 1) * process.env.POSTS_PER_PAGE,
            size: Number(process.env.POSTS_PER_PAGE),
        },
    });

    const posts = flattenEdges(data.posts);
    if (!posts.length) return { notFound: true };

    const { hasMore, hasPrevious } = data.posts.pageInfo.offsetPagination;

    return {
        props: { hasMore, hasPrevious, page, posts },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const { data } = await apolloClient.query({
        query: gql`
            query ($size: Int!) {
                posts(
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
        variables: { size: Number(process.env.POSTS_PER_PAGE) },
    });

    const paths = [];
    const totalPosts = data.posts.pageInfo.offsetPagination.total;
    for (let i = 1; i <= Math.ceil(totalPosts / process.env.POSTS_PER_PAGE); i++) {
        paths.push({ params: { page: i.toString() } });
    }

    return { fallback: 'blocking', paths };
}
