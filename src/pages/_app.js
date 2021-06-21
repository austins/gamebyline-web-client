import '../styles/ClientApp.scss';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { Container } from 'react-bootstrap';
import Moment from 'react-moment';
import SimpleReactLightbox from 'simple-react-lightbox';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function ClientApp({ Component, pageProps }) {
    const router = useRouter();

    const setGoogleAnalyticsPagePath = url => {
        if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID) {
            window.gtag('config', process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID, {
                page_path: url,
            });
        }
    };

    useEffect(() => {
        const handleRouteChangeComplete = url => setGoogleAnalyticsPagePath(url);

        router.events.on('routeChangeComplete', handleRouteChangeComplete);

        return () => router.events.off('routeChangeComplete', handleRouteChangeComplete);
    }, [router]);

    return (
        <SimpleReactLightbox>
            <Header />

            <main id="main">
                <div id="main-inner" className="py-3">
                    <Container id="main-container">
                        <Component {...pageProps} />
                    </Container>
                </div>
            </main>

            <Footer />
        </SimpleReactLightbox>
    );
}

Moment.globalFilter = dateStr => `${dateStr.charAt(0).toUpperCase()}${dateStr.slice(1)}`;

export default ClientApp;
