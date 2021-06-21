import Head from 'next/head';
import isString from 'lodash/isString';
import parse from 'html-react-parser';

export default function HeadWithTitle({ title, noIndex, innerHTMLString, children }) {
    return (
        <Head>
            <title>
                {isString(title) && title.length > 0 ? `${title} – ` : ''}
                {process.env.NEXT_PUBLIC_SITE_NAME}
            </title>

            {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID && (
                <>
                    <script
                        async
                        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID}`}
                    />
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());
                      gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID}', { anonymize_ip: true, page_path: window.location.pathname });`,
                        }}
                    />
                </>
            )}

            {noIndex && <meta name="robots" content="noindex" />}

            {innerHTMLString &&
                parse(innerHTMLString.replace('/?s=', '/articles/?search='), {
                    replace: ({ name }) => name === 'link' && <></>,
                })}

            {children}
        </Head>
    );
}
