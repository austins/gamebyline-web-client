import isNumeric from 'validator/lib/isNumeric';
import { gql } from 'graphql-request';
import { Alert } from 'react-bootstrap';
import { getGraphqlClient } from '../lib/data/fetchers';
import HeadWithTitle from '../components/HeadWithTitle';
import Page from '../components/Page';
import Post from '../components/Post';

export default function Preview({ type, data }) {
    const title = data.postBy?.title ?? data.pageBy?.title;

    return (
        <>
            <HeadWithTitle title={title} noIndex />

            <Alert variant="info">Previewing an unpublished {type}.</Alert>

            {(type === 'post' && <Post post={data.postBy} />) || (type === 'page' && <Page page={data.pageBy} />)}
        </>
    );
}

export async function getServerSideProps({ query, req }) {
    const previewTypes = ['post', 'page'];

    const { type, id } = query;
    if (!type || !previewTypes.includes(type) || !id || !isNumeric(id)) return { notFound: true };

    const graphqlClient = getGraphqlClient(req.headers.cookie);
    let data = null;
    if (type === 'post') {
        data = await graphqlClient.request(
            gql`
                query ($postId: Int!) {
                    postBy(postId: $postId) {
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

        if (!data.postBy) return { notFound: true };
    } else if (type === 'page') {
        data = await graphqlClient.request(
            gql`
                query ($pageId: Int!) {
                    pageBy(pageId: $pageId) {
                        title
                        content
                    }
                }
            `,
            { pageId: Number(id) }
        );

        if (!data.pageBy) return { notFound: true };
    }

    return { props: { type, data } };
}
