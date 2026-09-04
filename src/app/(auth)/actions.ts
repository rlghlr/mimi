"use server";

import { createClient } from "@/lib/supabase/server";
import { homeFor } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/database.types";

export type AuthState = { error?: string };

export async function signInAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "이메일 또는 비밀번호가 올바르지 않아요." };

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", (await supabase.auth.getUser()).data.user!.id)
    .single();

  redirect(homeFor((data?.role as Role) ?? "customer"));
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const role = (String(formData.get("role") || "customer") as Role);
  const nickname = String(formData.get("nickname") || "").trim();

  if (password.length < 6) return { error: "비밀번호는 6자 이상이어야 해요." };

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, nickname } },
  });
  if (error) {
    if (error.message.includes("already")) return { error: "이미 가입된 이메일이에요." };
    return { error: "가입에 실패했어요. 잠시 후 다시 시도해 주세요." };
  }

  // Confirm-email off → session is active. Set nickname/name on the profile.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && nickname) {
    if (role === "professional") {
      await supabase.from("professional_profiles").update({ name: nickname }).eq("user_id", user.id);
    } else {
      await supabase.from("customer_profiles").update({ nickname }).eq("user_id", user.id);
    }
  }

  redirect(role === "professional" ? "/pro" : "/app");
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
