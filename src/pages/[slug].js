import { gql } from '@apollo/client';
import { apolloClient } from '../lib/data/apollo';
import HeadWithTitle from '../components/HeadWithTitle';
import CsgoCrosshairs from '../components/CsgoCrosshairs';
import styles from '../styles/Page.module.scss';

export default function Page({ page, slug, csgoCrosshairs }) {
    return (
        <div>
            <HeadWithTitle title={page.title} innerHTMLString={page.seo.fullHead} />

            <h1>{page.title}</h1>

            <div className="clearfix">
                {/* eslint-disable-next-line react/no-danger */}
                <div className={styles.pageContent} dangerouslySetInnerHTML={{ __html: page.content }} />
            </div>

            {slug === 'csgo-crosshairs' && csgoCrosshairs && <CsgoCrosshairs csgoCrosshairs={csgoCrosshairs} />}
        </div>
    );
}

export async function getStaticProps({ params }) {
    const { slug } = params;

    const { data } = await apolloClient.query({
        query: gql`
            query ($slug: String!) {
                pageBy(uri: $slug) {
                    title
                    content
                    seo {
                        fullHead
                    }
                }
            }
        `,
        variables: { slug },
    });

    const page = data.pageBy;
    if (!page) return { notFound: true };

    // Get data for CS:GO crosshairs page.
    let csgoCrosshairs = null;
    if (slug === 'csgo-crosshairs') {
        const { data: csgoCrosshairsData } = await apolloClient.query({
            query: gql`
                query {
                    csgoCrosshairs(first: 100, where: { orderby: { field: TITLE, order: ASC } }) {
                        nodes {
                            id
                            title
                            featuredImage {
                                node {
                                    mediaDetails {
                                        width
                                        height
                                    }
                                    mediaItemUrl
                                }
                            }
                            csgoCrosshair {
                                code
                                style
                            }
                        }
                    }
                }
            `,
        });

        if (csgoCrosshairsData.csgoCrosshairs && csgoCrosshairsData.csgoCrosshairs.nodes.length)
            csgoCrosshairs = csgoCrosshairsData.csgoCrosshairs.nodes;
    }

    return {
        props: { page, csgoCrosshairs, slug },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const { data } = await apolloClient.query({
        query: gql`
            query {
                pages(first: 100, where: { status: PUBLISH }) {
                    nodes {
                        slug
                    }
                }
            }
        `,
    });

    const pages = data.pages.nodes;

    const paths = pages.map(page => ({
        params: { slug: page.slug },
    }));

    return { fallback: 'blocking', paths };
}
