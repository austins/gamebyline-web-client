import { Card, Col, Row } from "react-bootstrap";
import Link from "next/link";
import Image from "next/image";
import styles from "../styles/Posts.module.scss";
import Time from "./Time";
import { Clock, Tag } from "phosphor-react";

export default function Posts({ authorName, categoryName, posts, search }) {
    return (
        <div>
            {(categoryName && <h1>Topic: {categoryName}</h1>) ||
                (authorName && <h1>Author: {authorName}</h1>) ||
                (search && <h1>Search: {search}</h1>)}

            <Row xs="1" sm="2" lg="3" className="g-4">
                {posts.map((post) => {
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
                                                    placeholder="blur"
                                                    blurDataURL={post.featuredImage.node.blurDataURL}
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
                                                <div dangerouslySetInnerHTML={{ __html: post.excerpt }} />
                                            </Card.Text>

                                            <Card.Text as="div" className={styles.postMeta}>
                                                <span>
                                                    <Tag weight="fill" />
                                                    {post.categories.nodes[0].name}
                                                </span>

                                                <span>
                                                    <Clock weight="fill" />
                                                    <Time dateUtc={`${post.dateGmt}Z`} />
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
