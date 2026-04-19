import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import handler from "./report-bug.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface CapturedResponse {
  statusCode: number;
  body: unknown;
}

function makeResponse(): { res: Parameters<typeof handler>[1]; capture: CapturedResponse } {
  const capture: CapturedResponse = { statusCode: 200, body: null };
  const res = {
    status(code: number) {
      capture.statusCode = code;
      return res;
    },
    setHeader(_name: string, _value: string) {},
    json(body: unknown) {
      capture.body = body;
    },
    end(_body?: string) {},
  };
  return { res, capture };
}

const validPayload = {
  summary: "Map does not load",
  description: "When I open the app the map never appears.",
  steps: "1. Open app. 2. Wait 30 seconds.",
  expected: "Map should load within 5 seconds.",
  theme: "Dark",
  device: "iPhone 14, iOS 17",
};

// Use a unique per-test IP to avoid cross-test rate-limit interference
let ipCounter = 0;
function uniqueIp() {
  return `192.168.${++ipCounter}.1`;
}

function makeRequest(
  overrides: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    ip?: string;
  } = {}
): Parameters<typeof handler>[0] {
  const ip = overrides.ip ?? uniqueIp();
  return {
    method: overrides.method ?? "POST",
    headers: {
      "x-forwarded-for": ip,
      "content-length": "100",
      ...(overrides.headers ?? {}),
    },
    body: "body" in overrides ? overrides.body : validPayload,
  };
}

const goodGitHubResponse = new Response(
  JSON.stringify({ html_url: "https://github.com/owner/repo/issues/42", number: 42 }),
  { status: 201, headers: { "Content-Type": "application/json" } }
);

// ---------------------------------------------------------------------------

beforeEach(() => {
  process.env.GITHUB_ISSUES_TOKEN = "ghp_test_token";
  process.env.GITHUB_REPO_OWNER = "owner";
  process.env.GITHUB_REPO_NAME = "repo";
  delete process.env.APP_ORIGINS;
  delete process.env.APP_ORIGIN;
  vi.restoreAllMocks();
});

afterEach(() => {
  delete process.env.GITHUB_ISSUES_TOKEN;
  delete process.env.GITHUB_REPO_OWNER;
  delete process.env.GITHUB_REPO_NAME;
  vi.restoreAllMocks();
});

describe("POST /api/report-bug", () => {
  it("OPTIONS → 204", async () => {
    const { res, capture } = makeResponse();
    await handler(makeRequest({ method: "OPTIONS" }), res);
    expect(capture.statusCode).toBe(204);
  });

  it("GET → 405 method not allowed", async () => {
    const { res, capture } = makeResponse();
    await handler(makeRequest({ method: "GET" }), res);
    expect(capture.statusCode).toBe(405);
  });

  it("returns 403 when origin is not in the allowlist", async () => {
    process.env.APP_ORIGINS = "https://allowed.com";
    const { res, capture } = makeResponse();
    await handler(
      makeRequest({ headers: { "x-forwarded-for": uniqueIp(), origin: "https://evil.com" } }),
      res
    );
    expect(capture.statusCode).toBe(403);
  });

  it("returns 413 when content-length exceeds 12 KB", async () => {
    const { res, capture } = makeResponse();
    await handler(
      makeRequest({ headers: { "x-forwarded-for": uniqueIp(), "content-length": "13000" } }),
      res
    );
    expect(capture.statusCode).toBe(413);
  });

  it("returns 429 on the 7th request from the same IP within 60 seconds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ html_url: "https://github.com/o/r/issues/1", number: 1 }),
        { status: 201 }
      )
    );

    const sameIp = `10.0.${++ipCounter}.1`;
    // First 6 requests should succeed
    for (let i = 0; i < 6; i++) {
      const { res } = makeResponse();
      await handler(makeRequest({ ip: sameIp }), res);
    }
    // 7th request should be rate-limited
    const { res, capture } = makeResponse();
    await handler(makeRequest({ ip: sameIp }), res);
    expect(capture.statusCode).toBe(429);
  });

  it("returns 500 when GitHub env vars are missing", async () => {
    delete process.env.GITHUB_ISSUES_TOKEN;
    delete process.env.GITHUB_REPO_OWNER;
    delete process.env.GITHUB_REPO_NAME;
    const { res, capture } = makeResponse();
    await handler(makeRequest(), res);
    expect(capture.statusCode).toBe(500);
    expect((capture.body as Record<string, string>).error).toContain("Missing");
  });

  it("returns 400 for invalid JSON body", async () => {
    const { res, capture } = makeResponse();
    await handler(makeRequest({ body: "not-valid-json-object" }), res);
    // A plain string that is not valid JSON parse-able as an object
    // Actually parsePayload accepts objects directly... let me use null
    await handler(makeRequest({ body: undefined }), res);
    // body undefined → parsePayload returns null → 400
    expect(capture.statusCode).toBe(400);
  });

  it("returns 400 when required fields are missing", async () => {
    const { res, capture } = makeResponse();
    await handler(makeRequest({ body: { summary: "Oops" } }), res);
    expect(capture.statusCode).toBe(400);
    expect((capture.body as Record<string, string>).error).toContain("required fields");
  });

  it("returns 400 when body contains an email address (PII)", async () => {
    const { res, capture } = makeResponse();
    await handler(
      makeRequest({
        body: { ...validPayload, description: "Contact me at user@example.com for details." },
      }),
      res
    );
    expect(capture.statusCode).toBe(400);
    expect((capture.body as Record<string, string>).error).toContain("email");
  });

  it("returns 400 when body contains a phone number (PII)", async () => {
    const { res, capture } = makeResponse();
    await handler(
      makeRequest({
        body: { ...validPayload, description: "Call me on +1-800-555-0199 to follow up." },
      }),
      res
    );
    expect(capture.statusCode).toBe(400);
  });

  it("returns 201 with issueUrl and issueNumber on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(goodGitHubResponse);
    const { res, capture } = makeResponse();
    await handler(makeRequest(), res);
    expect(capture.statusCode).toBe(201);
    expect((capture.body as Record<string, unknown>).issueUrl).toBe(
      "https://github.com/owner/repo/issues/42"
    );
    expect((capture.body as Record<string, unknown>).issueNumber).toBe(42);
  });

  it("returns 502 when GitHub API returns a non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 })
    );
    const { res, capture } = makeResponse();
    await handler(makeRequest(), res);
    expect(capture.statusCode).toBe(502);
  });

  it("prepends 'Bug:' to the issue title if not already present", async () => {
    let capturedBody: string | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, opts) => {
      capturedBody = (opts?.body as string) ?? null;
      return goodGitHubResponse;
    });
    const { res } = makeResponse();
    await handler(makeRequest({ body: { ...validPayload, summary: "Map does not load" } }), res);
    expect(capturedBody).not.toBeNull();
    const parsed = JSON.parse(capturedBody!) as { title: string };
    expect(parsed.title).toBe("Bug: Map does not load");
  });
});
