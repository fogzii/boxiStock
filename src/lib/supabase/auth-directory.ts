import "server-only";

import { createClient } from "./server";

export type AuthUserPublic = {
  name: string | null;
  email: string | null;
};

/**
 * Batch-resolve display name + email for auth user ids via a service-only
 * SECURITY DEFINER RPC. One PostgREST round-trip instead of N GoTrue admin
 * lookups. Missing ids are absent from the map.
 */
export async function getAuthUsersPublic(
  ids: string[],
): Promise<Map<string, AuthUserPublic>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_auth_users_public", {
    p_ids: unique,
  });
  if (error) throw new Error(error.message);

  const resolved = new Map<string, AuthUserPublic>();
  for (const row of data ?? []) {
    resolved.set(row.id, {
      name: row.full_name,
      email: row.email,
    });
  }
  return resolved;
}

export async function getAuthUserPublic(
  id: string,
): Promise<AuthUserPublic | null> {
  const users = await getAuthUsersPublic([id]);
  return users.get(id) ?? null;
}
