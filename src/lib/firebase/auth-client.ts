"use client";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { clientAuth, firebaseApp } from "./client";

export type Role = "customer" | "professional" | "admin";

const functions = getFunctions(firebaseApp, "us-central1");

async function postSession(idToken: string): Promise<void> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("SESSION_FAILED");
}

/** Sign in with email/password and establish the server session. Returns the role. */
export async function signIn(email: string, password: string): Promise<Role> {
  const cred = await signInWithEmailAndPassword(clientAuth, email, password);
  const result = await cred.user.getIdTokenResult();
  await postSession(result.token);
  return (result.claims.role as Role) ?? "customer";
}

/** Create an account, provision the DB rows + role claim, and start the session. */
export async function signUp(
  email: string,
  password: string,
  role: Role,
  nickname: string
): Promise<Role> {
  const cred = await createUserWithEmailAndPassword(clientAuth, email, password);
  const register = httpsCallable(functions, "registerUser");
  await register({ role, nickname });
  // Refresh the token so the new `role` custom claim is included.
  const idToken = await cred.user.getIdToken(true);
  await postSession(idToken);
  return role;
}

/** Clear both the server session and client auth state. */
export async function signOutClient(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
  await fbSignOut(clientAuth);
}
