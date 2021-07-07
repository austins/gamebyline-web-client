import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { capitalize } from "lodash";

dayjs.extend(relativeTime);

export default function Time({ dateUtc, withTimeInTitle = false }) {
    const titleFormat = `${process.env.NEXT_PUBLIC_DEFAULT_POST_DATE_FORMAT}${
        withTimeInTitle === true ? " @ h:mm A" : ""
    }`;

    const parsedDate = dayjs(dateUtc);

    return (
        <time dateTime={dateUtc} title={parsedDate.format(titleFormat)}>
            {capitalize(parsedDate.fromNow())}
        </time>
    );
}
