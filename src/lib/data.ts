import "server-only";

import { db, getDoc, queryDocs, nowIso, FieldValue } from "@/lib/firebase/db";

/**
 * Server-side write layer (Firestore admin). Runs privileged, so callers pass
 * the acting user's id explicitly and every owner field is set from that id.
 * Guard-heavy operations throw Error with a code string that `messageForError`
 * maps to a Korean message.
 */

export async function notify(
  userId: string, type: string, title: string, body: string,
  refType: string | null = null, refId: string | null = null
): Promise<void> {
  await db.collection("notifications").add({
    userId, type, title, body, refType, refId, readAt: null, createdAt: nowIso(),
  });
}

export async function logEvent(userId: string | null, name: string, props: unknown): Promise<void> {
  await db.collection("events").add({ userId, name, props: props ?? {}, createdAt: nowIso() });
}

// ---------------------------------------------------------------------
// recruit posts
// ---------------------------------------------------------------------
export async function applyToPost(uid: string, input: {
  postId: string; photos: unknown; currentState?: string | null;
  recentHistory?: string | null; availableDates: string[]; message?: string | null;
}): Promise<string> {
  const post = await getDoc<any>("recruitPosts", input.postId);
  if (!post || post.deletedAt) throw new Error("POST_NOT_FOUND");
  if (["completed", "ended", "cancelled"].includes(post.status)) throw new Error("POST_CLOSED");
  if ((post.matchedCount ?? 0) >= post.headcount) throw new Error("POST_FULL");

  const dupes = await queryDocs("recruitApplications", [["postId", "==", input.postId], ["applicantId", "==", uid]]);
  if (dupes.length > 0) throw new Error("ALREADY_APPLIED");

  const ref = await db.collection("recruitApplications").add({
    postId: input.postId, applicantId: uid, photos: input.photos ?? {},
    currentState: input.currentState ?? null, recentHistory: input.recentHistory ?? null,
    availableDates: input.availableDates ?? [], message: input.message ?? null,
    status: "applied", createdAt: nowIso(), updatedAt: nowIso(),
  });
  await notify(post.proId, "new_applicant", "새 지원자가 있어요",
    `${post.title} 공고에 새 지원자가 도착했어요.`, "post", input.postId);
  await logEvent(uid, "apply", { post_id: input.postId });
  return ref.id;
}

export async function createRecruitPost(uid: string, data: Record<string, unknown>): Promise<string> {
  const ref = await db.collection("recruitPosts").add({
    proId: uid, matchedCount: 0, viewCount: 0, deletedAt: null,
    createdAt: nowIso(), updatedAt: nowIso(), ...data,
  });
  return ref.id;
}

export async function updatePostStatus(postId: string, status: string): Promise<void> {
  await db.collection("recruitPosts").doc(postId).update({ status, updatedAt: nowIso() });
}

export async function getProApproved(uid: string): Promise<boolean> {
  const p = await getDoc<{ approved: boolean }>("professionalProfiles", uid);
  return Boolean(p?.approved);
}

// ---------------------------------------------------------------------
// chats (kept for when chat ships; blockChat used by reports)
// ---------------------------------------------------------------------
export async function blockChat(chatId: string, byUid: string): Promise<void> {
  await db.collection("chats").doc(chatId).set({ blockedBy: byUid, updatedAt: nowIso() }, { merge: true });
}

// ---------------------------------------------------------------------
// applications (pro side)
// ---------------------------------------------------------------------
export async function setApplicationStatus(applicationId: string, status: string): Promise<void> {
  await db.collection("recruitApplications").doc(applicationId).update({ status, updatedAt: nowIso() });
}

export async function confirmMatch(proUid: string, sourceId: string, customerId: string, type = "recruit"): Promise<string> {
  if (type === "recruit") {
    const post = await getDoc<any>("recruitPosts", sourceId);
    if (!post) throw new Error("POST_NOT_FOUND");
    if (post.proId !== proUid) throw new Error("FORBIDDEN");
    if ((post.matchedCount ?? 0) >= post.headcount) throw new Error("POST_FULL");
    const nextCount = (post.matchedCount ?? 0) + 1;
    const update: Record<string, unknown> = { matchedCount: nextCount, updatedAt: nowIso() };
    if (nextCount >= post.headcount) update.status = "completed";
    await db.collection("recruitPosts").doc(sourceId).update(update);

    const apps = await queryDocs("recruitApplications", [["postId", "==", sourceId], ["applicantId", "==", customerId]]);
    for (const a of apps) await db.collection("recruitApplications").doc(a.id).update({ status: "matched", updatedAt: nowIso() });
  }

  const ref = await db.collection("matches").add({
    type, sourceId, customerId, proId: proUid, status: "confirmed",
    confirmedAt: nowIso(), createdAt: nowIso(), updatedAt: nowIso(),
  });
  await notify(customerId, "matched", "매칭이 확정됐어요",
    "전문가와 매칭이 확정됐어요. 예약을 진행해 주세요.", "match", ref.id);
  await logEvent(proUid, "match_confirm", { type, source_id: sourceId });
  return ref.id;
}

// ---------------------------------------------------------------------
// consultations & offers
// ---------------------------------------------------------------------
export async function createConsultation(uid: string, data: Record<string, unknown>): Promise<string> {
  const ref = await db.collection("consultations").add({
    customerId: uid, deletedAt: null, createdAt: nowIso(), updatedAt: nowIso(), ...data,
  });
  return ref.id;
}

export async function getConsultationOwner(id: string): Promise<{ customerId: string; status: string } | null> {
  const c = await getDoc<any>("consultations", id);
  if (!c) return null;
  return { customerId: c.customerId, status: c.status };
}

export async function createOffer(uid: string, consultationId: string, data: Record<string, unknown>): Promise<void> {
  const dupes = await queryDocs("consultationOffers", [["consultationId", "==", consultationId], ["proId", "==", uid]]);
  if (dupes.length > 0) throw new Error("duplicate");
  await db.collection("consultationOffers").add({
    consultationId, proId: uid, status: "sent", createdAt: nowIso(), updatedAt: nowIso(), ...data,
  });
}

export async function markConsultationOffered(consultationId: string): Promise<void> {
  const ref = db.collection("consultations").doc(consultationId);
  const snap = await ref.get();
  if (snap.exists && snap.data()?.status === "open") await ref.update({ status: "offered", updatedAt: nowIso() });
}

// ---------------------------------------------------------------------
// reservations & reviews
// ---------------------------------------------------------------------
export async function getProShopId(proId: string): Promise<string | null> {
  const p = await getDoc<{ shopId?: string | null }>("professionalProfiles", proId);
  return p?.shopId ?? null;
}

export async function createReservation(uid: string, data: Record<string, unknown>): Promise<string> {
  const ref = await db.collection("reservations").add({
    customerId: uid, createdAt: nowIso(), updatedAt: nowIso(), ...data,
  });
  return ref.id;
}

export async function createConsent(uid: string, data: Record<string, unknown>): Promise<void> {
  await db.collection("consents").add({ userId: uid, signedAt: nowIso(), ...data });
}

export async function getReservationParties(id: string): Promise<{ customerId: string; proId: string } | null> {
  const r = await getDoc<any>("reservations", id);
  if (!r) return null;
  return { customerId: r.customerId, proId: r.proId };
}

export async function setReservationStatus(id: string, status: string): Promise<void> {
  await db.collection("reservations").doc(id).update({ status, updatedAt: nowIso() });
}

export async function incrementNoShow(userId: string): Promise<void> {
  await db.collection("users").doc(userId).update({ noShowCount: FieldValue.increment(1), updatedAt: nowIso() });
}

export async function getReviewableReservation(id: string): Promise<{ customerId: string; proId: string; status: string; service: string | null } | null> {
  const r = await getDoc<any>("reservations", id);
  if (!r) return null;
  return { customerId: r.customerId, proId: r.proId, status: r.status, service: r.service ?? null };
}

export async function submitReview(uid: string, input: {
  reservationId: string; proId: string; rating: number; text?: string | null;
  photos: string[]; serviceName?: string | null;
}): Promise<void> {
  const hasPhoto = input.photos.length > 0;
  await db.collection("reviews").add({
    reservationId: input.reservationId, authorId: uid, proId: input.proId, rating: input.rating,
    text: input.text ?? null, photos: input.photos, serviceName: input.serviceName ?? null,
    hasPhoto, proReply: null, createdAt: nowIso(), updatedAt: nowIso(),
  });
  const reviews = await queryDocs<{ rating: number }>("reviews", [["proId", "==", input.proId]]);
  const count = reviews.length;
  const avg = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  await db.collection("professionalProfiles").doc(input.proId).set(
    { ratingAvg: avg, reviewCount: count, updatedAt: nowIso() }, { merge: true }
  );
}

// ---------------------------------------------------------------------
// reports & favorites
// ---------------------------------------------------------------------
export async function createReport(uid: string, data: Record<string, unknown>): Promise<void> {
  await db.collection("reports").add({
    reporterId: uid, status: "received", createdAt: nowIso(), updatedAt: nowIso(), ...data,
  });
}

export async function toggleFavorite(uid: string, targetType: string, targetId: string): Promise<boolean> {
  const existing = await queryDocs("favorites", [
    ["userId", "==", uid], ["targetType", "==", targetType], ["targetId", "==", targetId],
  ]);
  if (existing.length > 0) {
    await db.collection("favorites").doc(existing[0].id).delete();
    return false;
  }
  await db.collection("favorites").add({ userId: uid, targetType, targetId, createdAt: nowIso() });
  return true;
}

// ---------------------------------------------------------------------
// notifications
// ---------------------------------------------------------------------
export async function markAllNotificationsRead(uid: string): Promise<void> {
  const unread = await queryDocs("notifications", [["userId", "==", uid], ["readAt", "==", null]]);
  const batch = db.batch();
  for (const n of unread) batch.update(db.collection("notifications").doc(n.id), { readAt: nowIso() });
  if (unread.length) await batch.commit();
}

// ---------------------------------------------------------------------
// admin
// ---------------------------------------------------------------------
export async function adminApprovePro(userId: string): Promise<void> {
  await db.collection("professionalProfiles").doc(userId).set(
    { approved: true, approvedAt: nowIso(), updatedAt: nowIso() }, { merge: true }
  );
  await db.collection("users").doc(userId).update({ status: "active", updatedAt: nowIso() });
}

export async function adminSetUserStatus(userId: string, status: string): Promise<void> {
  await db.collection("users").doc(userId).update({ status, updatedAt: nowIso() });
}
