import '../styles/ClientApp.scss';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { Container } from 'react-bootstrap';
import { ApolloProvider, gql } from '@apollo/client';
import App from 'next/app';
import get from 'lodash/get';
import Moment from 'react-moment';
import SimpleReactLightbox from 'simple-react-lightbox';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { apolloClient, mapMenuItemsChildrenToParents } from '../lib/data/apollo';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';

function ClientApp({ Component, pageProps, menuItems }) {
    const router = useRouter();

    const setGoogleAnalyticsPagePath = url => {
        if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID) {
            window.gtag('config', process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID, {
                page_path: url,
            });
        }
    };

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleRouteChangeStart = () => setLoading(true);

        const handleRouteChangeComplete = url => {
            setLoading(false);
            setGoogleAnalyticsPagePath(url);
        };

        const handleRouteChangeError = () => setLoading(false);

        router.events.on('routeChangeStart', handleRouteChangeStart);
        router.events.on('routeChangeComplete', handleRouteChangeComplete);
        router.events.on('routeChangeError', handleRouteChangeError);

        return () => {
            router.events.off('routeChangeStart', handleRouteChangeStart);
            router.events.off('routeChangeComplete', handleRouteChangeComplete);
            router.events.off('routeChangeError', handleRouteChangeError);
        };
    }, [router]);

    return (
        <ApolloProvider client={apolloClient}>
            <SimpleReactLightbox>
                <Header menuItems={menuItems} />

                <main id="main">
                    <div id="main-inner" className="py-3">
                        <Container id="main-container">
                            {(loading && <LoadingSpinner />) || <Component {...pageProps} />}
                        </Container>
                    </div>
                </main>

                <Footer />
            </SimpleReactLightbox>
        </ApolloProvider>
    );
}

ClientApp.getInitialProps = async appContext => {
    const appProps = await App.getInitialProps(appContext);

    // Query for initial data.
    const { data } = await apolloClient.query({
        query: gql`
            query {
                menus(where: { slug: "header" }) {
                    nodes {
                        menuItems(first: 100) {
                            nodes {
                                key: id
                                parentId
                                title: label
                                url
                            }
                        }
                    }
                }
            }
        `,
    });

    // Get menu items.
    let menuItems = get(data.menus, 'nodes[0].menuItems.nodes', []);
    if (menuItems.length) menuItems = mapMenuItemsChildrenToParents(menuItems);

    return {
        ...appProps,
        menuItems,
    };
};

Moment.globalFilter = date => {
    if (date.startsWith('a ')) return `1 ${date.slice(1)}`;

    return date;
};

export default ClientApp;
