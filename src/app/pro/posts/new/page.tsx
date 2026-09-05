import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getProApproved } from "@/lib/data";
import { listCategories } from "@/lib/reads";
import { PostForm } from "./PostForm";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const me = (await getSessionUser())!;

  const [approved, categories] = await Promise.all([
    getProApproved(me.id),
    listCategories(),
  ]);

  if (!approved) {
    return (
      <div className="px-5 py-16 text-center">
        <div className="text-3xl mb-3">🔒</div>
        <h1 className="font-bold text-lg mb-2">아직 승인 전이에요</h1>
        <p className="text-ink-2 text-sm mb-6">
          운영자 승인 후 모집 공고를 등록할 수 있어요.
        </p>
        <Link href="/pro/my/profile" className="btn-primary inline-flex">프로필 완성하기</Link>
      </div>
    );
  }

  return <PostForm categories={categories} />;
}
