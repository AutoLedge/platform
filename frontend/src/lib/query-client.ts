import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // reuse cached data for 30s, then refresh in the background
      retry: (failureCount, error) =>
        // Retrying a 401/403/404 won't change the answer; retry server errors twice.
        !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    },
  },
});