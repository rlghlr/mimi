import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getReviewFormData } from "@/lib/reads";
import { ReviewForm } from "./ReviewForm";

export const dynamic = "force-dynamic";

export default async function NewReview({ searchParams }: { searchParams: { reservation?: string } }) {
  const id = searchParams.reservation;
  if (!id) notFound();

  const me = (await getSessionUser())!;
  const data = await getReviewFormData(id, me.id);
  if (!data) notFound();

  return <ReviewForm reservationId={data.id} service={data.service} proName={data.proName} />;
}
