import isInt from 'validator/lib/isInt';
import { useQuery } from 'urql';
import { faClock, faComments, faTag, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Moment from 'react-moment';
import Link from 'next/link';
import { Link as LinkScroll } from 'react-scroll';
import { useState } from 'react';
import { SRLWrapper } from 'simple-react-lightbox';
import Image from 'next/image';
import Error from 'next/error';
import has from 'lodash/has';
import HeadWithTitle from '../../../components/HeadWithTitle';
import styles from '../../../styles/Post.module.scss';
import CommentsList from '../../../components/CommentsList';
import { getUrqlClient, wrapUrqlClient } from '../../../lib/data/urql';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { postQuery } from '../../../lib/data/queries';

const getPostQueryVars = slug => ({ slug });

function Post({ year, slug, commentCount }) {
    // We use state for comment count here and comments in CommentsList
    // instead of re-execute function from useQuery to prevent flashing/reload of the page.
    const [latestCommentCount, setLatestCommentCount] = useState(commentCount);

    const [result] = useQuery({ query: postQuery, variables: getPostQueryVars(slug) });

    const { data, fetching, error } = result;

    if (fetching) return <LoadingSpinner />;
    if (error) return <Error statusCode={500} title="Error retrieving articles" />;

    const post = data.postBy;

    if (
        !post ||
        !isInt(year, { allow_leading_zeroes: false }) ||
        new Date(`${post.dateGmt}Z`).getUTCFullYear() !== Number.parseInt(year, 10)
    ) {
        return <Error statusCode={404} title="Article not found" />;
    }

    return (
        <div>
            <HeadWithTitle title={post.title} innerHTMLString={post.seo.fullHead} />

            <article>
                <header>
                    <h1 className={styles.postTitle}>{post.title}</h1>

                    <div className={styles.postMeta}>
                        <span>
                            <FontAwesomeIcon icon={faTag} />
                            <Link href={`/articles/topic/${post.categories.nodes[0].slug}`} passHref>
                                <a>{post.categories.nodes[0].name}</a>
                            </Link>
                        </span>

                        <span>
                            <FontAwesomeIcon icon={faClock} />
                            <Moment
                                date={`${post.dateGmt}Z`}
                                titleFormat={process.env.NEXT_PUBLIC_DEFAULT_POST_DATE_FORMAT}
                                withTitle
                                fromNow
                            />
                        </span>

                        <span>
                            <FontAwesomeIcon icon={faUser} />
                            <Link href={`/articles/author/${post.author.node.slug}`} passHref>
                                <a>{post.author.node.name}</a>
                            </Link>
                        </span>

                        <span>
                            <FontAwesomeIcon icon={faComments} />
                            <LinkScroll href="#comments" to="comments" smooth duration={100}>
                                {latestCommentCount > 0 && `${latestCommentCount} `}
                                {latestCommentCount === 1 ? 'Comment' : 'Comments'}
                            </LinkScroll>
                        </span>
                    </div>
                </header>

                <div className="clearfix">
                    <SRLWrapper
                        options={{
                            settings: {
                                autoplaySpeed: 0,
                                disableKeyboardControls: true,
                                disableWheelControls: true,
                            },
                            buttons: {
                                showAutoplayButton: false,
                                showDownloadButton: false,
                                showFullscreenButton: false,
                                showNextButton: false,
                                showPrevButton: false,
                                showThumbnailsButton: false,
                            },
                            caption: {
                                showCaption: false,
                            },
                            thumbnails: {
                                showThumbnails: false,
                            },
                        }}
                    >
                        {/* eslint-disable-next-line react/no-danger */}
                        <div className={styles.postContent} dangerouslySetInnerHTML={{ __html: post.content }} />
                    </SRLWrapper>
                </div>

                {post.author.node.description && (
                    <footer className="mt-5">
                        <hr className="mb-3" />

                        <div>
                            <h4>About the Author</h4>

                            <div className="d-flex">
                                <div className="flex-shrink-0">
                                    <Link href={`/articles/author/${post.author.node.slug}`} passHref>
                                        <a>
                                            <Image
                                                src={post.author.node.avatar.url}
                                                width={post.author.node.avatar.width}
                                                height={post.author.node.avatar.height}
                                                alt={post.author.node.name}
                                            />
                                        </a>
                                    </Link>
                                </div>

                                <div className="flex-grow-1 ms-3">
                                    <h5 className="mt-0 mb-1">
                                        <Link href={`/articles/author/${post.author.node.slug}`} passHref>
                                            <a>{post.author.node.name}</a>
                                        </Link>
                                    </h5>

                                    <div dangerouslySetInnerHTML={{ __html: post.author.node.description }} />
                                </div>
                            </div>
                        </div>
                    </footer>
                )}
            </article>

            <hr className="mt-5 mb-4" />

            <section id="comments">
                <h3>Comments</h3>

                <CommentsList
                    postDatabaseId={post.databaseId}
                    comments={post.comments}
                    latestCommentCount={latestCommentCount}
                    setLatestCommentCount={setLatestCommentCount}
                />
            </section>
        </div>
    );
}

export async function getServerSideProps({ params }) {
    // We use getServerSideProps to ensure that the latest comment count and comments appear
    // and depend on the urql cache for query speed. If Next.js implements on-demand invalidation of pages,
    // we can switch to getStaticProps and we can add revalidate here.

    const { slug, year } = params;

    const { urqlClient, ssrCache } = getUrqlClient();
    const { data } = await urqlClient.query(postQuery, getPostQueryVars(slug)).toPromise();

    if (!has(data, 'postBy.commentCount')) return { notFound: true };

    return { props: { urqlState: ssrCache.extractData(), year, slug, commentCount: data.postBy.commentCount } };
}

/* export async function getStaticPaths() {
    const { urqlClient } = getUrqlClient();
    const { data } = await urqlClient
        .query(
            gql`
                query {
                    posts(first: 100, where: { status: PUBLISH }) {
                        nodes {
                            uri
                        }
                    }
                }
            `
        )
        .toPromise();

    const posts = data.posts.nodes;

    const paths = posts.map(post => {
        const pathSplit = post.uri.split('/');
        const year = pathSplit[2];
        const slug = pathSplit[3];

        return {
            params: { slug, year },
        };
    });

    return { fallback: 'blocking', paths };
} */

export default wrapUrqlClient(Post);
