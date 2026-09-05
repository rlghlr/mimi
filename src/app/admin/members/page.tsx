import { adminListUsers } from "@/lib/reads";
import { Badge, Empty } from "@/components/ui";
import { setUserStatusAction } from "../actions";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "정상", pending: "승인대기", suspended: "정지", withdrawn: "탈퇴", reported: "신고",
};
const STATUS_TONE: Record<string, "good" | "warn" | "crit" | "neutral"> = {
  active: "good", pending: "warn", suspended: "crit", withdrawn: "neutral", reported: "crit",
};

export default async function AdminMembers({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const role = searchParams.role;
  const users = await adminListUsers(role);

  const tab = (href: string, label: string, active: boolean) => (
    <a href={href} className={`chip border ${active ? "bg-ink text-ground border-ink" : "bg-surface text-ink-2 border-border"}`}>{label}</a>
  );

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <h1 className="font-display text-3xl mb-4">회원관리</h1>
      <div className="flex gap-2 mb-6">
        {tab("/admin/members", "전체", !role)}
        {tab("/admin/members?role=customer", "일반·모델", role === "customer")}
        {tab("/admin/members?role=professional", "전문가", role === "professional")}
      </div>

      {users.length === 0 ? (
        <Empty text="회원이 없어요." />
      ) : (
        <div className="tw overflow-x-auto card">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-ink-3 border-b border-border">
                <th className="p-3 font-medium">이메일</th>
                <th className="p-3 font-medium">유형</th>
                <th className="p-3 font-medium">상태</th>
                <th className="p-3 font-medium">노쇼</th>
                <th className="p-3 font-medium">가입</th>
                <th className="p-3 font-medium text-right">조치</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 text-ink-2">
                    {u.role === "professional" ? "전문가" : u.role === "admin" ? "운영자" : "일반"}
                  </td>
                  <td className="p-3"><Badge tone={STATUS_TONE[u.status]}>{STATUS_LABEL[u.status]}</Badge></td>
                  <td className="p-3 tabular-nums">{u.no_show_count}</td>
                  <td className="p-3 text-ink-3">{timeAgo(u.created_at)}</td>
                  <td className="p-3">
                    {u.role !== "admin" && (
                      <form action={setUserStatusAction} className="flex justify-end gap-1">
                        <input type="hidden" name="user_id" value={u.id} />
                        <select name="status" defaultValue={u.status}
                          className="text-[12px] border border-border rounded-md px-2 py-1 bg-surface">
                          {Object.entries(STATUS_LABEL).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <button className="btn-ghost px-2.5 py-1 text-[12px]">변경</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
