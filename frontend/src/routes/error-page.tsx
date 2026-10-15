import { Link, Navigate, isRouteErrorResponse, useRouteError } from "react-router";
import { ApiError } from "@/lib/api";

function describe(error: unknown): { title: string; message: string } {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 0:
        return { title: "Can't reach the server", message: "Check your connection and try again." };
      case 403:
        return { title: "No access", message: "You don't have permission to view this." };
      case 404:
        return { title: "Not found", message: "This item doesn't exist or was removed." };
      default:
        if (error.status >= 500) {
          return { title: "Server error", message: "Something went wrong on our end. Try again shortly." };
        }
        return { title: "Request failed", message: `The server responded with ${error.status}.` };
    }
  }
  if (isRouteErrorResponse(error) && error.status === 404) {
    return { title: "Page not found", message: "There's nothing at this address." };
  }
  return { title: "Something went wrong", message: "An unexpected error occurred." };
}

export default function ErrorPage() {
  const error = useRouteError();

  // Signed out: go to login rather than showing an error.
  if (error instanceof ApiError && error.status === 401) {
    return <Navigate to="/login" replace />;
  }

  const { title, message } = describe(error);

  return (
    <main role="alert">
      <h1>{title}</h1>
      <p>{message}</p>
      <button type="button" onClick={() => window.location.reload()}>
        Try again
      </button>
      <Link to="/">Back to dashboard</Link>

      {/* Full details while developing; stripped from production builds */}
      {import.meta.env.DEV && <pre>{String(error)}</pre>}
    </main>
  );
}