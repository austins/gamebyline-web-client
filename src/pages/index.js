import Error from 'next/error';
import useSWR from 'swr';
import memoize from 'fast-memoize';
import Posts from '../components/Posts';
import PostsPager from '../components/PostsPager';
import HeadWithTitle from '../components/HeadWithTitle';
import LoadingSpinner from '../components/LoadingSpinner';
import { postsQuery } from '../lib/data/queries';
import { flattenEdges } from '../lib/data/helpers';
import { graphqlFetcher } from '../lib/data/fetchers';

const getPostsQueryVars = memoize(() => ({ size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE) }));

export default function Home({ initialPostsData }) {
    const { data, error } = useSWR([postsQuery, getPostsQueryVars()], graphqlFetcher, {
        initialData: initialPostsData,
    });

    if (!error && !data) return <LoadingSpinner />;
    if (error) return <Error statusCode={500} title="Error retrieving articles" />;

    const posts = flattenEdges(data.posts);
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
    const initialPostsData = await graphqlFetcher(postsQuery, getPostsQueryVars());

    if (!initialPostsData.posts.edges.length) return { notFound: true };

    return {
        props: { initialPostsData },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}
