import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript?.trim()) {
      return NextResponse.json({ tasks: [] });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a calendar assistant. Extract tasks/events from this voice transcript and return them as a JSON array.

Transcript: "${transcript}"

Rules:
- col: day of week (0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun)
- sh/sm: start hour/minute in 24h format
- eh/em: end hour/minute in 24h format
- label: short task name, max 3 words
- If no specific time mentioned, use reasonable business hours (9am–5pm)
- If no specific day mentioned, spread across Mon–Fri
- Default duration: 45 minutes unless specified
- Only include times between 8:00 and 19:00

Return ONLY a valid JSON array like:
[{"col":0,"sh":9,"sm":0,"eh":9,"em":45,"label":"Landing page"}]

No other text, no markdown, just the JSON array.`,
        },
      ],
    });

    const raw = message.content[0];
    if (raw.type !== "text") throw new Error("Unexpected response type");

    const tasks = JSON.parse(raw.text.trim());
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to parse tasks" }, { status: 500 });
  }
}
