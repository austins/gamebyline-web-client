import isInt from 'validator/lib/isInt';
import { gql } from '@apollo/client';
import Posts from '../../../../components/Posts';
import postsQuery from '../../../../lib/data/queries/Posts.gql';
import { apolloClient, flattenEdges } from '../../../../lib/data/apollo';
import Breadcrumbs, { Crumb } from '../../../../components/Breadcrumbs';
import PostsPager from '../../../../components/PostsPager';
import HeadWithTitle from '../../../../components/HeadWithTitle';

export default function AuthorByPage({ authorName, hasMore, hasPrevious, page, posts, slug }) {
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
    const { data } = await apolloClient.query({
        query: postsQuery,
        variables: {
            authorSlug: slug,
            offset: page <= 1 ? 0 : (page - 1) * process.env.POSTS_PER_PAGE,
            size: Number(process.env.POSTS_PER_PAGE),
        },
    });

    const posts = flattenEdges(data.posts);
    if (!posts.length) return { notFound: true };

    const { hasMore, hasPrevious } = data.posts.pageInfo.offsetPagination;

    return {
        props: { authorName: posts[0].author.node.name, hasMore, hasPrevious, page, posts, slug },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const { data: usersData } = await apolloClient.query({
        query: gql`
            query {
                users(first: 100, where: { hasPublishedPosts: POST }) {
                    nodes {
                        slug
                    }
                }
            }
        `,
    });

    const paths = [];
    const users = usersData.users.nodes;
    for (const user of users) {
        const { data: postsData } = await apolloClient.query({
            query: gql`
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
            variables: { authorSlug: user.slug, size: Number(process.env.POSTS_PER_PAGE) },
        });

        const totalPosts = postsData.posts.pageInfo.offsetPagination.total;
        for (let i = 1; i <= Math.ceil(totalPosts / process.env.POSTS_PER_PAGE); i++) {
            paths.push({ params: { page: i.toString(), slug: user.slug } });
        }
    }

    return { fallback: 'blocking', paths };
}
