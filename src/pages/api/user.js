import { gql } from 'urql';
import { getUrqlClientStandalone } from '../../lib/data/urql';

export default async function handler(req, res) {
    const urqlClient = getUrqlClientStandalone(true, req.headers.cookie);

    const { data } = await urqlClient
        .query(
            gql`
                query {
                    viewer {
                        name
                    }
                }
            `
        )
        .toPromise();

    return res.status(200).json(data.viewer ?? {});
}
