import { gql } from "graphql-request";
import nc from "next-connect";
import { StatusCodes } from "http-status-codes";
import { getGraphqlClient } from "../../lib/data/fetchers";

const handler = nc().get(async (req, res) => {
    const userData = await getGraphqlClient(req.headers.cookie).request(gql`
        query {
            viewer {
                name
            }
        }
    `);

    return res.status(StatusCodes.OK).json(userData.viewer ?? {});
});

export default handler;
