import he from "he";
import { gql } from "graphql-request";
import { has, isString } from "lodash";
import nc from "next-connect";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { commentNodeFieldsFragment } from "../../lib/data/queries";
import { getGraphqlClient } from "../../lib/data/fetchers";

const handler = nc().post(async (req, res) => {
    const { commentOnDatabaseId, content, author = null, authorEmail = null, parentDatabaseId = null } = req.body;

    if (
        Number.isNaN(commentOnDatabaseId) ||
        !isString(content) ||
        (author && !isString(author)) ||
        (authorEmail && !isString(authorEmail)) ||
        (parentDatabaseId && Number.isNaN(parentDatabaseId))
    )
        return res.status(StatusCodes.BAD_REQUEST).send(ReasonPhrases.BAD_REQUEST);

    try {
        const commentData = await getGraphqlClient(req.headers.cookie).request(
            gql`
                ${commentNodeFieldsFragment}

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
                            ...commentNodeFields
                        }
                    }
                }
            `,
            { commentOnDatabaseId, content, author, authorEmail, parentDatabaseId }
        );

        return res.status(StatusCodes.OK).json(commentData.createComment);
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: {
                message: has(error, "response.errors[0].message")
                    ? he.decode(error.response.errors[0].message)
                    : "There was an error creating your comment. Please try again.",
            },
        });
    }
});

export default handler;
