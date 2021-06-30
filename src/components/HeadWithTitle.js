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

            {noIndex && <meta name="robots" content="noindex" />}

            {innerHTMLString &&
                parse(innerHTMLString.replace('/?s=', '/articles/?search='), {
                    replace: ({ name }) => name === 'link' && <></>,
                })}

            {children}
        </Head>
    );
}
