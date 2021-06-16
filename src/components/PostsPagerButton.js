import { Button } from 'react-bootstrap';
import Link from 'next/link';

export default function PostsPagerButton({ path, enabled, children }) {
    const getPagerButton = () => (
        <Button disabled={!enabled} variant={enabled ? 'primary' : 'secondary'}>
            {children}
        </Button>
    );

    if (path.pathname === '#') return getPagerButton();

    return (
        <Link href={path} passHref>
            {getPagerButton(enabled)}
        </Link>
    );
}
