/**
 * POST /api/telegram — forward a KrishiNethra AI alert to Telegram.
 *
 * Body (all optional except when env vars are missing):
 *   { botToken?, chatId?, level?, title?, message?, timestamp? }
 *
 * Credentials resolve as: request body override → Vercel/server env vars
 * (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID). Every failure path returns
 * JSON — this route never throws to the caller.
 */

export const runtime = "nodejs";

const LEVEL_EMOJI: Record<string, string> = {
  critical: "🔴",
  warning: "🟡",
  info: "🟢",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return new Date(ts).toISOString();
  }
}

export function buildAlertText(input: {
  level?: string;
  title?: string;
  message?: string;
  timestamp?: number;
}): string {
  const level = (input.level ?? "info").toLowerCase();
  const emoji = LEVEL_EMOJI[level] ?? "🟢";
  const title = (input.title ?? "Farm alert").slice(0, 200);
  const message = (input.message ?? "").slice(0, 1000);
  const time = formatTime(
    typeof input.timestamp === "number" ? input.timestamp : Date.now(),
  );
  return (
    `🌾 <b>KrishiNethra AI Alert</b>\n` +
    `${emoji} <b>${escapeHtml(level)}</b>: ${escapeHtml(title)}\n` +
    `${escapeHtml(message)}\n` +
    `🕒 ${escapeHtml(time)}`
  );
}

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }),
        signal: AbortSignal.timeout(12_000),
      },
    );
    let data: Record<string, unknown> = {};
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      /* non-JSON Telegram response */
    }
    if (res.ok && data["ok"] === true) {
      const result = data["result"] as { message_id?: number } | undefined;
      return { ok: true, messageId: result?.message_id };
    }
    const desc =
      typeof data["description"] === "string"
        ? data["description"]
        : `Telegram API responded with HTTP ${res.status}`;
    return { ok: false, error: desc };
  } catch (err) {
    const msg =
      err instanceof DOMException && err.name === "TimeoutError"
        ? "Telegram request timed out after 12s"
        : err instanceof Error
          ? err.message
          : "Network error while contacting Telegram";
    return { ok: false, error: msg };
  }
}

export async function POST(req: Request) {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }

    const pick = (v: unknown): string =>
      typeof v === "string" ? v.trim() : "";
    const botToken =
      pick(body["botToken"]) || (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
    const chatId =
      pick(body["chatId"]) || (process.env.TELEGRAM_CHAT_ID ?? "").trim();

    if (!botToken || !chatId) {
      return Response.json(
        {
          success: false,
          error:
            "Telegram is not configured. Provide botToken + chatId in the request body or set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars.",
        },
        { status: 400 },
      );
    }

    const text = buildAlertText({
      level: pick(body["level"]) || "info",
      title: pick(body["title"]) || "Farm alert",
      message: pick(body["message"]) || "",
      timestamp:
        typeof body["timestamp"] === "number" ? body["timestamp"] : Date.now(),
    });

    const sent = await sendTelegramMessage(botToken, chatId, text);
    if (sent.ok) {
      return Response.json({ success: true, messageId: sent.messageId });
    }
    return Response.json(
      { success: false, error: sent.error ?? "Failed to send Telegram message" },
      { status: 502 },
    );
  } catch (err) {
    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unexpected server error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json({
    ok: true,
    usage: "POST { botToken?, chatId?, level?, title?, message?, timestamp? }",
    hint: "Credentials fall back to TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID env vars.",
  });
}
