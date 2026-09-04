import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReserveForm } from "./ReserveForm";

export const dynamic = "force-dynamic";

export default async function NewReservation({
  searchParams,
}: {
  searchParams: { pro?: string };
}) {
  const proId = searchParams.pro;
  if (!proId) notFound();

  const supabase = createClient();
  const { data: pro } = await supabase
    .from("professional_profiles")
    .select("user_id, name, avatar_url, region, services, shop_id")
    .eq("user_id", proId)
    .single();
  if (!pro) notFound();

  let shopName: string | null = null;
  if (pro.shop_id) {
    const { data: shop } = await supabase.from("shops").select("name").eq("id", pro.shop_id).single();
    shopName = shop?.name ?? null;
  }

  return <ReserveForm proId={pro.user_id} proName={pro.name ?? "전문가"} shopName={shopName} services={pro.services ?? []} />;
}
