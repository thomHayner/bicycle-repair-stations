declare const process: {
  env: Record<string, string | undefined>;
};

type HeaderValue = string | string[] | undefined;

interface NodeRequest {
  method?: string;
  headers?: Record<string, HeaderValue>;
  body?: unknown;
}

interface NodeResponse {
  status: (code: number) => NodeResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
  end: (body?: string) => void;
}

interface CheckoutPayload {
  amount?: unknown;
}

const MIN_AMOUNT_CENTS = 100; // $1
const MAX_AMOUNT_CENTS = 10_000; // $100

function sendJson(response: NodeResponse, status: number, body: Record<string, unknown>) {
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  response.status(status).json(body);
}

function getHeader(request: NodeRequest, name: string): string {
  const value = request.headers?.[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function getAllowedOrigins(): Set<string> {
  const allowList = process.env.APP_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

  const singleOrigin = process.env.APP_ORIGIN?.trim();
  if (singleOrigin) allowList.push(singleOrigin);

  return new Set(allowList);
}

function parsePayload(body: unknown): CheckoutPayload | null {
  if (body && typeof body === "object") return body as CheckoutPayload;
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as CheckoutPayload;
    } catch {
      return null;
    }
  }
  return null;
}

export default async function handler(request: NodeRequest, response: NodeResponse): Promise<void> {
  try {
    if (request.method === "OPTIONS") {
      response.status(204).end();
      return;
    }

    if (request.method !== "POST") {
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }

    const originHeader = getHeader(request, "origin");
    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.size > 0 && originHeader && !allowedOrigins.has(originHeader)) {
      sendJson(response, 403, { error: "Origin not allowed." });
      return;
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      sendJson(response, 500, { error: "Payment service is not configured." });
      return;
    }

    const payload = parsePayload(request.body);
    if (!payload) {
      sendJson(response, 400, { error: "Invalid JSON payload." });
      return;
    }

    const amountCents = Number(payload.amount);
    if (
      !Number.isInteger(amountCents) ||
      amountCents < MIN_AMOUNT_CENTS ||
      amountCents > MAX_AMOUNT_CENTS
    ) {
      sendJson(response, 400, {
        error: `Amount must be between $${MIN_AMOUNT_CENTS / 100} and $${MAX_AMOUNT_CENTS / 100}.`,
      });
      return;
    }

    // Dynamically import Stripe to keep cold-start fast for non-payment routes
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(stripeSecretKey);

    const appUrl = originHeader || process.env.APP_ORIGIN || "https://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Donation to BicycleRepairStations",
              description: "Thank you for supporting free cycling infrastructure tools!",
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/donate/success`,
      cancel_url: `${appUrl}/donate`,
      submit_type: "donate",
    });

    sendJson(response, 200, { url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    sendJson(response, 500, { error: "Failed to create checkout session. Please try again." });
  }
}
