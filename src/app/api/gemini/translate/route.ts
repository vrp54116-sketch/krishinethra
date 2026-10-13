import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      q?: string;
      a?: string;
      sourceLang?: string;
    };

    const q = body.q?.trim();
    const a = body.a?.trim();
    const sourceLang = body.sourceLang || "en";

    if (!q || !a) {
      return Response.json(
        { error: "Both question (q) and answer (a) are required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback if no API key is present
      return Response.json({
        q: { en: q, hi: q, gu: q, mr: q, [sourceLang]: q },
        a: { en: a, hi: a, gu: a, mr: a, [sourceLang]: a },
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.8-flash",
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
      systemInstruction:
        "You are an expert Indian agricultural translator. Translate the provided farmer question and answer into English (en), Hindi (hi), Gujarati (gu), and Marathi (mr). Ensure natural colloquial farming phrasing and preserve all numeric doses. Return ONLY valid JSON matching this schema: {\"q\":{\"en\":\"\",\"hi\":\"\",\"gu\":\"\",\"mr\":\"\"},\"a\":{\"en\":\"\",\"hi\":\"\",\"gu\":\"\",\"mr\":\"\"}}",
    });

    const prompt = `Translate this question and answer (source language: ${sourceLang}):\nQuestion: "${q}"\nAnswer: "${a}"`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const parsed = JSON.parse(raw) as {
      q: { en: string; hi: string; gu: string; mr: string };
      a: { en: string; hi: string; gu: string; mr: string };
    };

    // Ensure source language is preserved
    parsed.q[sourceLang as "en" | "hi" | "gu" | "mr"] = q;
    parsed.a[sourceLang as "en" | "hi" | "gu" | "mr"] = a;

    return Response.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Translation failed";
    console.warn("Gemini translation error, returning fallback", msg);

    // Return fallback rather than error so client capture loop completes gracefully
    const fallbackQ = "Question";
    const fallbackA = "Answer";
    return Response.json({
      q: { en: fallbackQ, hi: fallbackQ, gu: fallbackQ, mr: fallbackQ },
      a: { en: fallbackA, hi: fallbackA, gu: fallbackA, mr: fallbackA },
      warning: msg,
    });
  }
}
