import { getPlaiceholder } from "plaiceholder";
import Posts from "../components/Posts";
import PostsPager from "../components/PostsPager";
import HeadWithTitle from "../components/HeadWithTitle";
import { postsQuery } from "../lib/data/queries";
import { flattenEdges, generateFeaturedImagePlaceholders } from "../lib/data/helpers";
import { graphqlFetcher } from "../lib/data/fetchers";

export default function Home({ postsData }) {
    const posts = flattenEdges(postsData.posts);
    const { hasMore, hasPrevious } = postsData.posts.pageInfo.offsetPagination;

    return (
        <>
            <HeadWithTitle description={postsData.generalSettings.description} />

            <Posts posts={posts} />

            <PostsPager hasMore={hasMore} hasPrevious={hasPrevious} page={1} />
        </>
    );
}

export async function getStaticProps() {
    const postsData = await graphqlFetcher(postsQuery, { size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE) });

    if (!postsData.posts.edges.length) return { notFound: true };

    await generateFeaturedImagePlaceholders(getPlaiceholder, postsData.posts.edges);

    return {
        props: { postsData },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}
