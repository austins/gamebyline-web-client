import isInt from 'validator/lib/isInt';
import { gql, useQuery } from 'urql';

import Error from 'next/error';
import Posts from '../../../../components/Posts';
import Breadcrumbs, { Crumb } from '../../../../components/Breadcrumbs';
import PostsPager from '../../../../components/PostsPager';
import HeadWithTitle from '../../../../components/HeadWithTitle';
import { getUrqlClient, wrapUrqlClient } from '../../../../lib/data/urql';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import { postsQuery } from '../../../../lib/data/queries';
import { flattenEdges } from '../../../../lib/data/helpers';

const getPostsQueryVars = (slug, page) => ({
    authorSlug: slug,
    offset: page <= 1 ? 0 : (page - 1) * process.env.NEXT_PUBLIC_POSTS_PER_PAGE,
    size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE),
});

function AuthorByPage({ page, slug }) {
    const [result] = useQuery({
        query: postsQuery,
        variables: getPostsQueryVars(slug, page),
    });

    const { data, fetching, error } = result;

    if (fetching) return <LoadingSpinner />;
    if (error) return <Error statusCode={500} title="Error retrieving articles" />;

    const posts = flattenEdges(data.posts);
    if (!posts.length) return { notFound: true };

    const { hasMore, hasPrevious } = data.posts.pageInfo.offsetPagination;

    const authorName = posts[0].author.node.name;

    const crumbs = [
        new Crumb(`/articles/author/${slug}`, authorName),
        new Crumb(`/articles/author/${slug}/${page}`, `Page ${page}`),
    ];
    const postsPager = <PostsPager authorSlug={slug} hasMore={hasMore} hasPrevious={hasPrevious} page={page} />;

    return (
        <div>
            <HeadWithTitle title={authorName} noIndex />

            <Breadcrumbs crumbs={crumbs} />

            {postsPager}

            <Posts authorName={authorName} posts={posts} />

            {postsPager}
        </div>
    );
}

export async function getStaticProps({ params }) {
    const { slug } = params;
    const page = params.page && isInt(params.page, { min: 1, allow_leading_zeroes: false }) ? Number(params.page) : 1;

    const { urqlClient, ssrCache } = getUrqlClient();
    await urqlClient.query(postsQuery, getPostsQueryVars(slug, page)).toPromise();

    return {
        props: { urqlState: ssrCache.extractData(), page, slug },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const { urqlClient } = getUrqlClient();
    const { data: usersData } = await urqlClient
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

    const paths = [];
    const users = usersData.users.nodes;
    for (const user of users) {
        const { data: postsData } = await urqlClient
            .query(
                gql`
                    query ($authorSlug: String!, $size: Int!) {
                        posts(where: { status: PUBLISH, authorName: $authorSlug, offsetPagination: { size: $size } }) {
                            pageInfo {
                                offsetPagination {
                                    total
                                }
                            }
                        }
                    }
                `,
                { authorSlug: user.slug, size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE) }
            )
            .toPromise();

        const totalPosts = postsData.posts.pageInfo.offsetPagination.total;
        for (let i = 1; i <= Math.ceil(totalPosts / process.env.NEXT_PUBLIC_POSTS_PER_PAGE); i++) {
            paths.push({ params: { page: i.toString(), slug: user.slug } });
        }
    }

    return { fallback: 'blocking', paths };
}

export default wrapUrqlClient(AuthorByPage);
