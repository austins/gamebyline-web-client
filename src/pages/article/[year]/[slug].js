import isInt from 'validator/lib/isInt';
import { gql } from '@apollo/client';
import { faClock, faComments, faTag, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Moment from 'react-moment';
import Link from 'next/link';
import { CommentCount, DiscussionEmbed } from 'disqus-react';
import { Link as LinkScroll } from 'react-scroll';
import { SRLWrapper } from 'simple-react-lightbox';
import { apolloClient } from '../../../lib/data/apollo';
import HeadWithTitle from '../../../components/HeadWithTitle';
import styles from '../../../styles/Post.module.scss';

export default function Post({ post, slug, year }) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    // This is the identifier format used by the official "Disqus for WordPress" plugin.
    const disqusIdentifier = `${post.databaseId} ${siteUrl}/${new URL(post.guid).search}`;

    const disqusProps = {
        config: {
            identifier: disqusIdentifier,
            title: post.title,
            url: new URL(`/article/${year}/${slug}`, siteUrl).href,
        },
        shortname: process.env.NEXT_PUBLIC_DISQUS_SHORTNAME,
    };

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
                                <noscript>{post.commentCount ? `${post.commentCount} Comments` : 'Comments'}</noscript>
                                <CommentCount {...disqusProps}>Comments</CommentCount>
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
                                            <img
                                                src={post.author.node.avatar.url}
                                                width={post.author.node.avatar.width}
                                                height={post.author.node.avatar.height}
                                                alt={post.author.node.name}
                                                className={styles.authorAvatar}
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

            <hr className="mt-5" />

            <section id="comments">
                <noscript>
                    <h3>Comments</h3>

                    {post.comments.nodes.length && (
                        <ol>
                            {post.comments.nodes.map(comment => {
                                const commentDate = new Date(`${comment.dateGmt}Z`);

                                return (
                                    <li key={comment.commentId}>
                                        <header>
                                            <strong>{comment.author.node.name}</strong>
                                            {' on '}
                                            <time dateTime={commentDate.toISOString()}>
                                                {commentDate.toUTCString()}
                                            </time>
                                        </header>

                                        {/* eslint-disable-next-line react/no-danger */}
                                        <div dangerouslySetInnerHTML={{ __html: comment.content }} />
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </noscript>

                <DiscussionEmbed {...disqusProps} />
            </section>
        </div>
    );
}

export async function getStaticProps({ params }) {
    const { slug, year } = params;

    const { data } = await apolloClient.query({
        query: gql`
            query ($slug: String!) {
                postBy(slug: $slug) {
                    id
                    databaseId
                    guid
                    status
                    title
                    content
                    dateGmt
                    author {
                        node {
                            name
                            slug
                            description
                            avatar(size: 60) {
                                url
                                width
                                height
                            }
                        }
                    }
                    categories {
                        nodes {
                            name
                            slug
                        }
                    }
                    commentCount
                    comments(where: { order: ASC, orderby: COMMENT_DATE_GMT }) {
                        nodes {
                            commentId
                            content
                            author {
                                node {
                                    name
                                }
                            }
                            dateGmt
                        }
                    }
                    seo {
                        fullHead
                    }
                }
            }
        `,
        variables: { slug },
    });

    const post = data.postBy;

    if (
        !post ||
        !isInt(year, { allow_leading_zeroes: false }) ||
        new Date(`${post.dateGmt}Z`).getUTCFullYear() !== Number.parseInt(year, 10) ||
        post.status !== 'publish'
    ) {
        return { notFound: true };
    }

    return {
        props: { post, slug, year },
        revalidate: Number(process.env.REVALIDATION_IN_SECONDS),
    };
}

export async function getStaticPaths() {
    const { data } = await apolloClient.query({
        query: gql`
            query {
                posts(first: 100, where: { status: PUBLISH }) {
                    nodes {
                        uri
                    }
                }
            }
        `,
    });

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
}
