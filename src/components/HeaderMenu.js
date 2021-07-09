import HeaderMenuItemLink from "./HeaderMenuItemLink";
import { Button, Form, FormControl, InputGroup, Nav, Navbar, NavDropdown } from "react-bootstrap";
import styles from "../styles/HeaderMenu.module.scss";
import { useRouter } from "next/router";
import { get, has, isObject } from "lodash";
import useSWR from "swr";
import { headerMenuQuery } from "../lib/data/queries";
import { graphqlFetcher } from "../lib/data/fetchers";
import { mapMenuItemsChildrenToParents } from "../lib/data/helpers";
import { MagnifyingGlass } from "phosphor-react";
import isJSON from "validator/lib/isJSON";

export default function HeaderMenu() {
    const router = useRouter();

    // Get header menu data from localStorage.
    let initialHeaderMenuData = {};
    if (typeof window !== "undefined") {
        const headerMenuDataCache = localStorage.getItem("headerMenuData");
        if (headerMenuDataCache && isJSON(headerMenuDataCache)) {
            const parsedHeaderMenuDataCache = JSON.parse(headerMenuDataCache);
            if (isObject(parsedHeaderMenuDataCache) && has(parsedHeaderMenuDataCache, "menu.menuItems.nodes"))
                initialHeaderMenuData = parsedHeaderMenuDataCache;
        }
    }

    const { data: headerMenuData } = useSWR(headerMenuQuery, graphqlFetcher, {
        initialData: initialHeaderMenuData,
        revalidateOnMount: true,
        onSuccess: (fetchedHeaderMenuData) =>
            localStorage.setItem("headerMenuData", JSON.stringify(fetchedHeaderMenuData)),
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
        <>
            <Navbar.Toggle aria-controls="navbar-collapse" />

            <Navbar.Collapse id="navbar-collapse">
                <Nav>
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
                                            <NavDropdown.Item target={childMenuItem.isExternal ? "_blank" : "_self"}>
                                                {childMenuItem.label}
                                            </NavDropdown.Item>
                                        </HeaderMenuItemLink>
                                    ))}
                                </NavDropdown>
                            );
                        })}
                </Nav>

                <Form onSubmit={search} className="d-flex ms-auto">
                    <InputGroup>
                        <FormControl
                            type="text"
                            name="search"
                            placeholder="Search articles"
                            className={styles.searchInput}
                            required
                        />

                        <Button type="submit" variant="primary">
                            <MagnifyingGlass weight="fill" />
                        </Button>
                    </InputGroup>
                </Form>
            </Navbar.Collapse>
        </>
    );
}
