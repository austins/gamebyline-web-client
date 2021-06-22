import isInt from 'validator/lib/isInt';
import Error from 'next/error';
import useSWR from 'swr';
import memoize from 'fast-memoize';
import Posts from '../../components/Posts';
import PostsPager from '../../components/PostsPager';
import Breadcrumbs, { Crumb } from '../../components/Breadcrumbs';
import HeadWithTitle from '../../components/HeadWithTitle';
import LoadingSpinner from '../../components/LoadingSpinner';
import { postsQuery } from '../../lib/data/queries';
import { flattenEdges } from '../../lib/data/helpers';
import { graphqlFetcher } from '../../lib/data/fetchers';

const getPostsQueryVars = memoize((page, search) => ({
    offset: page <= 1 ? 0 : (page - 1) * process.env.NEXT_PUBLIC_POSTS_PER_PAGE,
    size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE),
    search,
}));

export default function PostsBySearch({ page, search, initialPostsData }) {
    const { data, error } = useSWR([postsQuery, getPostsQueryVars(page, search)], graphqlFetcher, {
        initialData: initialPostsData,
    });

    if (!error && !data) return <LoadingSpinner />;
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

    const initialPostsData = await graphqlFetcher(postsQuery, getPostsQueryVars(page, search));

    return { props: { page, search, initialPostsData } };
}
