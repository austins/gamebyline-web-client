import isNumeric from "validator/lib/isNumeric";
import { gql } from "graphql-request";
import { Alert } from "react-bootstrap";
import { getGraphqlClient } from "../lib/data/fetchers";
import HeadWithTitle from "../components/HeadWithTitle";
import Page from "../components/Page";
import Post from "../components/Post";

export default function Preview({ type, data }) {
    const title = data.post?.title ?? data.page?.title;

    return (
        <>
            <HeadWithTitle title={title} noIndex />

            <Alert variant="info">Previewing a {type}.</Alert>

            {(type === "post" && <Post post={data.post} />) || (type === "page" && <Page page={data.page} />)}
        </>
    );
}

export async function getServerSideProps({ query, req }) {
    const previewTypes = ["post", "page"];

    const { type, id } = query;
    if (!type || !previewTypes.includes(type) || !id || !isNumeric(id)) return { notFound: true };

    const graphqlClient = getGraphqlClient(req.headers.cookie);
    let data = null;
    try {
        if (type === "post") {
            data = await graphqlClient.request(
                gql`
                    query ($postId: ID!) {
                        post(id: $postId, idType: DATABASE_ID, asPreview: true) {
                            title
                            content
                            author {
                                node {
                                    name
                                    slug
                                }
                            }
                            categories {
                                nodes {
                                    name
                                    slug
                                }
                            }
                        }
                    }
                `,
                { postId: Number(id) }
            );

            if (!data.post) return { notFound: true };
        } else if (type === "page") {
            data = await graphqlClient.request(
                gql`
                    query ($pageId: ID!) {
                        page(id: $pageId, idType: DATABASE_ID, asPreview: true) {
                            title
                            content
                        }
                    }
                `,
                { pageId: Number(id) }
            );

            if (!data.page) return { notFound: true };
        }
    } catch {
        // WPGraphQL throws "Call to a member function then() on null" internal server error if ID doesn't exist.
        return { notFound: true };
    }

    return { props: { type, data } };
}
