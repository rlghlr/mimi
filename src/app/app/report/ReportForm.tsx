"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitReportAction, type ReportState } from "./actions";
import { REPORT_REASON_LABELS } from "@/lib/constants";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "접수 중…" : "신고 접수"}
    </button>
  );
}

export function ReportForm({
  targetType, targetId, chatId, back,
}: {
  targetType: string; targetId: string; chatId?: string; back: string;
}) {
  const [state, action] = useFormState<ReportState, FormData>(submitReportAction, {});

  return (
    <form action={action} className="px-5 py-4 flex flex-col gap-4">
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      {chatId && <input type="hidden" name="chat_id" value={chatId} />}
      <input type="hidden" name="back" value={back} />

      <div>
        <label className="label" htmlFor="reason">신고 사유</label>
        <select id="reason" name="reason" className="field" defaultValue="fake_post">
          {Object.entries(REPORT_REASON_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="detail">상세 내용</label>
        <textarea id="detail" name="detail" rows={4} className="field" placeholder="구체적인 상황을 알려주세요." />
      </div>

      {chatId && (
        <label className="flex items-center gap-2.5 text-[14px] card p-3.5">
          <input type="checkbox" name="block" className="w-4 h-4 accent-accent" />
          이 상대를 차단하고 대화를 중단할게요
        </label>
      )}

      <p className="text-[12px] text-ink-3">
        신고가 누적되면 운영자가 회원을 제한할 수 있어요. 허위 신고는 제재 대상이 될 수 있어요.
      </p>

      {state.error && <p className="text-crit text-[13px]" role="alert">{state.error}</p>}
      <Submit />
    </form>
  );
}
