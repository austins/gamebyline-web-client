import { StatusCodes } from "http-status-codes";
import Error from "../components/Error";

export default function Custom404() {
    return <Error statusCode={StatusCodes.NOT_FOUND} />;
}
