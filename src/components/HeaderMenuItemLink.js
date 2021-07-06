import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function HeaderMenuItemLink({ href, children }) {
    const router = useRouter();

    let className = children.props.className || "";
    if (router.asPath === href) className = `${className} active`;

    return (
        <Link href={href} passHref>
            {React.cloneElement(children, { className })}
        </Link>
    );
}
