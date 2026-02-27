import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../server/routers";

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        headers() {
          const token = localStorage.getItem("sp_token");
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
