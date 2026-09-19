/**
 * POST /api/telegram/test — connectivity check.
 *
 * Body (optional, overrides env for testing):
 *   { botToken?, chatId? }
 *
 * Sends "✅ KrishiNethra AI connected successfully!" and reports
 * success/failure as JSON. Never throws to the caller.
 */

export const runtime = "nodejs";

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
            "Telegram is not configured. Paste your bot token + chat ID first, or set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars.",
        },
        { status: 400 },
      );
    }

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "✅ KrishiNethra AI connected successfully!",
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
        return Response.json({ success: true, messageId: result?.message_id });
      }
      const desc =
        typeof data["description"] === "string"
          ? data["description"]
          : `Telegram API responded with HTTP ${res.status}`;
      return Response.json({ success: false, error: desc }, { status: 502 });
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "TimeoutError"
          ? "Telegram request timed out after 12s"
          : err instanceof Error
            ? err.message
            : "Network error while contacting Telegram";
      return Response.json({ success: false, error: msg }, { status: 502 });
    }
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
