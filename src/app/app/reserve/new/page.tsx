import { notFound } from "next/navigation";
import { getProReserveInfo } from "@/lib/reads";
import { ReserveForm } from "./ReserveForm";

export const dynamic = "force-dynamic";

export default async function NewReservation({
  searchParams,
}: {
  searchParams: { pro?: string };
}) {
  const proId = searchParams.pro;
  if (!proId) notFound();

  const pro = await getProReserveInfo(proId);
  if (!pro) notFound();

  return <ReserveForm proId={pro.proId} proName={pro.name} shopName={pro.shopName} services={pro.services} />;
}
