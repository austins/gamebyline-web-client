import { Breadcrumb } from "react-bootstrap";
import Link from "next/link";

export default function Breadcrumbs({ crumbs }) {
    return (
        <Breadcrumb>
            <Link href="/" passHref>
                <Breadcrumb.Item>Home</Breadcrumb.Item>
            </Link>

            {Array.isArray(crumbs) &&
                crumbs.map((crumb) => (
                    <Link key={crumb.path} href={crumb.path} passHref>
                        <Breadcrumb.Item>{crumb.label}</Breadcrumb.Item>
                    </Link>
                ))}
        </Breadcrumb>
    );
}

export function Crumb(path, label) {
    this.path = path;
    this.label = label;
}
