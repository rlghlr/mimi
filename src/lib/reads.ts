import "server-only";

import { db, getDoc, getMany, queryDocs } from "@/lib/firebase/db";

/**
 * Server-side read layer (Firestore admin). Returns snake_case-shaped objects
 * so existing pages keep their field access. Relations are hydrated with a
 * second fetch + JS merge; filters/sorts run in JS over small result sets to
 * avoid composite-index requirements.
 */

function toSnake(s: string): string {
  return s.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
}
export function snakeKeys<T = any>(v: any): T {
  if (Array.isArray(v)) return v.map((x) => snakeKeys(x)) as unknown as T;
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(v)) o[toSnake(k)] = snakeKeys((v as Record<string, unknown>)[k]);
    return o as T;
  }
  return v as T;
}

const byCreatedDesc = (a: any, b: any) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));

/** where(field in values), chunked to Firestore's 30-value limit. */
async function queryIn<T = any>(coll: string, field: string, values: string[]): Promise<(T & { id: string })[]> {
  const unique = [...new Set(values)].filter(Boolean);
  const out: (T & { id: string })[] = [];
  for (let i = 0; i < unique.length; i += 30) {
    const chunk = unique.slice(i, i + 30);
    if (chunk.length) out.push(...(await queryDocs<T>(coll, [[field, "in", chunk]])));
  }
  return out;
}

// ---- profile / category maps -----------------------------------------
type ProLite = { name: string | null; avatar_url: string | null; career: string | null; region: string | null };
async function proProfileMap(uids: string[]): Promise<Map<string, ProLite>> {
  const docs = await getMany<any>("professionalProfiles", uids);
  const map = new Map<string, ProLite>();
  for (const p of docs) map.set(p.id, { name: p.name ?? null, avatar_url: p.avatarUrl ?? null, career: p.career ?? null, region: p.region ?? null });
  return map;
}

type ProRich = ProLite & { rating_avg: number; review_count: number };
async function proProfileMapRich(uids: string[]): Promise<Map<string, ProRich>> {
  const docs = await getMany<any>("professionalProfiles", uids);
  const map = new Map<string, ProRich>();
  for (const p of docs) map.set(p.id, {
    name: p.name ?? null, avatar_url: p.avatarUrl ?? null, career: p.career ?? null, region: p.region ?? null,
    rating_avg: p.ratingAvg ?? 0, review_count: p.reviewCount ?? 0,
  });
  return map;
}

async function customerProfileMap(uids: string[]): Promise<Map<string, { nickname: string | null; avatar_url: string | null; region: string | null }>> {
  const docs = await getMany<any>("customerProfiles", uids);
  const map = new Map<string, { nickname: string | null; avatar_url: string | null; region: string | null }>();
  for (const c of docs) map.set(c.id, { nickname: c.nickname ?? null, avatar_url: c.avatarUrl ?? null, region: c.region ?? null });
  return map;
}

async function customerProfileDetailMap(uids: string[]): Promise<Map<string, any>> {
  const docs = await getMany<any>("customerProfiles", uids);
  const map = new Map<string, any>();
  for (const c of docs) map.set(c.id, {
    nickname: c.nickname ?? null, avatar_url: c.avatarUrl ?? null, gender: c.gender ?? null,
    birth_era: c.birthEra ?? null, region: c.region ?? null, hair_length: c.hairLength ?? null, hair_state: c.hairState ?? null,
  });
  return map;
}

async function categoryMap(ids: string[]): Promise<Map<string, { name: string | null; type: string | null }>> {
  const docs = await getMany<any>("categories", ids);
  const map = new Map<string, { name: string | null; type: string | null }>();
  for (const c of docs) map.set(c.id, { name: c.name ?? null, type: c.type ?? null });
  return map;
}

// ---- posts -----------------------------------------------------------
async function hydratePosts(rawPosts: any[]): Promise<any[]> {
  const proMap = await proProfileMap(rawPosts.map((p) => p.proId));
  const catMap = await categoryMap(rawPosts.map((p) => p.categoryId).filter(Boolean));
  return rawPosts.map((p) => ({
    ...snakeKeys(p),
    pro: proMap.get(p.proId) ?? null,
    category: p.categoryId ? catMap.get(p.categoryId) ?? null : null,
  }));
}

export async function listRecruitPosts(opts: {
  urgentOnly?: boolean; q?: string; categoryType?: string; limit?: number;
} = {}): Promise<any[]> {
  let list = await queryDocs<any>("recruitPosts", [["status", "==", "recruiting"]]);
  list = list.filter((p) => !p.deletedAt);
  if (opts.urgentOnly) list = list.filter((p) => p.isUrgent);
  if (opts.q) {
    const q = opts.q.toLowerCase();
    list = list.filter((p) => (p.title ?? "").toLowerCase().includes(q) || (p.region ?? "").toLowerCase().includes(q));
  }
  list.sort((a, b) => (Number(!!b.isUrgent) - Number(!!a.isUrgent)) || byCreatedDesc(a, b));
  const hydrated = await hydratePosts(list);
  const filtered = opts.categoryType ? hydrated.filter((p) => p.category?.type === opts.categoryType) : hydrated;
  return opts.limit ? filtered.slice(0, opts.limit) : filtered;
}

export async function getRecruitPost(id: string): Promise<any | null> {
  const post = await getDoc<any>("recruitPosts", id);
  if (!post || post.deletedAt) return null;
  const [shaped] = await hydratePosts([post]);
  return shaped;
}

export async function listProRecruitingPosts(proId: string): Promise<any[]> {
  let list = await queryDocs<any>("recruitPosts", [["proId", "==", proId], ["status", "==", "recruiting"]]);
  list = list.filter((p) => !p.deletedAt).sort(byCreatedDesc);
  return list.map((p) => snakeKeys(p));
}

export async function countApplicants(postId: string): Promise<number> {
  const apps = await queryDocs("recruitApplications", [["postId", "==", postId]]);
  return apps.length;
}

export async function getMyApplication(postId: string, uid: string): Promise<{ id: string; status: string } | null> {
  const apps = await queryDocs<any>("recruitApplications", [["postId", "==", postId], ["applicantId", "==", uid]]);
  return apps[0] ? { id: apps[0].id, status: apps[0].status } : null;
}

// ---- professionals ---------------------------------------------------
export async function listProfessionals(opts: { q?: string; cat?: string; sort?: string; limit?: number } = {}): Promise<any[]> {
  const docs = await queryDocs<any>("professionalProfiles", [["approved", "==", true]]);
  let list = docs.map((p) => ({
    user_id: p.id, name: p.name ?? null, avatar_url: p.avatarUrl ?? null, region: p.region ?? null,
    career: p.career ?? null, specialties: p.specialties ?? [], services: p.services ?? [],
    rating_avg: p.ratingAvg ?? 0, review_count: p.reviewCount ?? 0, created_at: p.createdAt,
  }));
  if (opts.q) { const q = opts.q.toLowerCase(); list = list.filter((p) => (p.name ?? "").toLowerCase().includes(q)); }
  if (opts.cat) list = list.filter((p) => (p.specialties as string[]).includes(opts.cat!));
  const sort = opts.sort ?? "rating";
  list.sort((a, b) =>
    sort === "reviews" ? b.review_count - a.review_count
    : sort === "recent" ? String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
    : b.rating_avg - a.rating_avg
  );
  return opts.limit ? list.slice(0, opts.limit) : list;
}

export async function getProfessional(userId: string): Promise<any | null> {
  const p = await getDoc<any>("professionalProfiles", userId);
  if (!p || !p.approved) return null;
  return {
    user_id: userId, name: p.name ?? null, avatar_url: p.avatarUrl ?? null, region: p.region ?? null,
    career: p.career ?? null, bio: p.bio ?? null, specialties: p.specialties ?? [], services: p.services ?? [],
    certificates: p.certificates ?? [], sns_url: p.snsUrl ?? null, rating_avg: p.ratingAvg ?? 0, review_count: p.reviewCount ?? 0,
  };
}

export async function listPortfolio(proId: string): Promise<any[]> {
  const docs = await queryDocs<any>("portfolio", [["proId", "==", proId]]);
  docs.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  return docs.map((x) => ({ id: x.id, image_url: x.imageUrl, caption: x.caption ?? null }));
}

export async function listProReviews(proId: string): Promise<any[]> {
  const docs = await queryDocs<any>("reviews", [["proId", "==", proId]]);
  docs.sort(byCreatedDesc);
  return docs.map((r) => ({
    id: r.id, rating: r.rating, text: r.text ?? null, photos: r.photos ?? [],
    service_name: r.serviceName ?? null, author_id: r.authorId ?? null, created_at: r.createdAt,
  }));
}

export async function getFavorite(uid: string, targetType: string, targetId: string): Promise<boolean> {
  const f = await queryDocs("favorites", [["userId", "==", uid], ["targetType", "==", targetType], ["targetId", "==", targetId]]);
  return f.length > 0;
}

// ---- categories / profiles -------------------------------------------
export async function listCategories(): Promise<any[]> {
  const docs = await queryDocs<any>("categories", []);
  docs.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  return docs.map((c) => ({ id: c.id, name: c.name, type: c.type }));
}

export async function getCustomerProfile(uid: string): Promise<any | null> {
  const c = await getDoc<any>("customerProfiles", uid);
  if (!c) return null;
  return { nickname: c.nickname ?? null, avatar_url: c.avatarUrl ?? null, region: c.region ?? null, bio: c.bio ?? null };
}

// ---- consultations & offers ------------------------------------------
export async function listMyConsultations(uid: string): Promise<any[]> {
  let items = await queryDocs<any>("consultations", [["customerId", "==", uid]]);
  items = items.filter((c) => !c.deletedAt).sort(byCreatedDesc);
  const offers = await queryIn<any>("consultationOffers", "consultationId", items.map((c) => c.id));
  const counts = new Map<string, number>();
  for (const o of offers) counts.set(o.consultationId, (counts.get(o.consultationId) ?? 0) + 1);
  const catMap = await categoryMap(items.map((c) => c.categoryId).filter(Boolean));
  return items.map((c) => ({
    ...snakeKeys({ id: c.id, content: c.content, region: c.region, budget: c.budget, status: c.status, createdAt: c.createdAt }),
    category: c.categoryId ? catMap.get(c.categoryId) ?? null : null,
    offer_count: counts.get(c.id) ?? 0,
  }));
}

export async function getConsultation(id: string): Promise<any | null> {
  const c = await getDoc<any>("consultations", id);
  if (!c) return null;
  const catMap = c.categoryId ? await categoryMap([c.categoryId]) : null;
  const { categoryId, ...rest } = c;
  return { ...snakeKeys(rest), category: catMap?.get(categoryId) ?? null };
}

export async function listConsultationOffers(consultationId: string): Promise<any[]> {
  const offers = await queryDocs<any>("consultationOffers", [["consultationId", "==", consultationId]]);
  offers.sort(byCreatedDesc);
  const map = await proProfileMapRich(offers.map((o) => o.proId));
  return offers.map((o) => ({ ...snakeKeys(o), pro: map.get(o.proId) ?? null }));
}

// ---- applications (customer) -----------------------------------------
export async function listMyApplications(uid: string): Promise<any[]> {
  const apps = await queryDocs<any>("recruitApplications", [["applicantId", "==", uid]]);
  apps.sort(byCreatedDesc);
  const posts = await getMany<any>("recruitPosts", apps.map((a) => a.postId));
  const pmap = new Map(posts.map((p) => [p.id, p]));
  return apps.map((a) => {
    const post = pmap.get(a.postId);
    return {
      ...snakeKeys({ id: a.id, status: a.status, message: a.message, createdAt: a.createdAt }),
      post: post ? { id: post.id, title: post.title, status: post.status, reference_images: post.referenceImages ?? [] } : null,
    };
  });
}

// ---- favorites (detailed) --------------------------------------------
export async function listFavoritesDetailed(uid: string): Promise<{ pros: any[]; posts: any[]; empty: boolean }> {
  const favs = await queryDocs<any>("favorites", [["userId", "==", uid]]);
  favs.sort(byCreatedDesc);
  const proIds = favs.filter((f) => f.targetType === "professional").map((f) => f.targetId);
  const postIds = favs.filter((f) => f.targetType === "post").map((f) => f.targetId);

  const proDocs = await getMany<any>("professionalProfiles", proIds);
  const pros = proDocs.map((p) => ({ user_id: p.id, name: p.name ?? null, avatar_url: p.avatarUrl ?? null, region: p.region ?? null, rating_avg: p.ratingAvg ?? 0 }));
  const postDocs = await getMany<any>("recruitPosts", postIds);
  const posts = postDocs.map((p) => ({ id: p.id, title: p.title, reference_images: p.referenceImages ?? [], region: p.region ?? null }));
  return { pros, posts, empty: favs.length === 0 };
}

// ---- reservations ----------------------------------------------------
async function reservationRows(field: "customerId" | "proId", uid: string, peer: "pro" | "customer"): Promise<any[]> {
  const rows = await queryDocs<any>("reservations", [[field, "==", uid]]);
  rows.sort(byCreatedDesc);
  const proMap = peer === "pro" ? await proProfileMap(rows.map((r) => r.proId)) : null;
  const custMap = peer === "customer" ? await customerProfileMap(rows.map((r) => r.customerId)) : null;
  const shops = await getMany<any>("shops", rows.map((r) => r.shopId).filter(Boolean));
  const shopMap = new Map(shops.map((s) => [s.id, { name: s.name ?? null, address: s.address ?? null }]));
  return rows.map((r) => ({
    ...snakeKeys(r),
    shop: r.shopId ? shopMap.get(r.shopId) ?? null : null,
    ...(peer === "pro" ? { pro: proMap!.get(r.proId) ?? null } : { customer: custMap!.get(r.customerId) ?? null }),
  }));
}
export const listCustomerReservations = (uid: string) => reservationRows("customerId", uid, "pro");
export const listProReservations = (uid: string) => reservationRows("proId", uid, "customer");

export async function reviewedReservationIds(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const reviews = await queryIn<any>("reviews", "reservationId", ids);
  return new Set(reviews.map((r) => r.reservationId).filter(Boolean));
}

// ---- reserve / review form data --------------------------------------
export async function getProReserveInfo(proId: string): Promise<{ proId: string; name: string; shopName: string | null; services: string[] } | null> {
  const p = await getDoc<any>("professionalProfiles", proId);
  if (!p) return null;
  let shopName: string | null = null;
  if (p.shopId) shopName = (await getDoc<any>("shops", p.shopId))?.name ?? null;
  return { proId, name: p.name ?? "전문가", shopName, services: p.services ?? [] };
}

export async function getReviewFormData(id: string, uid: string): Promise<{ id: string; service: string; proName: string } | null> {
  const r = await getDoc<any>("reservations", id);
  if (!r || r.customerId !== uid || r.status !== "completed") return null;
  const map = await proProfileMap([r.proId]);
  return { id: r.id, service: r.service ?? "", proName: map.get(r.proId)?.name ?? "전문가" };
}

// ---- notifications ---------------------------------------------------
export async function listNotifications(uid: string, limit = 50): Promise<any[]> {
  const rows = await queryDocs<any>("notifications", [["userId", "==", uid]]);
  rows.sort(byCreatedDesc);
  return rows.slice(0, limit).map((n) => snakeKeys(n));
}

// ---- pro dashboard / posts / models / applicants ---------------------
export async function getProProfileCard(uid: string): Promise<any | null> {
  const p = await getDoc<any>("professionalProfiles", uid);
  if (!p) return null;
  return { name: p.name ?? null, avatar_url: p.avatarUrl ?? null, region: p.region ?? null, approved: !!p.approved, rating_avg: p.ratingAvg ?? 0, review_count: p.reviewCount ?? 0 };
}

export async function getCreditBalance(uid: string): Promise<number> {
  const c = await getDoc<any>("credits", uid);
  return c?.balance ?? 0;
}

export async function listProOwnPosts(uid: string): Promise<any[]> {
  let posts = await queryDocs<any>("recruitPosts", [["proId", "==", uid]]);
  posts = posts.filter((p) => !p.deletedAt).sort(byCreatedDesc);
  const apps = await queryIn<any>("recruitApplications", "postId", posts.map((p) => p.id));
  const counts = new Map<string, number>();
  for (const a of apps) counts.set(a.postId, (counts.get(a.postId) ?? 0) + 1);
  return posts.map((p) => ({ ...snakeKeys(p), applicant_count: counts.get(p.id) ?? 0 }));
}

export async function countNewApplicants(uid: string): Promise<number> {
  const posts = await queryDocs<any>("recruitPosts", [["proId", "==", uid]]);
  const ids = posts.filter((p) => !p.deletedAt).map((p) => p.id);
  if (!ids.length) return 0;
  const apps = await queryIn<any>("recruitApplications", "postId", ids);
  return apps.filter((a) => a.status === "applied").length;
}

export async function listOpenConsultations(proUid: string): Promise<any[]> {
  let items = await queryDocs<any>("consultations", [["status", "in", ["open", "offered"]]]);
  items = items.filter((c) => !c.deletedAt).sort(byCreatedDesc).slice(0, 40);
  const custMap = await customerProfileMap(items.map((c) => c.customerId));
  const catMap = await categoryMap(items.map((c) => c.categoryId).filter(Boolean));
  const myOffers = await queryIn<any>("consultationOffers", "consultationId", items.map((c) => c.id));
  const offered = new Set(myOffers.filter((o) => o.proId === proUid).map((o) => o.consultationId));
  return items.map((c) => ({
    ...snakeKeys({ id: c.id, content: c.content, region: c.region, budget: c.budget, status: c.status, createdAt: c.createdAt }),
    customer: custMap.get(c.customerId) ?? null,
    category: c.categoryId ? catMap.get(c.categoryId) ?? null : null,
    _offered: offered.has(c.id),
  }));
}

export async function getPostForApplicants(id: string, uid: string): Promise<any | null> {
  const p = await getDoc<any>("recruitPosts", id);
  if (!p || p.proId !== uid) return null;
  return { id: p.id, pro_id: p.proId, title: p.title, status: p.status, headcount: p.headcount, matched_count: p.matchedCount ?? 0 };
}

export async function listPostApplicants(postId: string): Promise<any[]> {
  const apps = await queryDocs<any>("recruitApplications", [["postId", "==", postId]]);
  apps.sort(byCreatedDesc);
  const map = await customerProfileDetailMap(apps.map((a) => a.applicantId));
  return apps.map((a) => ({ ...snakeKeys(a), applicant: map.get(a.applicantId) ?? null }));
}

// ---- admin -----------------------------------------------------------
export async function adminDashboard(): Promise<{ stats: Record<string, number>; funnel: Record<string, number> }> {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const iso = today.toISOString();

  const [users, posts, applications, matchesAll, reservations, events] = await Promise.all([
    queryDocs<any>("users", []),
    queryDocs<any>("recruitPosts", []),
    queryDocs<any>("recruitApplications", []),
    queryDocs<any>("matches", [["status", "==", "confirmed"]]),
    queryDocs<any>("reservations", []),
    queryDocs<any>("events", []),
  ]);
  const ev = (name: string) => events.filter((e) => e.name === name).length;

  return {
    stats: {
      users: users.length,
      pros: users.filter((u) => u.role === "professional").length,
      pendingPros: users.filter((u) => u.role === "professional" && u.status === "pending").length,
      newToday: users.filter((u) => String(u.createdAt ?? "") >= iso).length,
      posts: posts.length,
      applications: applications.length,
      matches: matchesAll.length,
      reservations: reservations.length,
    },
    funnel: {
      visit: ev("visit"), signup: ev("signup"), apply: ev("apply"), chat: ev("chat_open"),
      match: ev("match_confirm"), reserve: ev("reservation_create"), complete: ev("reservation_complete"),
    },
  };
}

export async function adminListUsers(role?: string): Promise<any[]> {
  const users = await queryDocs<any>("users", role ? [["role", "==", role]] : []);
  users.sort(byCreatedDesc);
  return users.slice(0, 100).map((u) => snakeKeys(u));
}

export async function adminListPendingPros(): Promise<any[]> {
  const docs = await queryDocs<any>("professionalProfiles", [["approved", "==", false]]);
  docs.sort((a, b) => String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")));
  return docs.map((p) => ({
    user_id: p.id, name: p.name ?? null, avatar_url: p.avatarUrl ?? null, region: p.region ?? null,
    career: p.career ?? null, specialties: p.specialties ?? [], services: p.services ?? [],
    certificates: p.certificates ?? [], sns_url: p.snsUrl ?? null, bio: p.bio ?? null, approved: p.approved,
  }));
}
