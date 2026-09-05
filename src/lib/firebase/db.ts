import "server-only";

import { getFirestore, FieldPath, FieldValue, type Firestore, type Query } from "firebase-admin/firestore";
import { adminApp } from "./admin";

export const db: Firestore = getFirestore(adminApp);
try {
  db.settings({ ignoreUndefinedProperties: true });
} catch {
  // settings() throws if the client is already in use — safe to ignore.
}
export { FieldPath, FieldValue };

/** ISO timestamp — stored as a string so pages read `created_at` directly. */
export const nowIso = () => new Date().toISOString();

type WhereTuple = [string, FirebaseFirestore.WhereFilterOp, unknown];

/** Fetch a single document by id, returning its data with `id`, or null. */
export async function getDoc<T = any>(coll: string, id: string): Promise<(T & { id: string }) | null> {
  const snap = await db.collection(coll).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as T) };
}

/** Fetch many documents by id (order not guaranteed); missing ids are skipped. */
export async function getMany<T = any>(coll: string, ids: string[]): Promise<(T & { id: string })[]> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (!unique.length) return [];
  const refs = unique.map((id) => db.collection(coll).doc(id));
  const snaps = await db.getAll(...refs);
  return snaps.filter((s) => s.exists).map((s) => ({ id: s.id, ...(s.data() as T) }));
}

/** Run a filtered/ordered query and return documents with `id`. */
export async function queryDocs<T = any>(
  coll: string,
  where: WhereTuple[] = [],
  opts: { orderBy?: [string, ("asc" | "desc")?]; limit?: number } = {}
): Promise<(T & { id: string })[]> {
  let q: Query = db.collection(coll);
  for (const [f, op, v] of where) q = q.where(f, op, v);
  if (opts.orderBy) q = q.orderBy(opts.orderBy[0], opts.orderBy[1] ?? "asc");
  if (opts.limit) q = q.limit(opts.limit);
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}

/** where(documentId in ids) — chunked to Firestore's 30-value limit. */
export async function queryByIds<T = any>(coll: string, ids: string[]): Promise<(T & { id: string })[]> {
  return getMany<T>(coll, ids);
}
