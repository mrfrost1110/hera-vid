import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getPromptForMode } from "@/lib/prompts";
import { DetectionMode, Provider } from "@/lib/types";

interface BBoxObj { x: number; y: number; w: number; h: number }

function parseBbox(raw: unknown): BBoxObj | undefined {
  if (!raw) return undefined;

  if (typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;

    if ("x" in obj && "y" in obj && "w" in obj && "h" in obj) {
      return { x: Number(obj.x), y: Number(obj.y), w: Number(obj.w), h: Number(obj.h) };
    }

    if ("x" in obj && "y" in obj && "width" in obj && "height" in obj) {
      return { x: Number(obj.x), y: Number(obj.y), w: Number(obj.width), h: Number(obj.height) };
    }

    if ("left" in obj && "top" in obj && "width" in obj && "height" in obj) {
      return { x: Number(obj.left), y: Number(obj.top), w: Number(obj.width), h: Number(obj.height) };
    }

    if ("x1" in obj && "y1" in obj && "x2" in obj && "y2" in obj) {
      const x1 = Number(obj.x1), y1 = Number(obj.y1), x2 = Number(obj.x2), y2 = Number(obj.y2);
      return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    }
  }

  if (Array.isArray(raw) && raw.length >= 4) {
    return { x: Number(raw[0]), y: Number(raw[1]), w: Number(raw[2]), h: Number(raw[3]) };
  }

  return undefined;
}

function normalizeBboxes(result: Record<string, unknown>) {
  const fa = result.frame_analysis as Record<string, unknown> | undefined;
  if (!fa) return;

  if ("bbox" in fa) {
    const normalized = parseBbox(fa.bbox);
    if (normalized) fa.bbox = normalized; else delete fa.bbox;
  }
  if ("bounding_box" in fa && !("bbox" in fa)) {
    const normalized = parseBbox(fa.bounding_box);
    if (normalized) fa.bbox = normalized;
    delete fa.bounding_box;
  }

  const persons = fa.persons as Record<string, unknown>[] | undefined;
  if (Array.isArray(persons)) {
    for (const p of persons) {
      if ("bbox" in p) {
        const normalized = parseBbox(p.bbox);
        if (normalized) p.bbox = normalized; else delete p.bbox;
      }
      if ("bounding_box" in p && !("bbox" in p)) {
        const normalized = parseBbox(p.bounding_box);
        if (normalized) p.bbox = normalized;
        delete p.bounding_box;
      }
    }
  }

  const detections = fa.detections as Record<string, unknown>[] | undefined;
  if (Array.isArray(detections)) {
    for (const d of detections) {
      if ("bbox" in d) {
        const normalized = parseBbox(d.bbox);
        if (normalized) d.bbox = normalized; else delete d.bbox;
      }
      if ("bounding_box" in d && !("bbox" in d)) {
        const normalized = parseBbox(d.bounding_box);
        if (normalized) d.bbox = normalized;
        delete d.bounding_box;
      }
    }
  }
}

const byteplusClient = new OpenAI({
  apiKey: process.env.ARK_API_KEY!,
  baseURL: process.env.ARK_BASE_URL!,
  timeout: 45000,
});

const openrouterClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  timeout: 45000,
  defaultHeaders: {
    "HTTP-Referer": "https://heracx.ai",
    "X-Title": "HERACX AI Safety Monitor",
  },
});

function getClient(provider: Provider): OpenAI {
  return provider === "openrouter" ? openrouterClient : byteplusClient;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { frame, mode, model, provider } = (await req.json()) as {
      frame: string;
      mode: DetectionMode;
      model?: string;
      provider?: Provider;
    };

    if (!frame || !mode) {
      return NextResponse.json(
        { success: false, error: "Missing frame or mode" },
        { status: 400 }
      );
    }

    const resolvedProvider = provider || "byteplus";
    const resolvedModel = model || process.env.ARK_MODEL_ID!;
    const client = getClient(resolvedProvider);
    const systemPrompt = getPromptForMode(mode);

    const response = await client.chat.completions.create({
      model: resolvedModel,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: frame },
            },
            {
              type: "text",
              text: "Analyze this frame for safety compliance. Return JSON only.",
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.1,
    });

    const choice = response.choices[0];
    const raw = choice?.message?.content || "";

    if (choice?.finish_reason === "length") {
      console.warn("Response truncated (finish_reason=length)");
    }

    let cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      let openBraces = 0;
      let openBrackets = 0;
      let inString = false;
      let escape = false;
      for (const ch of cleaned) {
        if (escape) { escape = false; continue; }
        if (ch === "\\") { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === "{") openBraces++;
        else if (ch === "}") openBraces--;
        else if (ch === "[") openBrackets++;
        else if (ch === "]") openBrackets--;
      }

      if (openBraces > 0 || openBrackets > 0) {
        cleaned = cleaned.replace(/,\s*"[^"]*"?\s*:?\s*[^,}\]]*$/, "");
        cleaned = cleaned.replace(/,\s*$/, "");
        for (let i = 0; i < openBrackets; i++) cleaned += "]";
        for (let i = 0; i < openBraces; i++) cleaned += "}";

        try {
          result = JSON.parse(cleaned);
          console.log("Repaired truncated JSON successfully");
        } catch {
          return NextResponse.json({
            success: false,
            error: `Model returned invalid JSON: ${raw.slice(0, 200)}`,
            latency_ms: Date.now() - startTime,
          });
        }
      } else {
        return NextResponse.json({
          success: false,
          error: `Model returned invalid JSON: ${raw.slice(0, 200)}`,
          latency_ms: Date.now() - startTime,
        });
      }
    }

    normalizeBboxes(result);

    console.log(`[${resolvedModel}] Response:`, JSON.stringify(result).slice(0, 500));

    return NextResponse.json({
      success: true,
      data: result,
      latency_ms: Date.now() - startTime,
      model: resolvedModel,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown analysis error";
    console.error("Analysis error:", message);
    return NextResponse.json(
      { success: false, error: message, latency_ms: Date.now() - startTime },
      { status: 500 }
    );
  }
}
