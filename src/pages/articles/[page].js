import isInt from "validator/lib/isInt";
import { gql } from "graphql-request";
import { getPlaiceholder } from "plaiceholder";
import Posts from "../../components/Posts";
import Breadcrumbs, { Crumb } from "../../components/Breadcrumbs";
import PostsPager from "../../components/PostsPager";
import HeadWithTitle from "../../components/HeadWithTitle";
import { postsQuery } from "../../lib/data/queries";
import { flattenEdges, generateFeaturedImagePlaceholders } from "../../lib/data/helpers";
import { graphqlFetcher } from "../../lib/data/fetchers";

export default function PostsByPage({ page, postsData }) {
    const posts = flattenEdges(postsData.posts);

    const { hasMore, hasPrevious } = postsData.posts.pageInfo.offsetPagination;

    const crumbs = [new Crumb(`/articles/${page}`, `Page ${page}`)];
    const postsPager = <PostsPager hasMore={hasMore} hasPrevious={hasPrevious} page={page} />;

    return (
        <>
            <HeadWithTitle title="Articles" description={postsData.generalSettings.description} />

            <Breadcrumbs crumbs={crumbs} />

            {postsPager}

            <Posts posts={posts} />

            {postsPager}
        </>
    );
}

export async function getStaticProps({ params }) {
    const page = params.page && isInt(params.page, { min: 1, allow_leading_zeroes: false }) ? Number(params.page) : 1;

    const postsData = await graphqlFetcher(postsQuery, {
        offset: page <= 1 ? 0 : (page - 1) * process.env.NEXT_PUBLIC_POSTS_PER_PAGE,
        size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE),
    });

    if (!postsData.posts.edges.length) return { notFound: true };

    await generateFeaturedImagePlaceholders(getPlaiceholder, postsData.posts.edges);

    return {
        props: { page, postsData },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const postsData = await graphqlFetcher(
        gql`
            query ($size: Int!) {
                posts(where: { status: PUBLISH, offsetPagination: { size: $size } }) {
                    pageInfo {
                        offsetPagination {
                            total
                        }
                    }
                }
            }
        `,
        { size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE) }
    );

    const paths = [];
    const totalPosts = postsData.posts.pageInfo.offsetPagination.total;
    for (let i = 1; i <= Math.ceil(totalPosts / process.env.NEXT_PUBLIC_POSTS_PER_PAGE); i++) {
        paths.push({ params: { page: i.toString() } });
    }

    return { fallback: "blocking", paths };
}
