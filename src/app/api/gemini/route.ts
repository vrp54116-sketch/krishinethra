import { GoogleGenerativeAI, type Content } from "@google/generative-ai";

export const runtime = "nodejs";

type ChatTurn = { role: "user" | "assistant" | "model"; text: string };
type FarmContext = {
  soil?: number;
  temp?: number;
  hum?: number;
  aqi?: number;
  rain?: boolean;
  pump?: boolean;
  mode?: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  try {
    const body = (await request.json()) as {
      message?: string;
      history?: ChatTurn[];
      eli5?: boolean;
      lang?: string;
      context?: FarmContext;
    };
    const message = body.message?.trim();
    if (!message) return Response.json({ error: "Message is required" }, { status: 400 });

    let systemInstruction =
      "You are KrishiGPT, an expert Indian agronomist and a general knowledge assistant. Answer ANY question truthfully and completely, not only farming. For farming answers be practical, organic-first, India-specific, with doses in ml per litre or g per plant. If farm context is given, quote the farmer's live numbers.";
    if (body.eli5) {
      systemInstruction +=
        " Explain like I am 5 years old: very short sentences, everyday village analogies (WhatsApp, roti, monsoon), zero technical words.";
    }
    if (body.context) {
      systemInstruction += `\n\nLive farm context: ${JSON.stringify(body.context)}.`;
    }
    const languageNames: Record<string, string> = {
      hi: "Hindi",
      gu: "Gujarati",
      mr: "Marathi",
      en: "English",
    };
    const responseLanguage = languageNames[body.lang ?? "en"];
    if (responseLanguage) systemInstruction += ` Respond in ${responseLanguage}.`;

    const history: Content[] = (Array.isArray(body.history) ? body.history : [])
      .filter((turn) => turn && typeof turn.text === "string" && turn.text.trim())
      .map((turn) => ({
        role: turn.role === "assistant" ? "model" : turn.role,
        parts: [{ text: turn.text }],
      }))
      .filter((turn) => turn.role === "user" || turn.role === "model");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.8-flash",
      systemInstruction,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    });
    const chat = model.startChat({ history });

    let reply = "";
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await chat.sendMessage(message);
        reply = result.response.text().trim();
        if (reply) break;
      } catch (err) {
        lastErr = err;
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
        }
      }
    }

    if (!reply) {
      throw lastErr instanceof Error ? lastErr : new Error("Gemini returned an empty response");
    }
    return Response.json({ reply });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Gemini request failed";
    return Response.json({ error: detail }, { status: 502 });
  }
}
