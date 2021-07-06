import parse from "html-react-parser";
import styles from "../styles/Page.module.scss";
import { parseImages } from "../lib/data/helpers";

export default function Page({ page, parseContent = false }) {
    return (
        <article>
            <h1>{page.title}</h1>

            <div className={`clearfix ${styles.pageContent}`}>
                {parseContent ? parseImages(page.content) : parse(page.content)}
            </div>
        </article>
    );
}
