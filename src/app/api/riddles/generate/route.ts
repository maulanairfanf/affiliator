import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";
import { buildRiddlePrompt } from "@/lib/contents/prompts";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { theme } = await request.json();

    const apiKey = process.env.RIDDLE_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured. Set RIDDLE_API_KEY or OPENAI_API_KEY" }, { status: 500 });
    }

    const baseURL = process.env.RIDDLE_BASE_URL || process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1";
    const model = process.env.RIDDLE_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";

    const client = new OpenAI({
      apiKey,
      baseURL,
      defaultHeaders: {
        "HTTP-Referer": process.env.APP_URL || "https://affiliator.local",
        "X-Title": "Affiliator",
      },
    });

    const { system, user } = buildRiddlePrompt(theme);

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(raw);

    const riddles = data.riddles || data || [];
    const list = Array.isArray(riddles) ? riddles : [];

    return NextResponse.json({ data: list });
  } catch (error) {
    console.error("Failed to generate riddles:", error);
    return NextResponse.json({ error: "Failed to generate riddles" }, { status: 500 });
  }
}
