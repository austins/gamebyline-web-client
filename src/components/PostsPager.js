import { ButtonGroup } from "react-bootstrap";
import styles from "../styles/PostsPager.module.scss";
import PostsPagerButton from "./PostsPagerButton";
import { CaretLeft, CaretRight } from "phosphor-react";

export default function PostsPager({ authorSlug, categorySlug, hasMore, hasPrevious, page, search }) {
    const articlesPath = "/articles";
    const pathnameBase = categorySlug
        ? `${articlesPath}/topic/${categorySlug}`
        : authorSlug
        ? `${articlesPath}/author/${authorSlug}`
        : articlesPath;

    const paths = {
        hasMorePath: {
            pathname: hasMore && !search ? `${pathnameBase}/${page + 1}` : search ? articlesPath : "#",
        },
        hasPreviousPath: {
            pathname: hasPrevious && !search ? `${pathnameBase}/${page - 1}` : search ? articlesPath : "#",
        },
    };

    if (search) {
        paths.hasMorePath.query = { search, page: page + 1 };
        paths.hasPreviousPath.query = { search, page: page - 1 };
    }

    return (
        <div>
            {(hasMore || hasPrevious) && (
                <nav className={styles.pagination}>
                    <ButtonGroup>
                        <PostsPagerButton path={paths.hasMorePath} enabled={hasMore}>
                            <CaretLeft weight="fill" /> Older
                        </PostsPagerButton>

                        <PostsPagerButton path={paths.hasPreviousPath} enabled={hasPrevious}>
                            Newer <CaretRight weight="fill" />
                        </PostsPagerButton>
                    </ButtonGroup>
                </nav>
            )}
        </div>
    );
}
