import { BottomNav } from "@/components/BottomNav";
import { getSessionUser, homeFor } from "@/lib/auth";
import { redirect } from "next/navigation";

/** Professional app shell — auth-gated, with pro bottom GNB. */
export default async function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "professional") redirect(homeFor(user.role));

  return (
    <div className="app-shell flex flex-col">
      <div className="flex-1 pb-2">{children}</div>
      <BottomNav variant="professional" />
    </div>
  );
}
