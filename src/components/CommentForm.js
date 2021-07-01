import { useState } from 'react';
import rfdc from 'rfdc';
import useSWR from 'swr';
import has from 'lodash/has';
import { Alert, Button, Col, Form, Row } from 'react-bootstrap';
import { Link as LinkScroll } from 'react-scroll';
import { restFetcher } from '../lib/data/fetchers';

export default function CommentForm({
    isCommentStatusOpen,
    postData,
    postMutate,
    replyToCommentMetadata,
    setReplyToCommentMetadata,
}) {
    const { data: userData } = useSWR(isCommentStatusOpen ? '/api/user' : null, restFetcher, {
        revalidateOnFocus: true,
    });
    const isLoggedIn = userData && has(userData, 'name');

    const [commentFormName, setCommentFormName] = useState('');
    const [commentFormEmail, setCommentFormEmail] = useState('');
    const [commentFormMessage, setCommentFormMessage] = useState('');
    const [submitCommentSuccess, setSubmitCommentSuccess] = useState(null);
    const [submitCommentError, setSubmitCommentError] = useState('');
    const [createdCommentId, setCreatedCommentId] = useState(null);

    const submitComment = e => {
        e.preventDefault();

        fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                commentOnDatabaseId: postData.post.databaseId,
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

                    postDataCopy.post.commentCount += 1;

                    const { comment } = data;
                    if (!comment.parentId) {
                        postDataCopy.post.comments.edges.push({ node: comment });
                    } else {
                        const parentCommentIndex = postDataCopy.post.comments.edges.findIndex(
                            c => c.node.id === comment.parentId
                        );

                        postDataCopy.post.comments.edges[parentCommentIndex].node.replies.edges.push({
                            node: comment,
                        });
                    }

                    postMutate(postDataCopy, false);
                    setCreatedCommentId(comment.id);
                    setSubmitCommentError('');
                    setSubmitCommentSuccess(true);
                }
            })
            .catch(() => {
                setSubmitCommentError('There was an error posting your comment. Please try again.');
                setSubmitCommentSuccess(false);
            });
    };

    return (
        <div className="mt-3">
            <h4>
                {(isCommentStatusOpen && replyToCommentMetadata !== null && (
                    <>
                        Replying to {replyToCommentMetadata.authorName}{' '}
                        <Button variant="outline-primary" size="sm" onClick={() => setReplyToCommentMetadata(null)}>
                            Cancel Reply
                        </Button>
                    </>
                )) || <>Leave a Comment</>}
            </h4>

            <div>
                {(isCommentStatusOpen && (
                    <>
                        {submitCommentSuccess !== null && (
                            <Alert variant={submitCommentSuccess === true ? 'success' : 'danger'}>
                                {(submitCommentSuccess === true && (
                                    <>
                                        Your comment has been posted successfully!{' '}
                                        <LinkScroll
                                            href={`#comment-${createdCommentId}`}
                                            to={`comment-${createdCommentId}`}
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
                    </>
                )) || <>Comments are closed for this article.</>}
            </div>
        </div>
    );
}
