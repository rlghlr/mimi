import { createClient } from "@/lib/supabase/server";
import { ConsultForm } from "./ConsultForm";

export const dynamic = "force-dynamic";

export default async function NewConsultPage() {
  const supabase = createClient();
  const { data: categories } = await supabase.from("categories").select("id, name, type").order("sort");
  return <ConsultForm categories={categories ?? []} />;
}
