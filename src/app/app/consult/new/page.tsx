import { listCategories } from "@/lib/reads";
import { ConsultForm } from "./ConsultForm";

export const dynamic = "force-dynamic";

export default async function NewConsultPage() {
  const categories = await listCategories();
  return <ConsultForm categories={categories} />;
}
