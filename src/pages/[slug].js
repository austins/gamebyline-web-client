import { gql } from 'graphql-request';
import HeadWithTitle from '../components/HeadWithTitle';
import styles from '../styles/Page.module.scss';
import { csgoCrosshairsQuery, pageQuery } from '../lib/data/queries';
import { graphqlFetcher } from '../lib/data/fetchers';
import CsgoCrosshairs from '../components/CsgoCrosshairs';

const csgoCrosshairsSlug = 'csgo-crosshairs';

export default function Page({ pageData, csgoCrosshairsData }) {
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

    const pageData = await graphqlFetcher(pageQuery, { slug });

    if (!pageData.pageBy) return { notFound: true };

    // If csgo-crosshairs page, get CS:GO crosshairs.
    let csgoCrosshairsData = null;
    if (slug === csgoCrosshairsSlug) csgoCrosshairsData = await graphqlFetcher(csgoCrosshairsQuery);

    return {
        props: { slug, pageData, csgoCrosshairsData },
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
