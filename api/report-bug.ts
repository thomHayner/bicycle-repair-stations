declare const process: {
  env: Record<string, string | undefined>;
};

interface BugPayload {
  summary?: unknown;
  description?: unknown;
  steps?: unknown;
  expected?: unknown;
  theme?: unknown;
  device?: unknown;
  screenshots?: unknown;
}

const MAX_BODY_SIZE_BYTES = 12_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_PER_IP = 6;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function containsRestrictedPII(text: string) {
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const phoneRegex = /(\+?\d[\d\s().-]{7,}\d)/;
  return emailRegex.test(text) || phoneRegex.test(text);
}

function enforceRateLimit(ip: string) {
  const now = Date.now();
  const current = rateLimitStore.get(ip);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX_PER_IP) return false;
  current.count += 1;
  rateLimitStore.set(ip, current);
  return true;
}

function getAllowedOrigins() {
  const allowList = process.env.APP_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

  const singleOrigin = process.env.APP_ORIGIN?.trim();
  if (singleOrigin) allowList.push(singleOrigin);

  return new Set(allowList);
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }

    if (request.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed." });
    }

    const originHeader = request.headers.get("origin");
    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.size > 0 && originHeader && !allowedOrigins.has(originHeader)) {
      return jsonResponse(403, { error: "Origin not allowed." });
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_SIZE_BYTES) {
      return jsonResponse(413, { error: "Payload too large." });
    }

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!enforceRateLimit(clientIp)) {
      return jsonResponse(429, { error: "Too many reports. Please try again in a minute." });
    }

    const githubToken = process.env.GITHUB_ISSUES_TOKEN;
    const githubOwner = process.env.GITHUB_REPO_OWNER;
    const githubRepo = process.env.GITHUB_REPO_NAME;

    const missingConfig: string[] = [];
    if (!githubToken) missingConfig.push("GITHUB_ISSUES_TOKEN");
    if (!githubOwner) missingConfig.push("GITHUB_REPO_OWNER");
    if (!githubRepo) missingConfig.push("GITHUB_REPO_NAME");

    if (missingConfig.length > 0) {
      return jsonResponse(500, {
        error: `Bug report service is not configured. Missing: ${missingConfig.join(", ")}.`,
      });
    }

    let payload: BugPayload;
    try {
      payload = (await request.json()) as BugPayload;
    } catch {
      return jsonResponse(400, { error: "Invalid JSON payload." });
    }

    const summary = asTrimmedString(payload.summary);
    const description = asTrimmedString(payload.description);
    const steps = asTrimmedString(payload.steps);
    const expected = asTrimmedString(payload.expected);
    const theme = asTrimmedString(payload.theme) || "Not sure";
    const device = asTrimmedString(payload.device) || "Not provided";
    const screenshots = asTrimmedString(payload.screenshots) || "None provided";

    if (!summary || !description || !steps || !expected) {
      return jsonResponse(400, { error: "Please complete all required fields." });
    }

    const combined = [summary, description, steps, expected, theme, device, screenshots].join("\n");
    if (containsRestrictedPII(combined)) {
      return jsonResponse(400, {
        error: "Please remove email addresses and phone numbers before submitting.",
      });
    }

    const userAgent = request.headers.get("user-agent") ?? "Unknown user agent";
    const submittedAt = new Date().toISOString();

    const issueBody = [
      "### What happened?",
      description,
      "",
      "### Steps to reproduce",
      steps,
      "",
      "### Expected behaviour",
      expected,
      "",
      "### Colour theme",
      theme,
      "",
      "### Device and browser",
      device,
      "",
      "### Screenshots or screen recording",
      screenshots,
      "",
      "---",
      `Submitted from in-app bug form on ${submittedAt}.`,
      `User agent: ${userAgent}`,
    ].join("\n");

    const issueTitle = summary.toLowerCase().startsWith("bug:") ? summary : `Bug: ${summary}`;

    const githubResponse = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/issues`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${githubToken}`,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "bicycle-repair-stations-bug-form",
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels: ["bug"],
      }),
    });

    if (!githubResponse.ok) {
      return jsonResponse(502, {
        error: "GitHub issue creation failed. Please try again shortly.",
      });
    }

    const githubIssue = await githubResponse.json() as { html_url: string; number: number };
    return jsonResponse(201, {
      issueUrl: githubIssue.html_url,
      issueNumber: githubIssue.number,
    });
  } catch (error) {
    console.error("Unexpected report-bug error", error);
    return jsonResponse(500, {
      error: "Bug report service failed unexpectedly. Please try again shortly.",
    });
  }
}