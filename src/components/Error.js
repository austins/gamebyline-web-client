import { getReasonPhrase, StatusCodes } from "http-status-codes";
import HeadWithTitle from "./HeadWithTitle";

export default function Error({ statusCode }) {
    const title = statusCode
        ? statusCode === StatusCodes.NOT_FOUND
            ? "Page Not Found"
            : `Error: ${getReasonPhrase(statusCode)}`
        : "Error";

    return (
        <div className="text-center">
            <HeadWithTitle title={title} noIndex />

            <h1>{title}</h1>

            <div>
                {statusCode
                    ? statusCode === StatusCodes.NOT_FOUND
                        ? "This page could not be found."
                        : `An error ${statusCode} occurred on the server.`
                    : "An error occurred on the client."}
            </div>
        </div>
    );
}
