import { gql } from 'urql';
import { getUrqlClientStandalone } from '../../../lib/data/urql';
import { commentFieldsFragment } from '../../../lib/data/queries';

export default async function handler(req, res) {
    if (req.method !== 'POST' || !req.body) return res.status(405).send();

    const urqlClient = getUrqlClientStandalone(true, req.headers.cookie);
    const { data, error } = await urqlClient
        .mutation(
            gql`
                ${commentFieldsFragment}

                mutation (
                    $commentOnDatabaseId: Int!
                    $content: String!
                    $author: String
                    $authorEmail: String
                    $parentDatabaseId: ID
                ) {
                    createComment(
                        input: {
                            commentOn: $commentOnDatabaseId
                            content: $content
                            author: $author
                            authorEmail: $authorEmail
                            parent: $parentDatabaseId
                        }
                    ) {
                        success
                        comment {
                            ...commentFields
                        }
                    }
                }
            `,
            {
                commentOnDatabaseId: req.body.commentOnDatabaseId,
                content: req.body.content,
                author: req.body.author ?? null,
                authorEmail: req.body.authorEmail ?? null,
                parentDatabaseId: req.body.parentDatabaseId ?? null,
            }
        )
        .toPromise();

    if (error) {
        // console.error(error);
        return res.status(500).send();
    }

    return res.status(200).json(data.createComment);
}
