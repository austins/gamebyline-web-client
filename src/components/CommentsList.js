import useSWR from 'swr';
import Link from 'next/link';
import Image from 'next/image';
import has from 'lodash/has';
import { Fragment, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faReply } from '@fortawesome/free-solid-svg-icons';
import Moment from 'react-moment';
import { Alert, Button, Col, Form, Row } from 'react-bootstrap';
import { Link as LinkScroll } from 'react-scroll';
import rfdc from 'rfdc';
import defaultAvatar from '../../public/assets/images/default-comment-avatar.jpg';
import styles from '../styles/CommentsList.module.scss';
import { flattenEdges } from '../lib/data/helpers';
import { restFetcher } from '../lib/data/fetchers';

function ReplyToCommentMetadata(databaseId, authorName) {
    this.databaseId = databaseId;
    this.authorName = authorName;
}

export default function CommentsList({ postData, postMutate }) {
    const { data: userData } = useSWR('/api/user', restFetcher, { revalidateOnFocus: true });
    const isLoggedIn = userData && has(userData, 'name');

    const displayedComments = flattenEdges(postData.postBy.comments);

    // Submit comment form handler.
    const [replyToCommentMetadata, setReplyToCommentMetadata] = useState(null);
    const [commentFormName, setCommentFormName] = useState('');
    const [commentFormEmail, setCommentFormEmail] = useState('');
    const [commentFormMessage, setCommentFormMessage] = useState('');
    const [submitCommentSuccess, setSubmitCommentSuccess] = useState(null);
    const [submitCommentError, setSubmitCommentError] = useState('');
    const [submitCommentId, setSubmitCommentId] = useState(null);

    const submitComment = e => {
        e.preventDefault();

        fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                commentOnDatabaseId: postData.postBy.databaseId,
                author: isLoggedIn ? null : commentFormName,
                authorEmail: isLoggedIn ? null : commentFormEmail,
                content: commentFormMessage.trim(),
                parentDatabaseId: replyToCommentMetadata ? replyToCommentMetadata.databaseId : null,
            }),
        })
            .then(res => res.json())
            .then(async data => {
                if (data.error) {
                    setSubmitCommentError(data.error.message);
                    setSubmitCommentSuccess(false);
                    return;
                }

                setReplyToCommentMetadata(null);
                setCommentFormName('');
                setCommentFormEmail('');
                setCommentFormMessage('');

                if (data.success) {
                    const postDataCopy = rfdc({ proto: true })(postData);
                    postDataCopy.postBy.commentCount = postDataCopy.postBy.commentCount + 1;
                    const { comment } = data;
                    if (!comment.parentId) {
                        postDataCopy.postBy.comments.edges.push({ node: comment });
                    } else {
                        const parentCommentIndex = postDataCopy.postBy.comments.edges.findIndex(
                            c => c.node.id === comment.parentId
                        );
                        postDataCopy.postBy.comments.edges[parentCommentIndex].node.replies.edges.push({
                            node: comment,
                        });
                    }
                    postMutate(postDataCopy, false);
                    setSubmitCommentId(comment.id);
                    setSubmitCommentSuccess(true);
                }
            });
    };

    const renderComment = (comment, level) => {
        const isChildComment = level > 1;
        const author = comment.author.node;

        // Get avatar image.
        const avatarProps = { src: defaultAvatar, alt: author.name };
        let avatarImage = <Image {...avatarProps} quality={100} />;
        if (has(author, 'avatar')) {
            const { avatar } = author;

            avatarProps.src = avatar.url;
            avatarProps.width = avatar.width;
            avatarProps.height = avatar.height;

            const avatarUrlHost = new URL(avatar.url).host;
            const siteUrlHost = new URL(process.env.NEXT_PUBLIC_SITE_URL).host;

            avatarImage = avatarUrlHost.includes(siteUrlHost) ? (
                <Image {...avatarProps} quality={100} />
            ) : (
                <img {...avatarProps} />
            );
        }

        const getAuthorLink = showAvatar => {
            const authorLinkDisplay = showAvatar ? avatarImage : author.name;

            if (has(author, 'slug') && has(author, 'posts.nodes[0].id')) {
                return (
                    <Link href={`/articles/author/${author.slug}`} passHref>
                        <a>{authorLinkDisplay}</a>
                    </Link>
                );
            }

            return authorLinkDisplay;
        };

        // Get child comments.
        const childComments = has(comment, 'replies.edges[0]') ? flattenEdges(comment.replies) : [];

        return (
            <Fragment key={comment.id}>
                <div
                    id={`comment-${comment.id}`}
                    className={`d-flex border-top pt-3 ${styles.comment}`}
                    style={{ marginLeft: `${!isChildComment ? 0 : level}rem` }}
                >
                    {isChildComment && (
                        <div className="flex-shrink-0">
                            <FontAwesomeIcon icon={faReply} />
                        </div>
                    )}

                    <div className={isChildComment ? `flex-grow-1 ms-3` : 'flex-fill'}>
                        <div className="d-flex align-items-center mb-1">
                            <div className="flex-shrink-0">{getAuthorLink(true)}</div>

                            <div className="flex-grow-1 ms-2">
                                <strong>{getAuthorLink(false)}</strong>
                                <br />
                                <div className={styles.commentMeta}>
                                    <span>
                                        <FontAwesomeIcon icon={faClock} />
                                        <Moment
                                            date={`${comment.dateGmt}Z`}
                                            titleFormat={`${process.env.NEXT_PUBLIC_DEFAULT_POST_DATE_FORMAT} @ h:mm A`}
                                            withTitle
                                            fromNow
                                        />
                                    </span>

                                    {level === 1 && (
                                        <span>
                                            <FontAwesomeIcon icon={faReply} />
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

                {childComments.length > 0 && childComments.map(childComment => renderComment(childComment, level + 1))}
            </Fragment>
        );
    };

    return (
        <>
            <div>{displayedComments.length > 0 && displayedComments.map(comment => renderComment(comment, 1))}</div>

            <div className="mt-3">
                <h4>
                    {(replyToCommentMetadata !== null && (
                        <>
                            Replying to {replyToCommentMetadata.authorName}{' '}
                            <Button variant="outline-primary" size="sm" onClick={() => setReplyToCommentMetadata(null)}>
                                Cancel Reply
                            </Button>
                        </>
                    )) || <>Leave a Comment</>}
                </h4>

                {submitCommentSuccess !== null && (
                    <Alert variant={submitCommentSuccess === true ? 'success' : 'danger'}>
                        {(submitCommentSuccess === true && (
                            <>
                                Your comment has been posted successfully!{' '}
                                <LinkScroll
                                    href={`#comment-${submitCommentId}`}
                                    to={`comment-${submitCommentId}`}
                                    smooth
                                    duration={100}
                                >
                                    Go to comment
                                </LinkScroll>
                                .
                            </>
                        )) ||
                            (submitCommentSuccess === false && <>{submitCommentError}</>)}
                    </Alert>
                )}

                {isLoggedIn && <div className="fst-italic">Logged in as {userData.name}.</div>}

                <Form onSubmit={submitComment} id="comment-form">
                    {!isLoggedIn && (
                        <Row>
                            <Form.Group as={Col} controlId="comment-form-name">
                                <Form.Label className="text-end">Your Name</Form.Label>

                                <Form.Control
                                    type="text"
                                    value={commentFormName}
                                    onChange={e => setCommentFormName(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Form.Group as={Col} controlId="comment-form-email">
                                <Form.Label className="text-end">Your Email</Form.Label>

                                <Form.Control
                                    type="email"
                                    value={commentFormEmail}
                                    onChange={e => setCommentFormEmail(e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </Row>
                    )}

                    <Form.Group controlId="comment-form-message" className="mt-2">
                        <Form.Label>Message</Form.Label>
                        <Form.Control
                            as="textarea"
                            style={{ height: '100px' }}
                            value={commentFormMessage}
                            onChange={e => setCommentFormMessage(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Button type="submit" variant="primary" className="mt-3">
                        Submit
                    </Button>
                </Form>
            </div>
        </>
    );
}
