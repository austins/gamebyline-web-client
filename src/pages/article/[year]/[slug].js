import isInt from 'validator/lib/isInt';
import { faClock, faComments, faTag, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Moment from 'react-moment';
import Link from 'next/link';
import { Link as LinkScroll } from 'react-scroll';
import { SRLWrapper } from 'simple-react-lightbox';
import Image from 'next/image';
import has from 'lodash/has';
import { gql } from 'graphql-request';
import useSWR from 'swr';
import memoize from 'fast-memoize';
import { StatusCodes } from 'http-status-codes';
import HeadWithTitle from '../../../components/HeadWithTitle';
import styles from '../../../styles/Post.module.scss';
import Comments from '../../../components/Comments';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { postQuery } from '../../../lib/data/queries';
import { graphqlFetcher } from '../../../lib/data/fetchers';
import Error from '../../../components/Error';

const getPostQueryVars = memoize(slug => ({ slug }));

export default function Post({ slug, initialPostData }) {
    const { data, error, mutate } = useSWR([postQuery, getPostQueryVars(slug)], graphqlFetcher, {
        initialData: initialPostData,
        revalidateOnMount: true, // Since we have Incremental Static Regeneration, the page may be cached, so we should refetch the latest comments data.
    });

    if (!error && !data) return <LoadingSpinner />;
    if (error) return <Error statusCode={StatusCodes.INTERNAL_SERVER_ERROR} />;

    const post = data.postBy;

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
                                {post.commentCount > 0 && `${post.commentCount} `}
                                {post.commentCount === 1 ? 'Comment' : 'Comments'}
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
                                                quality={100}
                                                unoptimized={
                                                    !new URL(post.author.node.avatar.url).host.includes(
                                                        new URL(process.env.NEXT_PUBLIC_SITE_URL).host
                                                    )
                                                }
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

            <Comments postData={data} postMutate={mutate} />
        </div>
    );
}

export async function getStaticProps({ params }) {
    const { year, slug } = params;

    if (!isInt(year, { allow_leading_zeroes: false })) return { notFound: true };

    const initialPostData = await graphqlFetcher(postQuery, getPostQueryVars(slug));
    if (
        !has(initialPostData, 'postBy.id') ||
        new Date(`${initialPostData.postBy.dateGmt}Z`).getUTCFullYear() !== Number.parseInt(year, 10)
    )
        return { notFound: true };

    return { props: { year, slug, initialPostData }, revalidate: Number(process.env.REVALIDATION_IN_SECONDS) };
}

export async function getStaticPaths() {
    const postsData = await graphqlFetcher(gql`
        query {
            posts(first: 100, where: { status: PUBLISH }) {
                nodes {
                    uri
                }
            }
        }
    `);

    const posts = postsData.posts.nodes;

    const paths = posts.map(post => {
        const pathSplit = post.uri.split('/');
        const year = pathSplit[2];
        const slug = pathSplit[3];

        return {
            params: { slug, year },
        };
    });

    return { fallback: 'blocking', paths };
}
