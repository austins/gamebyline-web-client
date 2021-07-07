import Link from "next/link";
import Image from "next/image";
import { has } from "lodash";
import { Fragment, useState } from "react";
import { Link as LinkScroll } from "react-scroll";
import defaultAvatar from "../../public/assets/images/default-comment-avatar.jpg";
import styles from "../styles/Comments.module.scss";
import { flattenEdges } from "../lib/data/helpers";
import dynamic from "next/dynamic";
import Time from "./Time";
import { ArrowBendLeftUp, ArrowBendUpLeft, Clock } from "phosphor-react";

const CommentForm = dynamic(() => import("./CommentForm"), { ssr: false });

function ReplyToCommentMetadata(databaseId, authorName) {
    this.databaseId = databaseId;
    this.authorName = authorName;
}

export default function Comments({ isCommentStatusOpen, postData, postMutate }) {
    const displayedComments = flattenEdges(postData.post.comments);

    const [replyToCommentMetadata, setReplyToCommentMetadata] = useState(null);

    const renderComment = (comment, level) => {
        const isChildComment = level > 1;
        const author = comment.author.node;

        // Get avatar image props.
        const avatarProps = { src: defaultAvatar, alt: author.name, quality: 100 };
        if (has(author, "avatar")) {
            const { avatar } = author;

            avatarProps.src = avatar.url;
            avatarProps.width = avatar.width;
            avatarProps.height = avatar.height;
            avatarProps.unoptimized = !new URL(avatar.url).host.includes(
                new URL(process.env.NEXT_PUBLIC_SITE_URL).host
            );
        }

        const getAuthorLink = (showAvatar) => {
            const authorLinkDisplay = showAvatar ? <Image {...avatarProps} /> : author.name;

            if (has(author, "slug") && has(author, "posts.nodes[0].id")) {
                return (
                    <Link href={`/articles/author/${author.slug}`} passHref>
                        <a>{authorLinkDisplay}</a>
                    </Link>
                );
            }

            return authorLinkDisplay;
        };

        // Get child comments.
        const childComments = has(comment, "replies.edges[0]") ? flattenEdges(comment.replies) : [];

        return (
            <Fragment key={comment.id}>
                <div
                    id={`comment-${comment.id}`}
                    className={`d-flex border-top pt-3 ${styles.comment}`}
                    style={{ marginLeft: `${!isChildComment ? 0 : level}rem` }}
                >
                    {isChildComment && (
                        <div className="flex-shrink-0">
                            <ArrowBendLeftUp weight="fill" />
                        </div>
                    )}

                    <div className={isChildComment ? `flex-grow-1 ms-3` : "flex-fill"}>
                        <div className="d-flex align-items-center mb-1">
                            <div className="flex-shrink-0">{getAuthorLink(true)}</div>

                            <div className="flex-grow-1 ms-2">
                                <strong>{getAuthorLink(false)}</strong>
                                <br />
                                <div className={styles.commentMeta}>
                                    <span>
                                        <Clock weight="fill" />
                                        <Time dateUtc={`${comment.dateGmt}Z`} withTimeInTitle />
                                    </span>

                                    {isCommentStatusOpen && level === 1 && (
                                        <span>
                                            <ArrowBendUpLeft weight="fill" />
                                            <LinkScroll
                                                href="#comment-form"
                                                to="comment-form"
                                                smooth
                                                duration={100}
                                                onClick={() =>
                                                    setReplyToCommentMetadata(
                                                        new ReplyToCommentMetadata(comment.databaseId, author.name)
                                                    )
                                                }
                                            >
                                                Reply
                                            </LinkScroll>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div dangerouslySetInnerHTML={{ __html: comment.content }} />
                    </div>
                </div>

                {childComments.length > 0 &&
                    childComments.map((childComment) => renderComment(childComment, level + 1))}
            </Fragment>
        );
    };

    return (
        <section id="comments">
            <h3>Comments</h3>

            {displayedComments.length > 0 && <div>{displayedComments.map((comment) => renderComment(comment, 1))}</div>}

            <CommentForm
                isCommentStatusOpen={isCommentStatusOpen}
                postData={postData}
                postMutate={postMutate}
                replyToCommentMetadata={replyToCommentMetadata}
                setReplyToCommentMetadata={setReplyToCommentMetadata}
            />
        </section>
    );
}
