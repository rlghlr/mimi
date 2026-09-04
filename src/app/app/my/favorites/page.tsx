import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { Avatar, Empty } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Favorites() {
  const supabase = createClient();
  const me = (await getSessionUser())!;

  const { data: favs } = await supabase
    .from("favorites")
    .select("id, target_type, target_id, created_at")
    .eq("user_id", me.id)
    .order("created_at", { ascending: false });

  const proIds = (favs ?? []).filter((f) => f.target_type === "professional").map((f) => f.target_id);
  const postIds = (favs ?? []).filter((f) => f.target_type === "post").map((f) => f.target_id);

  const [{ data: pros }, { data: posts }] = await Promise.all([
    proIds.length
      ? supabase.from("professional_profiles").select("user_id, name, avatar_url, region, rating_avg").in("user_id", proIds)
      : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase.from("recruit_posts").select("id, title, reference_images, region").in("id", postIds)
      : Promise.resolve({ data: [] }),
  ]);

  const empty = !favs || favs.length === 0;

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-ground/95 backdrop-blur px-4 py-3 flex items-center gap-2">
        <Link href="/app/my" aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <span className="font-semibold">찜</span>
      </header>

      {empty ? (
        <Empty icon="♡" text="찜한 전문가·공고가 없어요." />
      ) : (
        <div className="px-5 py-4 flex flex-col gap-5">
          {pros && pros.length > 0 && (
            <section>
              <h2 className="text-[14px] font-bold mb-2">전문가</h2>
              <ul className="flex flex-col gap-2.5">
                {pros.map((p) => (
                  <li key={p.user_id}>
                    <Link href={`/app/pros/${p.user_id}`} className="card p-3.5 flex items-center gap-3">
                      <Avatar src={p.avatar_url} name={p.name} size={44} />
                      <div className="flex-1"><div className="font-semibold text-[14px]">{p.name}</div>
                        <div className="text-[12px] text-ink-3">{p.region} · ★ {Number(p.rating_avg).toFixed(1)}</div></div>
                      <span className="text-ink-3">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {posts && posts.length > 0 && (
            <section>
              <h2 className="text-[14px] font-bold mb-2">모집 공고</h2>
              <ul className="flex flex-col gap-2.5">
                {posts.map((po) => (
                  <li key={po.id}>
                    <Link href={`/app/posts/${po.id}`} className="card p-3.5 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-surface-2 overflow-hidden shrink-0">
                        {po.reference_images?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={po.reference_images[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1"><div className="font-semibold text-[14px] truncate">{po.title}</div>
                        <div className="text-[12px] text-ink-3">{po.region}</div></div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
