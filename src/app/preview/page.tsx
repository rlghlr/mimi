import { PostCard, type PostWithPro } from "@/components/PostCard";
import { Avatar, Badge } from "@/components/ui";

// Public UX/UI showcase — renders real Muse components with mock data.
// No backend needed. Visit /preview.
export const dynamic = "force-static";

const MOCK_POSTS: PostWithPro[] = [
  {
    id: "1", pro_id: "b1", category_id: "c1", title: "레이어드 단발 커트 모델",
    detail: null, before_condition: null, model_conditions: {}, headcount: 1, matched_count: 0,
    place: "살롱 드 뮤즈", address: null, region: "강남", session_date: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10),
    session_time: "오후 2:00", duration_min: 90, cost_type: "free", pay_amount: 0, charge_amount: 0,
    reference_images: ["https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600"],
    result_images: [], agreements: { sns: true, photo: true, before_after: true }, status: "recruiting",
    is_urgent: false, boost_until: null, view_count: 0, deleted_at: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    pro: { name: "수 아티스트", avatar_url: null, career: "9년차", region: "강남" },
    category: { name: "헤어", type: "hair" }, applicant_count: 4,
  },
  {
    id: "2", pro_id: "b2", category_id: "c2", title: "[급구] 내일 화보 촬영 메이크업",
    detail: null, before_condition: null, model_conditions: {}, headcount: 2, matched_count: 0,
    place: "아뜰리에 로즈", address: null, region: "홍대", session_date: new Date(Date.now() + 864e5).toISOString().slice(0, 10),
    session_time: "오전 10:00", duration_min: 120, cost_type: "model_pay", pay_amount: 30000, charge_amount: 0,
    reference_images: ["https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600"],
    result_images: [], agreements: {}, status: "recruiting", is_urgent: true, boost_until: null,
    view_count: 0, deleted_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    pro: { name: "진 메이크업", avatar_url: null, career: "6년차", region: "홍대" },
    category: { name: "메이크업", type: "makeup" }, applicant_count: 7,
  },
];

function Phone({ label, phase, children }: { label: string; phase?: string; children: React.ReactNode }) {
  return (
    <figure className="m-0 shrink-0">
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <figcaption className="text-[13px] font-semibold text-ink">{label}</figcaption>
        {phase && <span className="chip bg-surface-2 text-ink-3 text-[10px]">{phase}</span>}
      </div>
      <div className="w-[300px] h-[620px] rounded-[28px] border-[6px] border-ink/85 bg-ground overflow-hidden shadow-pop relative">
        <div className="h-full overflow-y-auto no-scrollbar">{children}</div>
      </div>
    </figure>
  );
}

const cx = "px-4"; // screen padding

export default function Preview() {
  return (
    <div className="min-h-dvh bg-surface-2">
      <header className="px-6 pt-10 pb-6 max-w-6xl mx-auto">
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-accent-ink mb-2">Muse · UX/UI Showcase</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-2">화면 미리보기</h1>
        <p className="text-ink-2 max-w-[52ch]">
          실제 컴포넌트·디자인 시스템으로 렌더링한 Muse 앱 화면입니다. MVP 1차(핵심 매칭) + 2차(상담·예약·리뷰·동의)를 포함합니다.
        </p>
      </header>

      <div className="flex gap-8 overflow-x-auto px-6 pb-16 items-start snap-x">
        {/* ---------------- 1차 ---------------- */}
        <Phone label="홈" phase="1차">
          <div className="sticky top-0 bg-ground/95 backdrop-blur px-4 pt-3 pb-2 flex items-center gap-2 z-10">
            <span className="text-[14px] font-bold flex items-center gap-1">📍 강남</span>
            <div className="flex-1" />
            <span className="text-ink-2">🔍</span><span className="text-ink-2">🔔</span>
          </div>
          <div className="px-4 pt-1 pb-4">
            <p className="font-mono text-[10px] tracking-widest uppercase text-accent-ink mb-1">뷰티 모델과 아티스트를 잇다</p>
            <h2 className="font-display text-[22px] leading-tight">오늘, 어울리는 변화를<br />함께할 사람을 찾아요</h2>
          </div>
          <p className="px-4 text-[15px] font-bold mb-2">⚡ 급구 모델</p>
          <div className="flex gap-3 overflow-x-auto px-4 pb-3">
            <div className="w-[180px] shrink-0"><PostCard post={MOCK_POSTS[1]} /></div>
          </div>
          <p className="px-4 text-[15px] font-bold mb-2">최근 모집 공고</p>
          <div className="grid grid-cols-2 gap-3 px-4">
            {MOCK_POSTS.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </Phone>

        <Phone label="공고 상세 · 지원 CTA" phase="1차">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MOCK_POSTS[0].reference_images[0]} alt="" className="w-full aspect-[4/3] object-cover" />
          <div className={cx}>
            <div className="flex gap-1.5 mt-3 mb-2">
              <Badge tone="good">모집중</Badge><Badge tone="accent">헤어</Badge>
            </div>
            <h2 className="text-[20px] font-bold leading-snug mb-3">레이어드 단발 커트 모델 구해요</h2>
            <div className="flex items-center gap-3 py-3 border-y border-border">
              <Avatar name="수" size={40} />
              <div className="flex-1"><div className="font-semibold text-[14px]">수 아티스트</div>
                <div className="text-[12px] text-ink-3">9년차 · 강남</div></div>
              <span className="text-ink-3">›</span>
            </div>
            <div className="card p-3.5 my-3">
              <div className="font-bold text-[14px] mb-1">모집 조건</div>
              {[["시술 비용", "무료"], ["Before 조건", "어깨 아래 길이"], ["연령", "20~30대"], ["모집 인원", "0/1명"]].map(([k, v]) => (
                <div key={k} className="flex gap-3 py-2 border-b border-border last:border-0 text-[13px]">
                  <span className="w-20 text-ink-3">{k}</span><span className="flex-1">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="sticky bottom-0 bg-surface/95 backdrop-blur border-t border-border px-4 py-3">
            <div className="btn-primary w-full">지원하기</div>
          </div>
        </Phone>

        <Phone label="1:1 채팅 · 제안" phase="1차">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-surface sticky top-0">
            <span className="text-ink-2">‹</span><Avatar name="미" size={34} />
            <div className="font-semibold text-[14px]">미나</div>
          </div>
          <div className="px-4 py-4 flex flex-col gap-2.5">
            <div className="self-center text-[11px] text-ink-3 bg-surface-2 rounded-full px-3 py-1">매칭 상담이 시작됐어요</div>
            <div className="self-start max-w-[76%] bg-surface border border-border rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[14px]">안녕하세요! 지원 감사해요 :)</div>
            <div className="self-end max-w-[76%] bg-accent text-white rounded-2xl rounded-br-md px-3.5 py-2.5 text-[14px]">네! 언제 가능하실까요?</div>
            <div className="self-end max-w-[76%] bg-accent text-white rounded-2xl rounded-br-md px-3.5 py-2.5 text-[14px]"><b>📅 시술 날짜 제안: 3/8 오후 2시</b></div>
            <div className="self-start max-w-[76%] bg-surface border border-border rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[14px]"><b>💰 시술 가격 제안: 무료</b></div>
          </div>
          <div className="sticky bottom-0 bg-surface border-t border-border flex items-center gap-2 px-3 py-2.5">
            <span className="w-8 h-8 rounded-full bg-surface-2 grid place-items-center">₩</span>
            <div className="field flex-1 py-2 text-ink-3 text-[13px]">메시지 입력</div>
            <span className="btn-primary px-3 py-2 text-[13px]">전송</span>
          </div>
        </Phone>

        <Phone label="전문가 대시보드" phase="1차">
          <div className="px-4 pt-5 pb-3">
            <p className="font-mono text-[10px] tracking-widest uppercase text-accent-ink">Studio</p>
            <h2 className="font-display text-[22px]">수 아티스트님의 스튜디오</h2>
          </div>
          <div className="grid grid-cols-3 gap-2.5 px-4 mb-5">
            {[["모집중", "2"], ["신규 지원", "5"], ["평점", "4.9"]].map(([l, v]) => (
              <div key={l} className="card p-3 text-center">
                <div className="font-display text-[24px] text-accent leading-none">{v}</div>
                <div className="text-[10px] text-ink-3 mt-1.5">{l}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2.5 px-4 mb-6">
            <div className="btn-primary py-2.5 text-[14px]">＋ 모델 모집</div>
            <div className="btn-outline py-2.5 text-[14px]">상담글 보기</div>
          </div>
          <p className="px-4 text-[15px] font-bold mb-2">내 모집 공고</p>
          <div className="px-4 flex flex-col gap-2.5">
            {["레이어드 단발 커트 모델", "[급구] 화보 메이크업"].map((t, i) => (
              <div key={t} className="card p-3.5 flex items-center gap-3">
                <div className="flex-1"><div className="flex gap-1.5 mb-1">{i === 1 && <Badge tone="crit">급구</Badge>}<Badge tone="good">모집중</Badge></div>
                  <div className="font-semibold text-[13px]">{t}</div>
                  <div className="text-[11px] text-ink-3 mt-0.5">매칭 0/{i + 1}명</div></div>
                <span className="text-ink-3">›</span>
              </div>
            ))}
          </div>
        </Phone>

        <Phone label="지원자 관리 · 매칭" phase="1차">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2 sticky top-0 bg-ground/90">
            <span className="text-ink-2">‹</span><span className="font-semibold text-[14px] flex-1">레이어드 단발 커트</span><Badge tone="good">모집중</Badge>
          </div>
          <p className="px-4 py-3 text-[13px] text-ink-2">지원자 <b>4</b>명 · 매칭 0/1</p>
          <div className="px-4 flex flex-col gap-3">
            {["미나", "하나"].map((n) => (
              <div key={n} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={n} size={40} />
                  <div className="flex-1"><div className="flex items-center gap-2"><span className="font-semibold text-[14px]">{n}</span><Badge tone="warn">확인중</Badge></div>
                    <div className="text-[11px] text-ink-3">여성 · 1990s · 강남</div></div>
                </div>
                <p className="text-[12px] mt-2 bg-surface-2 rounded-lg px-3 py-2">새로운 스타일 도전하고 싶어요!</p>
                <div className="flex gap-2 mt-3">
                  <div className="btn-outline flex-1 py-2 text-[13px]">채팅하기</div>
                  <div className="btn-primary flex-1 py-2 text-[13px]">매칭확정</div>
                  <div className="btn-ghost px-3 py-2 text-[13px]">✕</div>
                </div>
              </div>
            ))}
          </div>
        </Phone>

        {/* ---------------- 2차 ---------------- */}
        <Phone label="뷰티 상담 등록" phase="2차">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2"><span className="text-ink-2">‹</span><span className="font-semibold">뷰티 상담</span></div>
          <div className="px-4 py-4 flex flex-col gap-4">
            <div><div className="label">상담 카테고리</div><div className="field text-ink-3">헤어</div></div>
            <div><div className="label">고민 내용</div><div className="field h-20 text-ink-3 text-[13px]">단발이 어울릴지 상담받고 싶어요. 염색으로 머릿결이 상한 상태예요.</div></div>
            <div className="grid grid-cols-2 gap-3">
              <div><div className="label">희망 지역</div><div className="field text-ink-3">강남</div></div>
              <div><div className="label">예상 예산</div><div className="field text-ink-3">5만원</div></div>
            </div>
            <div><div className="label">현재 / 원하는 스타일 사진</div>
              <div className="grid grid-cols-2 gap-2"><div className="aspect-square rounded-xl bg-surface-2 grid place-items-center text-ink-3 text-2xl">＋</div><div className="aspect-square rounded-xl bg-surface-2 grid place-items-center text-ink-3 text-2xl">＋</div></div>
            </div>
            <div className="btn-primary w-full">상담 등록</div>
          </div>
        </Phone>

        <Phone label="전문가 제안 비교" phase="2차">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2"><span className="text-ink-2">‹</span><span className="font-semibold">받은 제안 3</span></div>
          <div className="px-4 py-4 flex flex-col gap-3">
            {[["수 아티스트", "레이어드 단발", "무료", "★4.9"], ["진 메이크업", "내추럴 펌", "3만원", "★4.8"], ["로즈 헤어", "매직 클리닉", "5만원", "★4.7"]].map(([n, s, p, r]) => (
              <div key={n} className="card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar name={n} size={38} />
                  <div className="flex-1"><div className="font-semibold text-[14px]">{n}</div><div className="text-[11px] text-ink-3">{r}</div></div>
                  <Badge tone="accent">{p}</Badge>
                </div>
                <p className="text-[13px] text-ink-2">추천 스타일: <b>{s}</b></p>
                <div className="flex gap-2 mt-3"><div className="btn-outline flex-1 py-2 text-[13px]">프로필</div><div className="btn-primary flex-1 py-2 text-[13px]">채팅하기</div></div>
              </div>
            ))}
          </div>
        </Phone>

        <Phone label="전문가 상세 · 포트폴리오" phase="2차">
          <div className="px-4 pt-5 flex items-center gap-3">
            <Avatar name="수" size={60} />
            <div className="flex-1"><div className="font-bold text-[17px]">수 아티스트</div><div className="text-[12px] text-ink-3">헤어 · 9년차 · 강남</div>
              <div className="text-[12px] text-accent-ink font-semibold mt-0.5">★ 4.9 · 리뷰 128</div></div>
          </div>
          <div className="flex gap-2 px-4 mt-3"><div className="btn-outline flex-1 py-2 text-[13px]">상담하기</div><div className="btn-primary flex-1 py-2 text-[13px]">예약하기</div></div>
          <div className="flex gap-4 px-4 mt-4 border-b border-border text-[13px]">
            {["포트폴리오", "리뷰", "공고", "상품"].map((t, i) => (
              <span key={t} className={i === 0 ? "pb-2 border-b-2 border-accent font-semibold" : "pb-2 text-ink-3"}>{t}</span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-0.5 mt-0.5">
            {["1522337660859-02fbefca4702", "1560066984-138dadb4c035", "1457972729786-0411a3b2b626", "1487412720507-e7ab37603c6f", "1560869713-7d0a29430803", "1519699047748-de8e457a634e"].map((id) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={id} src={`https://images.unsplash.com/photo-${id}?w=200`} alt="" className="aspect-square object-cover" />
            ))}
          </div>
        </Phone>

        <Phone label="예약 · 전자 동의" phase="2차">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2"><span className="text-ink-2">‹</span><span className="font-semibold">예약하기</span></div>
          <div className="px-4 py-4">
            <div className="card p-4 mb-4">
              {[["전문가", "수 아티스트"], ["시술", "레이어드 단발"], ["날짜", "3/8 (금) 오후 2:00"], ["소요", "약 90분"]].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-border last:border-0 text-[13px]"><span className="text-ink-3">{k}</span><span className="font-medium">{v}</span></div>
              ))}
              <div className="flex justify-between pt-2.5 mt-1"><span className="font-semibold">최종 결제</span><span className="font-bold text-accent-ink">무료</span></div>
            </div>
            <p className="font-bold text-[14px] mb-2">초상권 동의 (항목별)</p>
            <div className="card p-4 flex flex-col gap-3">
              {["얼굴 촬영", "시술 과정 촬영", "Before/After 사진", "SNS 게시", "광고 활용", "포트폴리오 활용"].map((t, i) => (
                <label key={t} className="flex items-center justify-between text-[13px]">
                  <span>{t}</span>
                  <span className={`w-10 h-6 rounded-full relative ${i < 4 ? "bg-accent" : "bg-border-2"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${i < 4 ? "right-0.5" : "left-0.5"}`} />
                  </span>
                </label>
              ))}
            </div>
            <div className="btn-primary w-full mt-4">동의하고 예약 요청</div>
          </div>
        </Phone>

        <Phone label="리뷰 작성" phase="2차">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2"><span className="text-ink-2">‹</span><span className="font-semibold">리뷰 작성</span></div>
          <div className="px-4 py-5 flex flex-col gap-5">
            <div className="text-center"><div className="text-[13px] text-ink-2 mb-2">시술은 만족스러우셨나요?</div>
              <div className="text-[34px] tracking-widest text-accent">★★★★★</div></div>
            <div><div className="label">시술명</div><div className="field text-ink-3">레이어드 단발 커트</div></div>
            <div><div className="label">리뷰</div><div className="field h-24 text-ink-3 text-[13px]">얼굴형에 딱 맞게 잘라주셔서 만족했어요! 친절하게 상담도 해주시고…</div></div>
            <div><div className="label">사진 첨부</div>
              <div className="flex gap-2"><div className="w-16 h-16 rounded-xl bg-surface-2 grid place-items-center text-ink-3 text-xl">＋</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200" alt="" className="w-16 h-16 rounded-xl object-cover" /></div></div>
            <div className="btn-primary w-full">리뷰 등록</div>
          </div>
        </Phone>

        <Phone label="Admin 대시보드" phase="1차">
          <div className="px-4 pt-5">
            <h2 className="font-display text-2xl mb-4">대시보드</h2>
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {[["전체 회원", "1,284"], ["전문가", "213"], ["승인 대기", "7"], ["오늘 가입", "42"]].map(([l, v], i) => (
                <div key={l} className="card p-3"><div className="text-[11px] text-ink-3">{l}</div>
                  <div className={`font-display text-2xl mt-1 ${i === 2 ? "text-warn" : ""}`}>{v}</div></div>
              ))}
            </div>
            <div className="card p-4">
              <div className="font-bold text-[14px] mb-3">핵심 Funnel</div>
              {[["방문", 100], ["가입", 62], ["지원", 38], ["채팅", 24], ["매칭", 15], ["예약", 11], ["시술완료", 8]].map(([l, w]) => (
                <div key={l as string} className="flex items-center gap-2 mb-2">
                  <span className="w-12 text-[11px] text-ink-2">{l}</span>
                  <div className="flex-1 h-5 bg-surface-2 rounded"><div className="h-full bg-accent rounded" style={{ width: `${w}%` }} /></div>
                  <span className="w-6 text-right text-[11px] font-semibold">{w}</span>
                </div>
              ))}
            </div>
          </div>
        </Phone>
      </div>

      <footer className="px-6 pb-12 text-center text-[12px] text-ink-3">
        Muse · 실제 컴포넌트 렌더링 · 좌우로 스크롤해 전체 화면을 확인하세요
      </footer>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{scrollbar-width:none}`}</style>
    </div>
  );
}
