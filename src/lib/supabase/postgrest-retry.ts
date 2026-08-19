/**
 * Shared PostgREST fetch + request-only cache fallback.
 *
 * Used by the secret client's `global.fetch`. Caching of results lives on
 * `unstable_cache` in the stock readers; this layer must not be Data-Cached
 * by Next.js (`cache: "no-store"`).
 */

export const JWT_ISSUED_AT_FUTURE = "JWT issued at future";
export const POSTGREST_JWT_CLAIM_CODE = "PGRST303";
export const POSTGREST_RETRY_DELAY_MS = 1000;

/**
 * supabase-js catches undici `TypeError: fetch failed` (no HTTP response) and
 * returns it as a PostgREST error whose message is `"TypeError: fetch failed"`.
 * Cached readers then `throw new Error(error.message)`, so the page sees that
 * string rather than the original TypeError.
 */
export const FETCH_FAILED_MESSAGE = "TypeError: fetch failed";

type PostgrestErrorBody = {
  code?: string;
  message?: string;
};

export function isJwtIssuedAtFutureError(error: unknown): boolean {
  return error instanceof Error && error.message === JWT_ISSUED_AT_FUTURE;
}

export function isFetchFailedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.message === FETCH_FAILED_MESSAGE) return true;
  return error instanceof TypeError && error.message === "fetch failed";
}

export function isTransientCachedReadError(error: unknown): boolean {
  return isJwtIssuedAtFutureError(error) || isFetchFailedError(error);
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

function isRetryableNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message === "fetch failed";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendPostgrestRequest(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
): Promise<Response> {
  const nextInit: RequestInit = { ...init, cache: "no-store" };
  if (input instanceof Request) {
    return fetch(new Request(input.clone(), nextInit));
  }
  return fetch(input, nextInit);
}

async function sendWithNetworkRetry(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
): Promise<Response> {
  try {
    return await sendPostgrestRequest(input, init);
  } catch (error) {
    if (!isRetryableNetworkError(error)) throw error;
    console.warn(
      "Retrying PostgREST request after network fetch failure",
      error instanceof Error ? (error.cause ?? error) : error,
    );
    await delay(POSTGREST_RETRY_DELAY_MS);
    return sendPostgrestRequest(input, init);
  }
}

/**
 * PostgREST fetch wrapper used by the secret client.
 *
 * - Sets `cache: "no-store"` so Next.js does not also Data-Cache these
 *   authenticated requests. Caching lives on `unstable_cache` instead.
 * - Retries once after a short delay for PGRST303 clock skew.
 * - Retries once on undici `TypeError: fetch failed` (no response). That is
 *   safe for POST RPCs: the request never reached PostgREST. supabase-js only
 *   retries GET/HEAD/OPTIONS itself, so dashboard/stock RPCs need this layer.
 */
export async function fetchWithPostgrestRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await sendWithNetworkRetry(input, init);

  if (!(await isRetryableJwtClockResponse(response))) {
    return response;
  }

  console.warn(
    "Retrying PostgREST request after JWT issued-at clock skew (PGRST303)",
  );
  await delay(POSTGREST_RETRY_DELAY_MS);
  return sendWithNetworkRetry(input, init);
}

/**
 * Use around `unstable_cache(...)()` so a persisted PGRST303 or a network
 * fetch failure does not 500 the page. The fallback is request-only: do not
 * return it from inside the cache callback, or empty metrics would be stored
 * for the revalidate window.
 */
export async function withCachedReadFallback<T>(
  read: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (!isTransientCachedReadError(error)) throw error;
    console.warn(
      isJwtIssuedAtFutureError(error)
        ? "PostgREST JWT issued-at clock skew persisted; using request-only fallback"
        : "PostgREST network fetch failure persisted; using request-only fallback",
    );
    return fallback;
  }
}
