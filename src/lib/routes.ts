export type Role = "customer" | "professional" | "admin";

/** Home path for a role. Client-safe (no server-only imports). */
export function homeFor(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "professional") return "/pro";
  return "/app";
}
