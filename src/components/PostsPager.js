import { ButtonGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import styles from '../styles/PostsPager.module.scss';
import PostsPagerButton from './PostsPagerButton';

export default function PostsPager({ authorSlug, categorySlug, hasMore, hasPrevious, page, search }) {
    const articlesPath = '/articles';
    const pathnameBase = categorySlug
        ? `${articlesPath}/topic/${categorySlug}`
        : authorSlug
        ? `${articlesPath}/author/${authorSlug}`
        : articlesPath;

    const paths = {
        hasMorePath: {
            pathname: hasMore && !search ? `${pathnameBase}/${page + 1}` : search ? articlesPath : '#',
        },
        hasPreviousPath: {
            pathname: hasPrevious && !search ? `${pathnameBase}/${page - 1}` : search ? articlesPath : '#',
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
                            <FontAwesomeIcon icon={faChevronLeft} /> Older
                        </PostsPagerButton>

                        <PostsPagerButton path={paths.hasPreviousPath} enabled={hasPrevious}>
                            Newer <FontAwesomeIcon icon={faChevronRight} />
                        </PostsPagerButton>
                    </ButtonGroup>
                </nav>
            )}
        </div>
    );
}
