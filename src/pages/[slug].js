import HeadWithTitle from "../components/HeadWithTitle";
import { csgoCrosshairsQuery, pagePathsQuery, pageQuery } from "../lib/data/queries";
import { graphqlFetcher } from "../lib/data/fetchers";
import CsgoCrosshairs from "../components/CsgoCrosshairs";
import Page from "../components/Page";

const csgoCrosshairsSlug = "csgo-crosshairs";

export default function SinglePage({ pageData, csgoCrosshairsData }) {
    const { page } = pageData;

    let csgoCrosshairs = null;
    if (csgoCrosshairsData && csgoCrosshairsData.csgoCrosshairs.nodes.length)
        csgoCrosshairs = csgoCrosshairsData.csgoCrosshairs.nodes;

    return (
        <>
            <HeadWithTitle
                title={page.title}
                description={page.seo.opengraphDescription}
                innerHTMLString={page.seo.fullHead}
            />

            <Page page={page} parseContent />

            {csgoCrosshairs && <CsgoCrosshairs csgoCrosshairs={csgoCrosshairs} />}
        </>
    );
}

export async function getStaticProps({ params }) {
    const { slug } = params;

    const pageData = await graphqlFetcher(pageQuery, { slug });

    if (!pageData.page) return { notFound: true };

    // If csgo-crosshairs page, get CS:GO crosshairs.
    let csgoCrosshairsData = null;
    if (slug === csgoCrosshairsSlug) csgoCrosshairsData = await graphqlFetcher(csgoCrosshairsQuery);

    return {
        props: { slug, pageData, csgoCrosshairsData },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const pageData = await graphqlFetcher(pagePathsQuery);

    const pages = pageData.pages.nodes;

    const paths = pages.map((page) => ({
        params: { slug: page.slug },
    }));

    return { fallback: "blocking", paths };
}
