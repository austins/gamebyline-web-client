import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faComments, faTag, faUser } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import Moment from 'react-moment';
import { Link as LinkScroll } from 'react-scroll';
import { SRLWrapper } from 'simple-react-lightbox';
import Image from 'next/image';
import parse from 'html-react-parser';
import isUndefined from 'lodash/isUndefined';
import { parseImages } from '../lib/data/helpers';
import styles from '../styles/Post.module.scss';

export default function Post({ post, parseContent = false }) {
    return (
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

                    {!isUndefined(post.dateGmt) && (
                        <span>
                            <FontAwesomeIcon icon={faClock} />
                            <Moment
                                date={`${post.dateGmt}Z`}
                                titleFormat={process.env.NEXT_PUBLIC_DEFAULT_POST_DATE_FORMAT}
                                withTitle
                                fromNow
                            />
                        </span>
                    )}

                    <span>
                        <FontAwesomeIcon icon={faUser} />
                        <Link href={`/articles/author/${post.author.node.slug}`} passHref>
                            <a>{post.author.node.name}</a>
                        </Link>
                    </span>

                    {!isUndefined(post.commentCount) && (
                        <span>
                            <FontAwesomeIcon icon={faComments} />
                            <LinkScroll href="#comments" to="comments" smooth duration={100}>
                                {post.commentCount > 0 && `${post.commentCount} `}
                                {post.commentCount === 1 ? 'Comment' : 'Comments'}
                            </LinkScroll>
                        </span>
                    )}
                </div>
            </header>

            <div className={`clearfix ${styles.postContent}`}>
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
                    {parseContent ? parseImages(post.content) : parse(post.content)}
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
    );
}
