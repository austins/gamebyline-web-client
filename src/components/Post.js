import Link from "next/link";
import { Link as LinkScroll } from "react-scroll";
import Image from "next/image";
import parse from "html-react-parser";
import { isUndefined } from "lodash";
import { parseImages } from "../lib/data/helpers";
import styles from "../styles/Post.module.scss";
import Time from "./Time";
import { ChatsCircle, Clock, Tag, User } from "phosphor-react";

export default function Post({ post, parseContent = false }) {
    return (
        <article>
            <header>
                <h1 className={styles.postTitle}>{post.title}</h1>

                <div className={styles.postMeta}>
                    <span>
                        <Tag weight="fill" />
                        <Link href={`/articles/topic/${post.categories.nodes[0].slug}`} passHref>
                            <a>{post.categories.nodes[0].name}</a>
                        </Link>
                    </span>

                    {!isUndefined(post.dateGmt) && (
                        <span>
                            <Clock weight="fill" />
                            <Time dateUtc={`${post.dateGmt}Z`} />
                        </span>
                    )}

                    <span>
                        <User weight="fill" />
                        <Link href={`/articles/author/${post.author.node.slug}`} passHref>
                            <a>{post.author.node.name}</a>
                        </Link>
                    </span>

                    {!isUndefined(post.commentCount) && (
                        <span>
                            <ChatsCircle weight="fill" />
                            <LinkScroll href="#comments" to="comments" smooth duration={100}>
                                {post.commentCount > 0 && `${post.commentCount} `}
                                {post.commentCount === 1 ? "Comment" : "Comments"}
                            </LinkScroll>
                        </span>
                    )}
                </div>
            </header>

            <div className={`clearfix ${styles.postContent}`}>
                {parseContent ? parseImages(post.content) : parse(post.content)}
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
