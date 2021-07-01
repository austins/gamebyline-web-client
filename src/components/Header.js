import { Button, Container, Form, FormControl, InputGroup, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import Link from 'next/link';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import Image from 'next/image';
import logoLight from '../../public/assets/images/logo-light.png';
import HeaderMenuItemLink from './HeaderMenuItemLink';
import styles from '../styles/Header.module.scss';
import globalDataManifest from '../../globalDataManifest.json';
import { mapMenuItemsChildrenToParents } from '../lib/data/helpers';

export default function Header() {
    const router = useRouter();

    // Get menu items.
    let menuItems = globalDataManifest.headerMenuItems ?? [];
    if (menuItems.length) menuItems = mapMenuItemsChildrenToParents(menuItems);

    const search = e => {
        e.preventDefault();

        const searchValue = e.target.search.value.trim();
        if (searchValue.length) {
            router.push({ pathname: '/articles', query: { search: searchValue } });
            e.target.search.value = '';
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
                            {!menuItems.length ? (
                                <HeaderMenuItemLink href="/">
                                    <a className="nav-link">Home</a>
                                </HeaderMenuItemLink>
                            ) : (
                                menuItems.map(menuItem => {
                                    if (!menuItem.children.length) {
                                        return (
                                            <HeaderMenuItemLink key={menuItem.id} href={menuItem.url}>
                                                <a
                                                    className="nav-link"
                                                    target={menuItem.isExternal ? '_blank' : '_self'}
                                                >
                                                    {menuItem.label}
                                                </a>
                                            </HeaderMenuItemLink>
                                        );
                                    }

                                    return (
                                        <NavDropdown key={menuItem.id} id={menuItem.id} title={menuItem.label}>
                                            {menuItem.children.map(childMenuItem => (
                                                <HeaderMenuItemLink key={childMenuItem.id} href={childMenuItem.url}>
                                                    <NavDropdown.Item
                                                        target={childMenuItem.isExternal ? '_blank' : '_self'}
                                                    >
                                                        {childMenuItem.label}
                                                    </NavDropdown.Item>
                                                </HeaderMenuItemLink>
                                            ))}
                                        </NavDropdown>
                                    );
                                })
                            )}
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
