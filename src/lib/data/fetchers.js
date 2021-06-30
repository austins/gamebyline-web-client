import { GraphQLClient, request } from 'graphql-request';
import isString from 'lodash/isString';
import set from 'lodash/set';
import { StatusCodes } from 'http-status-codes';

export const restFetcher = async url => {
    const res = await fetch(url);

    if (!res.ok) {
        const error = new Error('An error occurred while fetching the REST data.');
        error.info = await res.json();
        error.status = res.status;
        throw error;
    }

    return res.json();
};

export const graphqlFetcher = async (query, variables = {}) => {
    try {
        return await request(process.env.NEXT_PUBLIC_API_GRAPHQL_URL, query, variables);
    } catch (errorCaught) {
        const error = new Error('An error occurred while fetching the GraphQL data.');
        error.info = errorCaught;
        error.status = StatusCodes.INTERNAL_SERVER_ERROR;
        throw error;
    }
};

export const getGraphqlClient = (cookieStr = null) => {
    const options = {};
    if (isString(cookieStr)) set(options, 'headers.cookie', cookieStr);

    return new GraphQLClient(process.env.NEXT_PUBLIC_API_GRAPHQL_URL, options);
};
