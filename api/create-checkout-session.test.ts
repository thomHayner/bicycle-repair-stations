import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import handler from "./create-checkout-session";

// Mock the Stripe SDK that is dynamically imported inside the handler.
// Must use a class (not an arrow function) because the handler calls `new Stripe(...)`.
vi.mock("stripe", () => ({
  default: class MockStripe {
    checkout = {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: "https://checkout.stripe.com/pay/cs_test_abc123",
        }),
      },
    };
    constructor(_key: string) {}
  },
}));

// --- Helper: mock NodeRequest / NodeResponse --------------------------------

interface CapturedResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}

function makeResponse(): { res: Parameters<typeof handler>[1]; capture: CapturedResponse } {
  const capture: CapturedResponse = { statusCode: 200, body: null, headers: {} };
  const res = {
    status(code: number) {
      capture.statusCode = code;
      return res;
    },
    setHeader(name: string, value: string) {
      capture.headers[name] = value;
    },
    json(body: unknown) {
      capture.body = body;
    },
    end(_body?: string) {},
  };
  return { res, capture };
}

function makeRequest(overrides: {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
} = {}): Parameters<typeof handler>[0] {
  return {
    method: overrides.method ?? "POST",
    headers: overrides.headers ?? {},
    body: overrides.body ?? null,
  };
}

// ---------------------------------------------------------------------------

beforeEach(() => {
  // Set required env var for most tests
  process.env.STRIPE_SECRET_KEY = "sk_test_fake";
  delete process.env.APP_ORIGINS;
  delete process.env.APP_ORIGIN;
});

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.APP_ORIGINS;
  delete process.env.APP_ORIGIN;
  vi.clearAllMocks();
});

describe("POST /api/create-checkout-session", () => {
  it("OPTIONS → 204 with no body", async () => {
    const { res, capture } = makeResponse();
    await handler(makeRequest({ method: "OPTIONS" }), res);
    expect(capture.statusCode).toBe(204);
  });

  it("GET → 405 method not allowed", async () => {
    const { res, capture } = makeResponse();
    await handler(makeRequest({ method: "GET" }), res);
    expect(capture.statusCode).toBe(405);
  });

  it("returns 403 when origin is not in allowlist", async () => {
    process.env.APP_ORIGINS = "https://allowed.com";
    const { res, capture } = makeResponse();
    await handler(
      makeRequest({ headers: { origin: "https://evil.com" }, body: { amount: 500 } }),
      res
    );
    expect(capture.statusCode).toBe(403);
  });

  it("allows request when origin IS in the allowlist", async () => {
    process.env.APP_ORIGINS = "https://allowed.com";
    const { res, capture } = makeResponse();
    await handler(
      makeRequest({ headers: { origin: "https://allowed.com" }, body: { amount: 500 } }),
      res
    );
    expect(capture.statusCode).toBe(200);
  });

  it("returns 500 when STRIPE_SECRET_KEY is missing", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { res, capture } = makeResponse();
    await handler(makeRequest({ body: { amount: 500 } }), res);
    expect(capture.statusCode).toBe(500);
  });

  it("returns 400 when amount is below minimum ($1 = 100 cents)", async () => {
    const { res, capture } = makeResponse();
    await handler(makeRequest({ body: { amount: 99 } }), res);
    expect(capture.statusCode).toBe(400);
    expect((capture.body as Record<string, string>).error).toContain("Amount");
  });

  it("returns 400 when amount is above maximum ($100 = 10000 cents)", async () => {
    const { res, capture } = makeResponse();
    await handler(makeRequest({ body: { amount: 10001 } }), res);
    expect(capture.statusCode).toBe(400);
  });

  it("returns 400 when amount is not an integer", async () => {
    const { res, capture } = makeResponse();
    await handler(makeRequest({ body: { amount: 150.5 } }), res);
    expect(capture.statusCode).toBe(400);
  });

  it("returns 200 with checkout URL for valid amount", async () => {
    const { res, capture } = makeResponse();
    await handler(makeRequest({ body: { amount: 500 } }), res);
    expect(capture.statusCode).toBe(200);
    expect((capture.body as Record<string, string>).url).toContain("checkout.stripe.com");
  });
});
