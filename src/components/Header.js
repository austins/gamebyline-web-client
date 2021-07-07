import { Button, Container, Form, FormControl, InputGroup, Nav, Navbar, NavDropdown } from "react-bootstrap";
import Link from "next/link";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import Image from "next/image";
import useSWR, { mutate } from "swr";
import get from "lodash/get";
import isObject from "lodash/isObject";
import has from "lodash/has";
import logoLight from "../../public/assets/images/logo-light.png";
import HeaderMenuItemLink from "./HeaderMenuItemLink";
import styles from "../styles/Header.module.scss";
import { mapMenuItemsChildrenToParents } from "../lib/data/helpers";
import { graphqlFetcher } from "../lib/data/fetchers";
import { headerMenuQuery } from "../lib/data/queries";
import isJSON from "validator/lib/isJSON";

export default function Header() {
    const router = useRouter();

    // Get menu items.
    const headerMenuDataCacheKey = "headerMenuData";
    if (typeof window !== "undefined") {
        const headerMenuDataCache = localStorage.getItem(headerMenuDataCacheKey);
        if (headerMenuDataCache && isJSON(headerMenuDataCache)) {
            const parsedHeaderMenuDataCache = JSON.parse(headerMenuDataCache);
            if (isObject(parsedHeaderMenuDataCache) && has(parsedHeaderMenuDataCache, "menu.menuItems.nodes"))
                mutate(headerMenuQuery, parsedHeaderMenuDataCache, false);
        }
    }

    const { data: headerMenuData } = useSWR(headerMenuQuery, graphqlFetcher, {
        revalidateOnMount: true,
        onSuccess: (fetchedHeaderMenuData) =>
            localStorage.setItem(headerMenuDataCacheKey, JSON.stringify(fetchedHeaderMenuData)),
    });

    let menuItems = get(headerMenuData ?? {}, "menu.menuItems.nodes", []);
    if (menuItems.length) menuItems = mapMenuItemsChildrenToParents(menuItems);

    const search = (e) => {
        e.preventDefault();

        const searchValue = e.target.search.value.trim();
        if (searchValue.length) {
            router.push({ pathname: "/articles", query: { search: searchValue } });
            e.target.search.value = "";
        }
    };

    return (
        <header>
            <Navbar bg="dark" variant="dark" expand="lg" className={styles.navbar}>
                <Container>
                    <Link href="/" passHref>
                        <Navbar.Brand className={styles.navbarBrand}>
                            <Image src={logoLight} alt={process.env.NEXT_PUBLIC_SITE_NAME} quality={100} priority />
                        </Navbar.Brand>
                    </Link>

                    <Navbar.Toggle aria-controls="navbar-collapse" />

                    <Navbar.Collapse id="navbar-collapse">
                        <Nav className="me-auto">
                            {menuItems.length > 0 &&
                                menuItems.map((menuItem) => {
                                    if (!menuItem.children.length) {
                                        return (
                                            <HeaderMenuItemLink key={menuItem.id} href={menuItem.url}>
                                                <Nav.Link target={menuItem.isExternal ? "_blank" : "_self"}>
                                                    {menuItem.label}
                                                </Nav.Link>
                                            </HeaderMenuItemLink>
                                        );
                                    }

                                    return (
                                        <NavDropdown key={menuItem.id} id={menuItem.id} title={menuItem.label}>
                                            {menuItem.children.map((childMenuItem) => (
                                                <HeaderMenuItemLink key={childMenuItem.id} href={childMenuItem.url}>
                                                    <NavDropdown.Item
                                                        target={childMenuItem.isExternal ? "_blank" : "_self"}
                                                    >
                                                        {childMenuItem.label}
                                                    </NavDropdown.Item>
                                                </HeaderMenuItemLink>
                                            ))}
                                        </NavDropdown>
                                    );
                                })}
                        </Nav>

                        <Form onSubmit={search} className="d-flex">
                            <InputGroup>
                                <FormControl
                                    type="text"
                                    name="search"
                                    placeholder="Search articles"
                                    className={styles.searchInput}
                                    required
                                />

                                <Button type="submit" variant="primary">
                                    <FontAwesomeIcon icon={faSearch} />
                                </Button>
                            </InputGroup>
                        </Form>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </header>
    );
}
