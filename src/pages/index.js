import { useQuery } from 'urql';
import Error from 'next/error';
import Posts from '../components/Posts';
import PostsPager from '../components/PostsPager';
import HeadWithTitle from '../components/HeadWithTitle';
import LoadingSpinner from '../components/LoadingSpinner';
import { getUrqlClient, wrapUrqlClient } from '../lib/data/urql';
import { postsQuery } from '../lib/data/queries';
import { flattenEdges } from '../lib/data/helpers';

const getPostsQueryVars = () => ({ size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE) });

function Home() {
    const [result] = useQuery({
        query: postsQuery,
        variables: getPostsQueryVars(),
    });

    const { data, fetching, error } = result;

    if (fetching) return <LoadingSpinner />;
    if (error) return <Error statusCode={500} title="Error retrieving articles" />;

    const posts = flattenEdges(data.posts);
    if (!posts.length) return <Error statusCode={404} title="Articles not found" />;

    const { hasMore, hasPrevious } = data.posts.pageInfo.offsetPagination;

    return (
        <div>
            <HeadWithTitle />

            <Posts posts={posts} />

            <PostsPager hasMore={hasMore} hasPrevious={hasPrevious} page={1} />
        </div>
    );
}

export async function getStaticProps() {
    const { urqlClient, ssrCache } = getUrqlClient();
    await urqlClient.query(postsQuery, getPostsQueryVars()).toPromise();

    return {
        props: { urqlState: ssrCache.extractData() },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export default wrapUrqlClient(Home);
