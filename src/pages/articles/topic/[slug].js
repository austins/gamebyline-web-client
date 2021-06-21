import { gql, useQuery } from 'urql';
import Error from 'next/error';
import Posts from '../../../components/Posts';
import PostsPager from '../../../components/PostsPager';
import HeadWithTitle from '../../../components/HeadWithTitle';
import { getUrqlClient, wrapUrqlClient } from '../../../lib/data/urql';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { postsQuery } from '../../../lib/data/queries';
import { flattenEdges } from '../../../lib/data/helpers';

const getPostsQueryVars = slug => ({
    categorySlug: slug,
    size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE),
});

function Category({ page, slug }) {
    const [result] = useQuery({
        query: postsQuery,
        variables: getPostsQueryVars(slug),
    });

    const { data, fetching, error } = result;

    if (fetching) return <LoadingSpinner />;
    if (error) return <Error statusCode={500} title="Error retrieving articles" />;

    const posts = flattenEdges(data.posts);
    if (!posts.length) return { notFound: true };

    const { hasMore, hasPrevious } = data.posts.pageInfo.offsetPagination;

    const categoryName = posts[0].categories.nodes[0].name;

    return (
        <div>
            <HeadWithTitle title={categoryName} noIndex />

            <Posts categoryName={categoryName} posts={posts} />
            <PostsPager categorySlug={slug} hasMore={hasMore} hasPrevious={hasPrevious} page={page} />
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
                    categories(first: 100, where: { hideEmpty: true }) {
                        nodes {
                            slug
                        }
                    }
                }
            `
        )
        .toPromise();

    const categories = data.categories.nodes;

    const paths = categories.map(category => ({
        params: { slug: category.slug },
    }));

    return { fallback: 'blocking', paths };
}

export default wrapUrqlClient(Category);
