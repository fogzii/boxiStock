-- Batch lookup of display name + email for sharing UIs. Replaces N
-- auth.admin.getUserById calls. Returns only the columns the app shows.
-- EXECUTE is service_role only: the Next.js secret client calls this after
-- the caller is already authenticated in a server action.

CREATE OR REPLACE FUNCTION public.get_auth_users_public (p_ids text[])
  RETURNS TABLE (
    id text,
    email text,
    full_name text
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  SELECT
    u.id::text,
    u.email::text,
    NULLIF(
      BTRIM(
        COALESCE(
          u.raw_user_meta_data ->> 'full_name',
          u.raw_user_meta_data ->> 'name'
        )
      ),
      ''
    )
  FROM
    auth.users AS u
  WHERE
    u.id::text = ANY (p_ids);
$function$;

REVOKE ALL ON FUNCTION public.get_auth_users_public (text[])
FROM
  PUBLIC;

REVOKE ALL ON FUNCTION public.get_auth_users_public (text[])
FROM
  anon;

REVOKE ALL ON FUNCTION public.get_auth_users_public (text[])
FROM
  authenticated;

GRANT
EXECUTE ON FUNCTION public.get_auth_users_public (text[]) TO service_role;

-- Existing email lookup was granted to anon/authenticated, which enables
-- account enumeration via the publishable key. Invite send uses the secret
-- server client, so service_role is sufficient.
REVOKE ALL ON FUNCTION public.find_user_id_by_email (text)
FROM
  anon;

REVOKE ALL ON FUNCTION public.find_user_id_by_email (text)
FROM
  authenticated;
