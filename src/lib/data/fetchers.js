import { GraphQLClient, request } from 'graphql-request';
import isString from 'lodash/isString';
import set from 'lodash/set';

export const apiFetcher = url => fetch(url).then(res => res.json());

export const graphqlFetcher = (query, variables = {}) =>
    request(process.env.NEXT_PUBLIC_API_GRAPHQL_URL, query, variables);

export const getGraphqlClient = (cookieStr = null) => {
    const options = {};
    if (isString(cookieStr)) set(options, 'headers.cookie', cookieStr);

    return new GraphQLClient(process.env.NEXT_PUBLIC_API_GRAPHQL_URL, options);
};
