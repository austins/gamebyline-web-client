import { Container } from "react-bootstrap";
import { animateScroll as scroll } from "react-scroll";
import { ArrowLineUp } from "phosphor-react";

export default function Footer() {
    const siteCopyrightStartYear = Number(process.env.NEXT_PUBLIC_SITE_COPYRIGHT_START_YEAR);
    const currentYear = new Date().getUTCFullYear();

    const scrollToTop = (e) => {
        e.preventDefault();
        scroll.scrollToTop({ duration: 100, smooth: true });
    };

    return (
        <footer id="footer">
            <Container className="clearfix">
                <div className="float-start">
                    <em>{process.env.NEXT_PUBLIC_SITE_NAME}</em> &copy; {siteCopyrightStartYear}
                    {siteCopyrightStartYear < currentYear && `-${currentYear}`}
                </div>

                <div className="float-end">
                    <a href="#" onClick={scrollToTop}>
                        <ArrowLineUp weight="bold" />
                    </a>
                </div>
            </Container>
        </footer>
    );
}
