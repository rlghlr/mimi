import { COST_TYPE_LABELS } from "@/lib/constants";
import type { RecruitPostRow } from "@/lib/database.types";

/** Human cost summary for a recruit post. */
export function costSummary(post: Pick<RecruitPostRow, "cost_type" | "pay_amount" | "charge_amount">): string {
  const label = COST_TYPE_LABELS[post.cost_type] ?? post.cost_type;
  if (post.cost_type === "model_pay" && post.pay_amount) {
    return `모델비 ${won(post.pay_amount)}`;
  }
  if (post.cost_type === "material_fee" && post.charge_amount) {
    return `재료비 ${won(post.charge_amount)}`;
  }
  return label;
}

export function won(n: number | null | undefined): string {
  if (!n) return "0원";
  return `${n.toLocaleString("ko-KR")}원`;
}

/** e.g. "3일 전", "방금 전" */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  const mo = Math.floor(day / 30);
  return `${mo}개월 전`;
}

/** Hours remaining until a deadline date, for 급구 badges. */
export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}
