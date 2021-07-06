import isInt from "validator/lib/isInt";
import { getPlaiceholder } from "plaiceholder";
import Posts from "../../components/Posts";
import PostsPager from "../../components/PostsPager";
import Breadcrumbs, { Crumb } from "../../components/Breadcrumbs";
import HeadWithTitle from "../../components/HeadWithTitle";
import { postsQuery } from "../../lib/data/queries";
import { flattenEdges, generateFeaturedImagePlaceholders } from "../../lib/data/helpers";
import { graphqlFetcher } from "../../lib/data/fetchers";

export default function PostsBySearch({ search, page, postsData }) {
    const posts = flattenEdges(postsData.posts);
    const { hasMore, hasPrevious } = postsData.posts.pageInfo.offsetPagination;

    const crumbs = [new Crumb(`/articles/?page=${page}&search=${search}`, `Page ${page}`)];

    return (
        <>
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
        </>
    );
}

export async function getServerSideProps({ query }) {
    const { search } = query;
    if (!search) return { notFound: true };

    const page = query.page && isInt(query.page, { min: 1, allow_leading_zeroes: false }) ? Number(query.page) : 1;

    const postsData = await graphqlFetcher(postsQuery, {
        offset: page <= 1 ? 0 : (page - 1) * process.env.NEXT_PUBLIC_POSTS_PER_PAGE,
        size: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE),
        search,
    });

    await generateFeaturedImagePlaceholders(getPlaiceholder, postsData.posts.edges);

    return { props: { search, page, postsData } };
}
