import { Container, Navbar } from "react-bootstrap";
import Link from "next/link";
import Image from "next/image";
import logoLight from "../../public/assets/images/logo-light.png";
import styles from "../styles/Header.module.scss";
import dynamic from "next/dynamic";

const HeaderMenu = dynamic(() => import("./HeaderMenu"), { ssr: false });

export default function Header() {
    return (
        <header>
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Link href="/" passHref>
                        <Navbar.Brand className={styles.navbarBrand}>
                            <Image src={logoLight} alt={process.env.NEXT_PUBLIC_SITE_NAME} quality={100} priority />
                        </Navbar.Brand>
                    </Link>

                    <HeaderMenu />
                </Container>
            </Navbar>
        </header>
    );
}
