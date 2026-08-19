import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import {
  FETCH_FAILED_MESSAGE,
  fetchWithPostgrestRetry,
  JWT_ISSUED_AT_FUTURE,
  withCachedReadFallback,
} from "./postgrest-retry";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restoreAll();
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("retries TypeError fetch failed once and sets cache no-store", async () => {
  const cause = Object.assign(new Error("socket reset"), {
    code: "ECONNRESET",
  });
  const failed = new TypeError("fetch failed", { cause });
  const ok = jsonResponse(200, { ok: true });

  const calls: RequestInit[] = [];
  let attempt = 0;
  globalThis.fetch = (async (_input, init) => {
    calls.push(init ?? {});
    attempt += 1;
    if (attempt === 1) throw failed;
    return ok;
  }) as typeof fetch;

  const warn = mock.method(console, "warn", () => {});

  const response = await fetchWithPostgrestRetry("https://example.test/rpc", {
    method: "POST",
    body: "{}",
  });

  assert.equal(response.status, 200);
  assert.equal(calls.length, 2);
  assert.equal(calls[0]?.cache, "no-store");
  assert.equal(calls[1]?.cache, "no-store");
  assert.equal(warn.mock.callCount(), 1);
  const warnArgs = warn.mock.calls[0]?.arguments ?? [];
  assert.equal(
    warnArgs[0],
    "Retrying PostgREST request after network fetch failure",
  );
  assert.equal(warnArgs[1], cause);
});

test("does not retry non-network TypeErrors or other HTTP 401s", async () => {
  globalThis.fetch = (async () => {
    throw new TypeError("not a fetch failure");
  }) as typeof fetch;

  await assert.rejects(
    () => fetchWithPostgrestRetry("https://example.test/rpc"),
    (error: unknown) =>
      error instanceof TypeError && error.message === "not a fetch failure",
  );

  const unauthorized = jsonResponse(401, {
    code: "PGRST301",
    message: "JWT expired",
  });
  globalThis.fetch = (async () => unauthorized) as typeof fetch;
  const response = await fetchWithPostgrestRetry("https://example.test/rpc");
  assert.equal(response.status, 401);
});

test("request-only fallback catches wrapped fetch failed and JWT clock errors", async () => {
  const fallback = { empty: true };

  assert.deepEqual(
    await withCachedReadFallback(async () => {
      throw new Error(FETCH_FAILED_MESSAGE);
    }, fallback),
    fallback,
  );

  assert.deepEqual(
    await withCachedReadFallback(async () => {
      throw new Error(JWT_ISSUED_AT_FUTURE);
    }, fallback),
    fallback,
  );

  assert.deepEqual(
    await withCachedReadFallback(async () => {
      throw new TypeError("fetch failed");
    }, fallback),
    fallback,
  );

  await assert.rejects(
    () =>
      withCachedReadFallback(async () => {
        throw new Error("permission denied");
      }, fallback),
    (error: unknown) =>
      error instanceof Error && error.message === "permission denied",
  );
});
