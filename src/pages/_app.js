import "nprogress/nprogress.css";
import "../styles/ClientApp.scss";
import { Container } from "react-bootstrap";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { mutate, SWRConfig } from "swr";
import NProgress from "nprogress";
import { debounce, has, isObject } from "lodash";
import Header from "../components/Header";
import Footer from "../components/Footer";
import isJSON from "validator/lib/isJSON";
import { headerMenuQuery } from "../lib/data/queries";

export default function ClientApp({ Component, pageProps }) {
    const router = useRouter();

    useEffect(() => {
        // NProgress handlers.
        const startNProgress = debounce(NProgress.start, 300);
        const stopNProgress = () => {
            startNProgress.cancel();
            NProgress.done();
        };

        // Google Analytics page path handler.
        const setGoogleAnalyticsPagePath = (url) => {
            if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID && window.gtag) {
                window.gtag("config", process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID, {
                    page_path: url,
                });
            }
        };

        // Router change handlers.
        const handleRouteChangeStart = () => startNProgress();

        const handleRouteChangeComplete = (url) => {
            stopNProgress();
            setGoogleAnalyticsPagePath(url);
        };

        const handleRouteChangeError = () => stopNProgress();

        router.events.on("routeChangeStart", handleRouteChangeStart);
        router.events.on("routeChangeComplete", handleRouteChangeComplete);
        router.events.on("routeChangeError", handleRouteChangeError);

        return () => {
            router.events.off("routeChangeStart", handleRouteChangeStart);
            router.events.off("routeChangeComplete", handleRouteChangeComplete);
            router.events.off("routeChangeError", handleRouteChangeError);
        };
    }, [router]);

    // Disable revalidate on focus by default since we don't need it now (ISG is suitable) and to reduce API calls.
    // If we later want to make the site more dynamic, we can enable revalidateOnFocus.
    const swrConfig = { revalidateOnFocus: false };

    // Get menu items and mutate SWR cache for use in the HeaderMenu component.
    if (typeof window !== "undefined") {
        const headerMenuDataCache = localStorage.getItem("headerMenuData");
        if (headerMenuDataCache && isJSON(headerMenuDataCache)) {
            const parsedHeaderMenuDataCache = JSON.parse(headerMenuDataCache);
            if (isObject(parsedHeaderMenuDataCache) && has(parsedHeaderMenuDataCache, "menu.menuItems.nodes"))
                mutate(headerMenuQuery, parsedHeaderMenuDataCache, false);
        }
    }

    return (
        <SWRConfig value={swrConfig}>
            <Header />

            <main id="main">
                <div id="main-inner" className="py-3">
                    <Container id="main-container">
                        <Component {...pageProps} />
                    </Container>
                </div>
            </main>

            <Footer />
        </SWRConfig>
    );
}
