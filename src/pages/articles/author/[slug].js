import { gql, useQuery } from 'urql';

import Error from 'next/error';
import Posts from '../../../components/Posts';
import PostsPager from '../../../components/PostsPager';
import HeadWithTitle from '../../../components/HeadWithTitle';
import { getUrqlClient, wrapUrqlClient } from '../../../lib/data/urql';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { postsQuery } from '../../../lib/data/queries';
import { flattenEdges } from '../../../lib/data/helpers';

const getPostsQueryVars = slug => ({ authorSlug: slug, size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE) });

function Author({ page, slug }) {
    const [result] = useQuery({
        query: postsQuery,
        variables: getPostsQueryVars(slug),
    });

    const { data, fetching, error } = result;

    if (fetching) return <LoadingSpinner />;
    if (error) return <Error statusCode={500} title="Error retrieving articles" />;

    const posts = flattenEdges(data.posts);
    if (!posts.length) return <Error statusCode={404} title="Articles not found" />;

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

    const { urqlClient, ssrCache } = getUrqlClient();
    await urqlClient.query(postsQuery, getPostsQueryVars(slug)).toPromise();

    return {
        props: {
            urqlState: ssrCache.extractData(),
            page,
            slug,
        },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const { urqlClient } = getUrqlClient();
    const { data } = await urqlClient
        .query(
            gql`
                query {
                    users(first: 100, where: { hasPublishedPosts: POST }) {
                        nodes {
                            slug
                        }
                    }
                }
            `
        )
        .toPromise();

    const users = data.users.nodes;

    const paths = users.map(user => ({
        params: { slug: user.slug },
    }));

    return { fallback: 'blocking', paths };
}

export default wrapUrqlClient(Author);
