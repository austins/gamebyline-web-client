import isInt from "validator/lib/isInt";
import { has } from "lodash";
import useSWR from "swr";
import memoize from "fast-memoize";
import HeadWithTitle from "../../../components/HeadWithTitle";
import Comments from "../../../components/Comments";
import { postQuery, postPathsQuery } from "../../../lib/data/queries";
import { graphqlFetcher } from "../../../lib/data/fetchers";
import Post from "../../../components/Post";

const getPostQueryVars = memoize((slug) => ({ slug }));

export default function SinglePost({ slug, initialPostData }) {
    const isCommentStatusOpen = initialPostData.post.commentStatus === "open";

    const { data, mutate } = useSWR([postQuery, getPostQueryVars(slug)], graphqlFetcher, {
        initialData: initialPostData,
        revalidateOnMount: isCommentStatusOpen, // Since we have Incremental Static Regeneration, the page may be cached, so we should refetch the latest comments data.
    });

    // Disable error checking for now since revalidateOnMount causes error to be thrown on fast refreshes.
    // if (error) return <Error statusCode={error.statusCode} />;

    // Disable data loading check for now since initialData is populated.
    // if (!data) return <LoadingSpinner />;

    const { post } = data;

    return (
        <>
            <HeadWithTitle
                title={post.title}
                description={post.seo.opengraphDescription}
                innerHTMLString={post.seo.fullHead}
            />

            <Post post={post} parseContent />

            <hr className="mt-5 mb-4" />

            <Comments isCommentStatusOpen={isCommentStatusOpen} postData={data} postMutate={mutate} />
        </>
    );
}

export async function getStaticProps({ params }) {
    const { year, slug } = params;

    if (!isInt(year, { allow_leading_zeroes: false })) return { notFound: true };

    const initialPostData = await graphqlFetcher(postQuery, getPostQueryVars(slug));
    if (
        !has(initialPostData, "post.id") ||
        new Date(`${initialPostData.post.dateGmt}Z`).getUTCFullYear() !== Number.parseInt(year, 10)
    )
        return { notFound: true };

    return { props: { year, slug, initialPostData }, revalidate: Number(process.env.REVALIDATION_IN_SECONDS) };
}

export async function getStaticPaths() {
    const postsData = await graphqlFetcher(postPathsQuery);

    const posts = postsData.posts.nodes;

    const paths = posts.map((post) => {
        const pathSplit = post.uri.split("/");
        const year = pathSplit[2];
        const slug = pathSplit[3];

        return {
            params: { slug, year },
        };
    });

    return { fallback: "blocking", paths };
}
