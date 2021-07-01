import isInt from 'validator/lib/isInt';
import { gql } from 'graphql-request';
import { getPlaiceholder } from 'plaiceholder';
import Posts from '../../../../components/Posts';
import Breadcrumbs, { Crumb } from '../../../../components/Breadcrumbs';
import PostsPager from '../../../../components/PostsPager';
import HeadWithTitle from '../../../../components/HeadWithTitle';
import { postsQuery } from '../../../../lib/data/queries';
import { flattenEdges, generateFeaturedImagePlaceholders } from '../../../../lib/data/helpers';
import { graphqlFetcher } from '../../../../lib/data/fetchers';

export default function AuthorByPage({ page, slug, postsData }) {
    const posts = flattenEdges(postsData.posts);

    const { hasMore, hasPrevious } = postsData.posts.pageInfo.offsetPagination;

    const authorName = posts[0].author.node.name;

    const crumbs = [
        new Crumb(`/articles/author/${slug}`, authorName),
        new Crumb(`/articles/author/${slug}/${page}`, `Page ${page}`),
    ];

    const postsPager = <PostsPager authorSlug={slug} hasMore={hasMore} hasPrevious={hasPrevious} page={page} />;

    return (
        <>
            <HeadWithTitle title={authorName} noIndex />

            <Breadcrumbs crumbs={crumbs} />

            {postsPager}

            <Posts authorName={authorName} posts={posts} />

            {postsPager}
        </>
    );
}

export async function getStaticProps({ params }) {
    const { slug } = params;
    const page = params.page && isInt(params.page, { min: 1, allow_leading_zeroes: false }) ? Number(params.page) : 1;

    const postsData = await graphqlFetcher(postsQuery, {
        authorSlug: slug,
        offset: page <= 1 ? 0 : (page - 1) * process.env.NEXT_PUBLIC_POSTS_PER_PAGE,
        size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE),
    });

    if (!postsData.posts.edges.length) return { notFound: true };

    await generateFeaturedImagePlaceholders(getPlaiceholder, postsData.posts.edges);

    return {
        props: { page, slug, postsData },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const usersData = await graphqlFetcher(gql`
        query {
            users(first: 100, where: { hasPublishedPosts: POST }) {
                nodes {
                    slug
                }
            }
        }
    `);

    const paths = [];
    const users = usersData.users.nodes;
    for (const user of users) {
        const postsData = await graphqlFetcher(
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
        );

        const totalPosts = postsData.posts.pageInfo.offsetPagination.total;
        for (let i = 1; i <= Math.ceil(totalPosts / process.env.NEXT_PUBLIC_POSTS_PER_PAGE); i++) {
            paths.push({ params: { page: i.toString(), slug: user.slug } });
        }
    }

    return { fallback: 'blocking', paths };
}
