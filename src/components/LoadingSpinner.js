import { Spinner } from "react-bootstrap";

export default function LoadingSpinner() {
    return (
        <div className="text-center">
            <Spinner animation="border">
                <span className="sr-only">Loading...</span>
            </Spinner>
        </div>
    );
}
