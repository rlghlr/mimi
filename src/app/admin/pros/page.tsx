import { createClient } from "@/lib/supabase/server";
import { Avatar, Badge, Empty } from "@/components/ui";
import { CATEGORY_LABELS } from "@/lib/constants";
import { approveProAction, rejectProAction } from "../actions";
import type { CategoryType } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function AdminPros() {
  const supabase = createClient();

  const { data } = await supabase
    .from("professional_profiles")
    .select("user_id, name, avatar_url, region, career, specialties, services, certificates, sns_url, bio, approved")
    .eq("approved", false)
    .order("created_at", { ascending: true });

  const pros = data ?? [];

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <h1 className="font-display text-3xl mb-1">전문가 승인</h1>
      <p className="text-ink-3 text-sm mb-8">
        승인 대기 <b className="text-ink">{pros.length}</b>건 · 자격·경력·근무매장·SNS·포트폴리오 확인
      </p>

      {pros.length === 0 ? (
        <Empty icon="✓" text="대기 중인 승인 요청이 없어요." />
      ) : (
        <ul className="flex flex-col gap-4">
          {pros.map((p) => (
            <li key={p.user_id} className="card p-5">
              <div className="flex items-start gap-4">
                <Avatar src={p.avatar_url} name={p.name} size={56} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-lg">{p.name ?? "미입력"}</span>
                    <Badge tone="warn">승인대기</Badge>
                  </div>
                  <div className="text-[13px] text-ink-2 mt-1">{[p.region, p.career].filter(Boolean).join(" · ") || "정보 미입력"}</div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(p.specialties as CategoryType[] | null)?.map((s) => (
                      <Badge key={s} tone="accent">{CATEGORY_LABELS[s] ?? s}</Badge>
                    ))}
                  </div>

                  <dl className="mt-3 text-[13px] grid grid-cols-[80px_1fr] gap-y-1.5 text-ink-2">
                    {p.bio && (<><dt className="text-ink-3">소개</dt><dd>{p.bio}</dd></>)}
                    {p.services?.length ? (<><dt className="text-ink-3">시술</dt><dd>{p.services.join(", ")}</dd></>) : null}
                    {p.certificates?.length ? (<><dt className="text-ink-3">자격</dt><dd>{p.certificates.join(", ")}</dd></>) : null}
                    {p.sns_url && (<><dt className="text-ink-3">SNS</dt><dd className="truncate">{p.sns_url}</dd></>)}
                  </dl>
                </div>
              </div>

              <div className="flex gap-2 mt-4 justify-end">
                <form action={rejectProAction}>
                  <input type="hidden" name="user_id" value={p.user_id} />
                  <button className="btn-ghost px-4 py-2 text-[14px]">반려</button>
                </form>
                <form action={approveProAction}>
                  <input type="hidden" name="user_id" value={p.user_id} />
                  <button className="btn-primary px-5 py-2 text-[14px]">승인</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
