import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { ForbiddenError, UnauthorizedError } from "~/lib/errors";

/**
 * Require a signed-in user who holds the admin role.
 *
 * Role source: Clerk `publicMetadata.role === "admin"`, read through the
 * Backend API so metadata changes take effect immediately (no stale-token
 * window). Signed out → 401; signed in without the role → 403.
 *
 * Returns the authenticated userId (already verified to be an admin).
 */
export async function requireAdmin(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new UnauthorizedError();

  const client = clerkClient();
  const user = await client.users.getUser(userId);
  const role = (user.publicMetadata as { role?: string } | null | undefined)?.role;
  if (role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }
  return userId;
}
