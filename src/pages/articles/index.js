import isInt from 'validator/lib/isInt';
import { apolloClient, flattenEdges } from '../../lib/data/apollo';
import Posts from '../../components/Posts';
import postsQuery from '../../lib/data/queries/Posts.gql';
import PostsPager from '../../components/PostsPager';
import Breadcrumbs, { Crumb } from '../../components/Breadcrumbs';
import HeadWithTitle from '../../components/HeadWithTitle';

export default function PostsBySearch({ hasMore, hasPrevious, page, posts, search }) {
    const crumbs = [new Crumb(`/articles/?page=${page}&search=${search}`, `Page ${page}`)];

    return (
        <div>
            <HeadWithTitle title="Search" noIndex />

            {(posts.length && (
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

    const { data } = await apolloClient.query({
        query: postsQuery,
        variables: {
            offset: page <= 1 ? 0 : (page - 1) * process.env.POSTS_PER_PAGE,
            size: Number(process.env.POSTS_PER_PAGE),
            search,
        },
    });

    const posts = flattenEdges(data.posts);

    const { hasMore, hasPrevious } = data.posts.pageInfo.offsetPagination;

    return { props: { hasMore, hasPrevious, page, posts, search } };
}
