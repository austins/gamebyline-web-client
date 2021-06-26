import he from 'he';
import { gql } from 'graphql-request';
import has from 'lodash/has';
import nc from 'next-connect';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { commentFieldsFragment } from '../../lib/data/queries';
import { getGraphqlClient } from '../../lib/data/fetchers';

const handler = nc().post(async (req, res) => {
    if (!req.body) return res.status(StatusCodes.BAD_REQUEST).send(ReasonPhrases.BAD_REQUEST);

    try {
        const commentData = await getGraphqlClient(req.headers.cookie).request(
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
        );

        return res.status(StatusCodes.OK).json(commentData.createComment);
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: {
                message: has(error, 'response.errors[0].message')
                    ? he.decode(error.response.errors[0].message)
                    : 'There was an error posting your comment. Please try again.',
            },
        });
    }
});

export default handler;
