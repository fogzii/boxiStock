import "server-only";

/**
 * PostgREST PGRST303 when a JWT's `iat` is more than 30s ahead of PostgREST.
 * New `sb_secret_` keys are not JWTs; the API gateway mints one per request,
 * so brief gateway/PostgREST clock drift surfaces as this error.
 */
export const JWT_ISSUED_AT_FUTURE = "JWT issued at future";
export const POSTGREST_JWT_CLAIM_CODE = "PGRST303";
export const JWT_CLOCK_RETRY_DELAY_MS = 1000;

type PostgrestErrorBody = {
  code?: string;
  message?: string;
};

export function isJwtIssuedAtFutureError(error: unknown): boolean {
  return error instanceof Error && error.message === JWT_ISSUED_AT_FUTURE;
}

async function isRetryableJwtClockResponse(
  response: Response,
): Promise<boolean> {
  if (response.status !== 401) return false;
  const body = (await response
    .clone()
    .json()
    .catch(() => null)) as PostgrestErrorBody | null;
  return (
    body?.code === POSTGREST_JWT_CLAIM_CODE &&
    body?.message === JWT_ISSUED_AT_FUTURE
  );
}

/**
 * Retries a PostgREST request once after a short delay when the platform
 * minted a JWT that PostgREST still considers issued in the future.
 * Expired tokens, bad signatures, and other 401s are not retried.
 */
export async function fetchWithJwtClockRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const send = () =>
    fetch(input instanceof Request ? input.clone() : input, init);

  const response = await send();
  if (!(await isRetryableJwtClockResponse(response))) {
    return response;
  }

  console.warn(
    "Retrying PostgREST request after JWT issued-at clock skew (PGRST303)",
  );
  await new Promise((resolve) => setTimeout(resolve, JWT_CLOCK_RETRY_DELAY_MS));
  return send();
}

/**
 * Use around `unstable_cache(...)()` so a persisted PGRST303 does not 500 the
 * page. The fallback is request-only: do not return it from inside the cache
 * callback, or empty metrics would be stored for the revalidate window.
 */
export async function withJwtClockFallback<T>(
  read: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (!isJwtIssuedAtFutureError(error)) throw error;
    console.warn(
      "PostgREST JWT issued-at clock skew persisted; using request-only fallback",
    );
    return fallback;
  }
}
