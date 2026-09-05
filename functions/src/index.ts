/**
 * Muse · Cloud Functions
 * Only `registerUser` needs to be a callable: the client invokes it right
 * after account creation to set the `role` custom claim (admin-only) and
 * provision the user's Firestore documents. All other business logic runs
 * server-side in the Next.js app (src/lib/data.ts).
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";

initializeApp();
const db = getFirestore();
const nowIso = () => new Date().toISOString();

// One-time seed/admin helper (guarded by a token). Remove after use.
const SEED_TOKEN = "muse-seed-2026";
const CATEGORIES: { type: string; name: string }[] = [
  { type: "hair", name: "헤어" },
  { type: "makeup", name: "메이크업" },
  { type: "nail", name: "네일" },
  { type: "lash", name: "속눈썹" },
  { type: "skin", name: "피부/에스테틱" },
  { type: "semi_permanent", name: "반영구" },
  { type: "tattoo", name: "타투" },
];

export const seed = onRequest({ region: "us-central1" }, async (req, res) => {
  if (req.query.token !== SEED_TOKEN) { res.status(403).send("forbidden"); return; }

  // Seed categories (idempotent by slug == type).
  const results: string[] = [];
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    const existing = await db.collection("categories").where("slug", "==", c.type).limit(1).get();
    if (existing.empty) {
      await db.collection("categories").add({ type: c.type, name: c.name, slug: c.type, sort: i });
      results.push(`+${c.type}`);
    }
  }

  // Optionally promote a user to admin: ?admin=<email>
  const adminEmail = typeof req.query.admin === "string" ? req.query.admin : null;
  if (adminEmail) {
    try {
      const user = await getAuth().getUserByEmail(adminEmail);
      await getAuth().setCustomUserClaims(user.uid, { role: "admin" });
      await db.collection("users").doc(user.uid).set({ role: "admin", status: "active", updatedAt: nowIso() }, { merge: true });
      results.push(`admin:${adminEmail}`);
    } catch {
      results.push(`admin-not-found:${adminEmail}`);
    }
  }

  res.json({ ok: true, applied: results, categories: CATEGORIES.length });
});

export const registerUser = onCall({ region: "us-central1" }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "AUTH_REQUIRED");

  const rawRole = (req.data?.role as string) ?? "customer";
  const role = (["customer", "professional", "admin"].includes(rawRole) ? rawRole : "customer") as
    | "customer" | "professional" | "admin";
  const nickname = (req.data?.nickname as string) ?? "";
  const email = (req.auth?.token?.email as string) ?? null;
  const status = role === "professional" ? "pending" : "active";

  const userRef = db.collection("users").doc(uid);
  const existing = await userRef.get();
  if (existing.exists) {
    await getAuth().setCustomUserClaims(uid, { role });
    return { ok: true, role, alreadyProvisioned: true };
  }

  await getAuth().setCustomUserClaims(uid, { role });

  const batch = db.batch();
  batch.set(userRef, {
    email, role, status, noShowCount: 0, deletedAt: null,
    createdAt: nowIso(), updatedAt: nowIso(),
  });

  if (role === "customer") {
    batch.set(db.collection("customerProfiles").doc(uid), {
      nickname: nickname || (email ?? "user").split("@")[0],
      createdAt: nowIso(), updatedAt: nowIso(),
    });
  } else if (role === "professional") {
    batch.set(db.collection("professionalProfiles").doc(uid), {
      name: nickname || null, approved: false, ratingAvg: 0, reviewCount: 0,
      specialties: [], services: [], certificates: [],
      createdAt: nowIso(), updatedAt: nowIso(),
    });
    batch.set(db.collection("credits").doc(uid), { balance: 0, updatedAt: nowIso() });
  }
  await batch.commit();

  await db.collection("events").add({ userId: uid, name: "signup", props: { role }, createdAt: nowIso() });
  return { ok: true, role };
});
