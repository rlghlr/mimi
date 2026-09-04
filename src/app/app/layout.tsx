import { BottomNav } from "@/components/BottomNav";
import { getSessionUser, homeFor } from "@/lib/auth";
import { redirect } from "next/navigation";

/** Customer app shell — auth-gated, with bottom GNB. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  // Pros/admins have their own shells.
  if (user.role !== "customer") redirect(homeFor(user.role));

  return (
    <div className="app-shell flex flex-col">
      <div className="flex-1 pb-2">{children}</div>
      <BottomNav variant="customer" />
    </div>
  );
}
