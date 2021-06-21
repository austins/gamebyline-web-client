import isInt from 'validator/lib/isInt';
import { useQuery } from 'urql';
import Error from 'next/error';
import Posts from '../../components/Posts';
import PostsPager from '../../components/PostsPager';
import Breadcrumbs, { Crumb } from '../../components/Breadcrumbs';
import HeadWithTitle from '../../components/HeadWithTitle';
import { getUrqlClient, wrapUrqlClient } from '../../lib/data/urql';
import LoadingSpinner from '../../components/LoadingSpinner';
import { postsQuery } from '../../lib/data/queries';
import { flattenEdges } from '../../lib/data/helpers';

const getPostsQueryVars = (page, search) => ({
    offset: page <= 1 ? 0 : (page - 1) * process.env.NEXT_PUBLIC_POSTS_PER_PAGE,
    size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE),
    search,
});

function PostsBySearch({ page, search }) {
    const [result] = useQuery({
        query: postsQuery,
        variables: getPostsQueryVars(page, search),
    });

    const { data, fetching, error } = result;

    if (fetching) return <LoadingSpinner />;
    if (error) return <Error statusCode={500} title="Error retrieving articles" />;

    const posts = flattenEdges(data.posts);
    const { hasMore, hasPrevious } = data.posts.pageInfo.offsetPagination;

    const crumbs = [new Crumb(`/articles/?page=${page}&search=${search}`, `Page ${page}`)];

    return (
        <div>
            <HeadWithTitle title="Search" noIndex />

            {(posts.length > 0 && (
                <div>
                    <Breadcrumbs crumbs={crumbs} />

                    <Posts posts={posts} search={search} />

                    <PostsPager hasMore={hasMore} hasPrevious={hasPrevious} page={page} search={search} />
                </div>
            )) || (
                <div>
                    <Breadcrumbs />

                    <h1>Search: {search}</h1>

                    <div>No articles match your search criteria.</div>
                </div>
            )}
        </div>
    );
}

export async function getServerSideProps({ query }) {
    const { search } = query;
    if (!search) return { notFound: true };

    const page = query.page && isInt(query.page, { min: 1, allow_leading_zeroes: false }) ? Number(query.page) : 1;

    const { urqlClient, ssrCache } = getUrqlClient();
    await urqlClient.query(postsQuery, getPostsQueryVars(page, search)).toPromise();

    return { props: { urqlState: ssrCache.extractData(), page, search } };
}

export default wrapUrqlClient(PostsBySearch);
