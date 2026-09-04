import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { ReviewForm } from "./ReviewForm";

export const dynamic = "force-dynamic";

export default async function NewReview({ searchParams }: { searchParams: { reservation?: string } }) {
  const id = searchParams.reservation;
  if (!id) notFound();

  const supabase = createClient();
  const me = (await getSessionUser())!;
  const { data: r } = await supabase
    .from("reservations")
    .select("id, customer_id, status, service, pro:professional_profiles!fk_reservation_pro_profile(name)")
    .eq("id", id)
    .single();

  if (!r || r.customer_id !== me.id || r.status !== "completed") notFound();
  const proName = (r.pro as unknown as { name: string | null } | null)?.name ?? "전문가";

  return <ReviewForm reservationId={r.id} service={r.service ?? ""} proName={proName} />;
}
