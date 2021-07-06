import { StatusCodes } from "http-status-codes";
import Error from "../components/Error";

function CustomError({ statusCode }) {
    return <Error statusCode={statusCode} />;
}

CustomError.getInitialProps = ({ res, err }) => ({
    statusCode: res ? res.statusCode : err ? err.statusCode : StatusCodes.NOT_FOUND,
});

export default CustomError;
