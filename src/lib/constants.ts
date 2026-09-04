// Muse · shared labels, enum maps, and user-facing messages (KO)

export const BRAND = {
  name: "Muse",
  ko: "뮤즈",
  tagline: "뷰티 모델과 아티스트를 잇다",
  credit: "Muse Credit",
} as const;

export type Role = "customer" | "professional" | "admin";

export const CATEGORY_LABELS: Record<string, string> = {
  hair: "헤어",
  makeup: "메이크업",
  nail: "네일",
  lash: "속눈썹",
  skin: "피부/에스테틱",
  semi_permanent: "반영구",
  tattoo: "타투",
};

export const COST_TYPE_LABELS: Record<string, string> = {
  free: "무료",
  model_pay: "모델비 지급",
  material_fee: "재료비 발생",
  discount: "할인 시술",
  negotiable: "협의",
};

export const POST_STATUS_LABELS: Record<string, string> = {
  recruiting: "모집중",
  closing_soon: "마감임박",
  completed: "모집완료",
  ended: "종료",
  cancelled: "취소",
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  applied: "지원완료",
  reviewing: "확인중",
  chatting: "채팅중",
  matched: "매칭확정",
  rejected: "미선정",
  cancelled: "지원취소",
};

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  requested: "예약요청",
  confirmed: "예약확정",
  upcoming: "방문예정",
  completed: "시술완료",
  cancelled: "예약취소",
  no_show: "노쇼",
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  fake_post: "허위 공고",
  no_show: "노쇼",
  inappropriate: "부적절한 메시지",
  price_change: "가격 변경",
  fraud: "사기",
  illegal: "불법 시술",
  other: "기타",
};

// Edge-case → user-facing message (§10 of the spec).
export const ERROR_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: "로그인이 필요해요.",
  POST_NOT_FOUND: "삭제된 공고예요.",
  POST_CLOSED: "이미 모집이 마감된 공고예요.",
  POST_FULL: "모집 인원이 모두 찼어요.",
  ALREADY_APPLIED: "이미 지원한 공고예요.",
  FORBIDDEN: "권한이 없어요.",
  INSUFFICIENT_CREDIT: "크레딧이 부족해요. 충전 후 이용해 주세요.",
  INVALID_AMOUNT: "금액이 올바르지 않아요.",
  NETWORK: "연결이 불안정해요. 잠시 후 다시 시도해 주세요.",
  DEFAULT: "문제가 발생했어요. 다시 시도해 주세요.",
};

export function messageForError(err: unknown): string {
  const raw =
    typeof err === "object" && err && "message" in err
      ? String((err as { message: unknown }).message)
      : String(err ?? "");
  for (const key of Object.keys(ERROR_MESSAGES)) {
    if (raw.includes(key)) return ERROR_MESSAGES[key];
  }
  return ERROR_MESSAGES.DEFAULT;
}

// Credit pricing (§14–16)
export const CREDIT_PACKS = [
  { credits: 100, price: 11000 },
  { credits: 500, price: 52000 },
  { credits: 1000, price: 99000 },
] as const;

export const BOOST_PRODUCTS = [
  { key: "urgent", label: "빠른 매칭 (급구)", credits: 10, desc: "24~72시간 내 우선 노출" },
  { key: "premium", label: "프리미엄 공고", credits: 20, desc: "추천 영역 상단 고정" },
  { key: "top_24h", label: "24시간 상단 노출", credits: 15, desc: "목록 최상단" },
  { key: "top_3d", label: "3일 상단 노출", credits: 35, desc: "목록 최상단 3일" },
  { key: "top_7d", label: "7일 상단 노출", credits: 70, desc: "목록 최상단 7일" },
] as const;
