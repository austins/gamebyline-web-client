import { Card, Col, Row } from 'react-bootstrap';
import Link from 'next/link';
import { faClock, faTag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Moment from 'react-moment';
import Image from 'next/image';
import styles from '../styles/Posts.module.scss';

export default function Posts({ authorName, categoryName, posts, search }) {
    return (
        <div>
            {(categoryName && <h1>Topic: {categoryName}</h1>) ||
                (authorName && <h1>Author: {authorName}</h1>) ||
                (search && <h1>Search: {search}</h1>)}

            <Row xs="1" sm="2" lg="3" className="g-4">
                {posts.map(post => {
                    const date = new Date(`${post.dateGmt}Z`);
                    const link = `/article/${date.getUTCFullYear()}/${post.slug}`;

                    return (
                        <Col key={post.id}>
                            <Link href={link} passHref>
                                <a className={styles.postCardLink}>
                                    <Card className={styles.postCard}>
                                        {post.featuredImage && (
                                            <div className={styles.postThumbnailContainer}>
                                                <Card.Img
                                                    as={Image}
                                                    src={post.featuredImage.node.mediaItemUrl}
                                                    alt={post.title}
                                                    quality={100}
                                                    layout="fill"
                                                    objectFit="cover"
                                                />
                                            </div>
                                        )}

                                        <Card.Body>
                                            <Card.Title>{post.title}</Card.Title>

                                            <Card.Text as="div">
                                                {/* eslint-disable-next-line react/no-danger */}
                                                <div dangerouslySetInnerHTML={{ __html: post.excerpt }} />
                                            </Card.Text>

                                            <Card.Text as="div" className={styles.postMeta}>
                                                <span>
                                                    <FontAwesomeIcon icon={faTag} />
                                                    {post.categories.nodes[0].name}
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
                                            </Card.Text>
                                        </Card.Body>
                                    </Card>
                                </a>
                            </Link>
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
}
