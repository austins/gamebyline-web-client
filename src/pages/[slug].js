import Error from 'next/error';
import useSWR from 'swr';
import { gql } from 'graphql-request';
import memoize from 'fast-memoize';
import HeadWithTitle from '../components/HeadWithTitle';
import styles from '../styles/Page.module.scss';
import LoadingSpinner from '../components/LoadingSpinner';
import { pageQuery, csgoCrosshairsQuery } from '../lib/data/queries';
import { graphqlFetcher } from '../lib/data/fetchers';
import CsgoCrosshairs from '../components/CsgoCrosshairs';

const csgoCrosshairsSlug = 'csgo-crosshairs';
const getPageQueryVars = memoize(slug => ({ slug }));

export default function Page({ slug, initialPageData, initialCsgoCrosshairsData }) {
    const { data: pageData, error: pageError } = useSWR([pageQuery, getPageQueryVars(slug)], graphqlFetcher, {
        initialData: initialPageData,
    });

    const { data: csgoCrosshairsData, error: csgoCrosshairsError } = useSWR(
        slug === csgoCrosshairsSlug ? csgoCrosshairsQuery : null,
        graphqlFetcher,
        { initialData: initialCsgoCrosshairsData }
    );

    if ((!pageError && !pageData) || (slug === csgoCrosshairsSlug && !csgoCrosshairsError && !csgoCrosshairsData))
        return <LoadingSpinner />;

    if (pageError || csgoCrosshairsError) return <Error statusCode={500} title="Error retrieving page" />;

    const page = pageData.pageBy;

    let csgoCrosshairs = null;
    if (csgoCrosshairsData && csgoCrosshairsData.csgoCrosshairs.nodes.length)
        csgoCrosshairs = csgoCrosshairsData.csgoCrosshairs.nodes;

    return (
        <div>
            <HeadWithTitle title={page.title} innerHTMLString={page.seo.fullHead} />

            <h1>{page.title}</h1>

            <div className="clearfix">
                {/* eslint-disable-next-line react/no-danger */}
                <div className={styles.pageContent} dangerouslySetInnerHTML={{ __html: page.content }} />
            </div>

            {csgoCrosshairs && <CsgoCrosshairs csgoCrosshairs={csgoCrosshairs} />}
        </div>
    );
}

export async function getStaticProps({ params }) {
    const { slug } = params;

    const initialPageData = await graphqlFetcher(pageQuery, getPageQueryVars(slug));

    if (!initialPageData.pageBy) return { notFound: true };

    // If csgo-crosshairs page, get CS:GO crosshairs.
    let initialCsgoCrosshairsData = null;
    if (slug === csgoCrosshairsSlug) initialCsgoCrosshairsData = await graphqlFetcher(csgoCrosshairsQuery);

    return {
        props: { slug, initialPageData, initialCsgoCrosshairsData },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const pageData = await graphqlFetcher(gql`
        query {
            pages(first: 100, where: { status: PUBLISH }) {
                nodes {
                    slug
                }
            }
        }
    `);

    const pages = pageData.pages.nodes;

    const paths = pages.map(page => ({
        params: { slug: page.slug },
    }));

    return { fallback: 'blocking', paths };
}
