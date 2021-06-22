import Error from 'next/error';
import { gql } from 'graphql-request';
import useSWR from 'swr';
import memoize from 'fast-memoize';
import Posts from '../../../components/Posts';
import PostsPager from '../../../components/PostsPager';
import HeadWithTitle from '../../../components/HeadWithTitle';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { postsQuery } from '../../../lib/data/queries';
import { flattenEdges } from '../../../lib/data/helpers';
import { graphqlFetcher } from '../../../lib/data/fetchers';

const getPostsQueryVars = memoize(slug => ({ authorSlug: slug, size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE) }));

export default function Author({ page, slug, initialPostsData }) {
    const { data, error } = useSWR([postsQuery, getPostsQueryVars(slug)], graphqlFetcher, {
        initialData: initialPostsData,
    });

    if (!error && !data) return <LoadingSpinner />;
    if (error) return <Error statusCode={500} title="Error retrieving articles" />;

    const posts = flattenEdges(data.posts);

    const { hasMore, hasPrevious } = data.posts.pageInfo.offsetPagination;

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

    const initialPostsData = await graphqlFetcher(postsQuery, getPostsQueryVars(slug));
    if (!initialPostsData.posts.edges.length) return { notFound: true };

    return {
        props: { page, slug, initialPostsData },
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
