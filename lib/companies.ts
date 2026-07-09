import type { createClient as createBrowserClient } from "@/lib/supabase/client";

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;

export const DEFAULT_CHECKLIST = [
  { id: "overview", label: "Product overview & core user flow", done: false },
  { id: "onboarding", label: "Onboarding analysis", done: false },
  { id: "improvements", label: "3 PM improvements", done: false },
  { id: "business", label: "Business model", done: false },
  { id: "competitors", label: "Competitors", done: false },
  { id: "ai", label: "AI opportunities", done: false },
];

export function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Finds the company row for this name, creating one if needed (with default
 * checklist). Returns null if the `companies` table doesn't exist yet
 * (migration 002 not applied) — callers should treat that as "no linkage
 * available yet" rather than a hard failure, so the app keeps working on
 * the legacy free-text `company` field until the migration is run.
 */
export async function getOrCreateCompany(
  supabase: SupabaseBrowserClient,
  userId: string,
  name: string
): Promise<string | null> {
  const trimmed = name.trim();
  const slug = slugify(trimmed);
  if (!slug) return null;

  const { data: existing, error: selectErr } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", userId)
    .eq("slug", slug)
    .maybeSingle();
  if (selectErr) return null; // table missing pre-migration — fail soft
  if (existing) return existing.id;

  const { data: created, error: insertErr } = await supabase
    .from("companies")
    .insert({ user_id: userId, name: trimmed, slug, checklist: DEFAULT_CHECKLIST })
    .select("id")
    .single();
  if (!insertErr) return created?.id ?? null;

  // Race with another insert of the same slug — read back what won.
  const { data: retry } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", userId)
    .eq("slug", slug)
    .maybeSingle();
  return retry?.id ?? null;
}
