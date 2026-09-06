import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createStart } from "@tanstack/react-start";
import { validateEnv } from "~/lib/env";

validateEnv();

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [clerkMiddleware()],
  };
});
