import { gql, useQuery } from 'urql';
import Error from 'next/error';
import HeadWithTitle from '../components/HeadWithTitle';
import CsgoCrosshairs from '../components/CsgoCrosshairs';
import styles from '../styles/Page.module.scss';
import { getUrqlClient, wrapUrqlClient } from '../lib/data/urql';
import LoadingSpinner from '../components/LoadingSpinner';
import { csgoCrosshairsQuery, pageQuery } from '../lib/data/queries';

const csgoCrosshairsSlug = 'csgo-crosshairs';
const getPageQueryVars = slug => ({ slug });

function Page({ slug, csgoCrosshairs }) {
    const [result] = useQuery({ query: pageQuery, variables: getPageQueryVars(slug) });
    const { data, fetching, error } = result;

    if (fetching) return <LoadingSpinner />;
    if (error) return <Error statusCode={500} title="Error retrieving page" />;

    const page = data.pageBy;
    if (!page) return <Error statusCode={404} title="Page not found" />;

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

    const { urqlClient, ssrCache } = getUrqlClient();

    await urqlClient.query(pageQuery, getPageQueryVars(slug)).toPromise();

    // If portfolio page, get projects.
    let csgoCrosshairs = null;
    if (slug === csgoCrosshairsSlug) {
        const { data: csgoCrosshairsData } = await urqlClient.query(csgoCrosshairsQuery).toPromise();
        if (csgoCrosshairsData && csgoCrosshairsData.csgoCrosshairs.nodes.length)
            csgoCrosshairs = csgoCrosshairsData.csgoCrosshairs.nodes;
    }

    return {
        props: { urqlState: ssrCache.extractData(), slug, csgoCrosshairs },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const { urqlClient } = getUrqlClient();
    const { data } = await urqlClient
        .query(
            gql`
                query {
                    pages(first: 100, where: { status: PUBLISH }) {
                        nodes {
                            slug
                        }
                    }
                }
            `
        )
        .toPromise();

    const pages = data.pages.nodes;

    const paths = pages.map(page => ({
        params: { slug: page.slug },
    }));

    return { fallback: 'blocking', paths };
}

export default wrapUrqlClient(Page);
