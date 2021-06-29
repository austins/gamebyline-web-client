import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import HeadWithTitle from './HeadWithTitle';

export default function Error({ statusCode }) {
    const is404 = statusCode === StatusCodes.NOT_FOUND;
    const title = is404 ? 'Page Not Found' : `Error: ${getReasonPhrase(statusCode)}`;

    return (
        <div className="text-center">
            <HeadWithTitle title={title} noIndex />

            <h1>{title}</h1>

            <p>{is404 ? 'This page could not be found.' : `An error ${statusCode} occurred.`}</p>
        </div>
    );
}
