import { cacheExchange, createClient, dedupExchange, fetchExchange, ssrExchange } from 'urql';
import { initUrqlClient, withUrqlClient } from 'next-urql';
import { devtoolsExchange } from '@urql/devtools';

export const isServerSide = () => typeof window === 'undefined';

export const getUrqlClient = () => {
    const ssrCache = ssrExchange({ isClient: false });

    const urqlClient = initUrqlClient({
        url: process.env.NEXT_PUBLIC_API_GRAPHQL_URL,
        exchanges: [devtoolsExchange, dedupExchange, cacheExchange, ssrCache, fetchExchange],
    });

    return { urqlClient, ssrCache };
};

export const wrapUrqlClient = appOrPage =>
    withUrqlClient(
        () => ({
            url: process.env.NEXT_PUBLIC_API_GRAPHQL_URL,
        }),
        {
            neverSuspend: true,
            ssr: false,
        }
    )(appOrPage);

export const getUrqlClientStandalone = (networkOnly = false, cookie = null) => {
    const options = { url: process.env.NEXT_PUBLIC_API_GRAPHQL_URL };

    if (networkOnly === true) options.requestPolicy = 'network-only';

    if (cookie != null) options.fetchOptions = { headers: { cookie } };

    return createClient(options);
};
