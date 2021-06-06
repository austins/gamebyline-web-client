import Posts from '../components/Posts';
import postsQuery from '../lib/data/queries/Posts.gql';
import { apolloClient, flattenEdges } from '../lib/data/apollo';
import PostsPager from '../components/PostsPager';
import HeadWithTitle from '../components/HeadWithTitle';

export default function Home({ hasMore, hasPrevious, page, posts }) {
    return (
        <div>
            <HeadWithTitle />

            <Posts posts={posts} />

            <PostsPager hasMore={hasMore} hasPrevious={hasPrevious} page={page} />
        </div>
    );
}

export async function getStaticProps() {
    const page = 1;
    const { data } = await apolloClient.query({
        query: postsQuery,
        variables: { size: Number(process.env.POSTS_PER_PAGE) },
    });

    const posts = flattenEdges(data.posts);
    if (!posts.length) return { notFound: true };

    const { hasMore, hasPrevious } = data.posts.pageInfo.offsetPagination;

    return {
        props: { hasMore, hasPrevious, page, posts },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}
