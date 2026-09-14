import { MIRA_SYSTEM_PROMPT } from "./buddies";
import { getTimeOfDay } from "./time-of-day";

export type GuideMessage = {
  role: "user" | "assistant";
  content: string;
};

export type GuideRequest = {
  userMessage: string;
  frameDataUrl?: string | null;
  history?: GuideMessage[];
  memory?: Record<string, string>;
  userName?: string;
  buddyName?: string;
};

export type GuideResult = {
  reply: string;
  mode: "live" | "mock";
  memoryUpdates?: Record<string, string>;
};

function buildMemoryBlock(memory?: Record<string, string>, userName?: string) {
  const lines: string[] = [];
  if (userName) lines.push(`User's name: ${userName}`);
  if (memory) {
    for (const [key, value] of Object.entries(memory)) {
      if (value) lines.push(`${key}: ${value}`);
    }
  }
  const tod = getTimeOfDay();
  lines.push(`Local time-of-day for attire/tone: ${tod}`);
  return lines.length ? `Known memory:\n${lines.map((l) => `- ${l}`).join("\n")}` : "";
}

function mockGuidance(req: GuideRequest): GuideResult {
  const hasFrame = Boolean(req.frameDataUrl);
  const text = req.userMessage.trim().toLowerCase();

  let reply: string;
  if (!hasFrame) {
    reply =
      "I can't see your screen yet — hit Share when the browser asks, then tell me what you're trying to do.";
  } else if (!text || text === "looking at my screen" || text === "what should i do?") {
    reply =
      "I can see your shared screen. Tell me the goal in one line — for example “send this email” or “find the settings” — and I'll walk you click-by-click.";
  } else if (text.includes("email") || text.includes("gmail")) {
    reply =
      "Look near the top-left for Compose / New message. Click that purple or blue button first, then we'll fill the fields together.";
  } else if (text.includes("setting") || text.includes("pref")) {
    reply =
      "Scan the top-right for a gear, avatar, or ⋯ menu. Open that, then look for Settings — I'll call the next click once you're in.";
  } else if (text.includes("slack") || text.includes("message")) {
    reply =
      "Find the message box at the bottom of the channel. Click inside it, type your note, then press Enter / Send when you're ready.";
  } else {
    reply = `Got it — you want help with “${req.userMessage.slice(0, 80)}”. Look at the main action button in the center or top toolbar of what I'm seeing, hover it so the label appears, then click it. Tell me what it says if you're unsure.`;
  }

  const memoryUpdates: Record<string, string> = {};
  if (req.userMessage.trim().length > 8) {
    memoryUpdates.lastTask = req.userMessage.trim().slice(0, 160);
  }

  return { reply, mode: "mock", memoryUpdates };
}

export async function guideUser(req: GuideRequest): Promise<GuideResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return mockGuidance(req);
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const buddy = req.buddyName || "Mira";

  const system = [
    MIRA_SYSTEM_PROMPT.replace("Mira", buddy),
    buildMemoryBlock(req.memory, req.userName),
    "If you learn a durable preference or their current project, include a JSON line at the end like: MEMORY_JSON:{\"prefKey\":\"value\"} — only for stable facts, max 3 keys.",
  ]
    .filter(Boolean)
    .join("\n\n");

  type ContentPart =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail?: string } };

  const userContent: ContentPart[] = [
    {
      type: "text",
      text: req.userMessage || "Looking at my shared screen — what should I do next?",
    },
  ];

  if (req.frameDataUrl?.startsWith("data:image")) {
    userContent.push({
      type: "image_url",
      image_url: { url: req.frameDataUrl, detail: "low" },
    });
  }

  const history = (req.history || []).slice(-8).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 320,
        messages: [
          { role: "system", content: system },
          ...history,
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("OpenAI error", res.status, errText.slice(0, 400));
      return mockGuidance(req);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    let reply = data.choices?.[0]?.message?.content?.trim() || "";
    if (!reply) return mockGuidance(req);

    let memoryUpdates: Record<string, string> | undefined;
    const memMatch = reply.match(/MEMORY_JSON:\s*(\{[\s\S]*?\})/);
    if (memMatch) {
      try {
        memoryUpdates = JSON.parse(memMatch[1]) as Record<string, string>;
      } catch {
        memoryUpdates = undefined;
      }
      reply = reply.replace(/\n?MEMORY_JSON:\s*\{[\s\S]*?\}\s*$/, "").trim();
    }

    if (req.userMessage.trim().length > 8) {
      memoryUpdates = {
        ...(memoryUpdates || {}),
        lastTask: req.userMessage.trim().slice(0, 160),
      };
    }

    return { reply, mode: "live", memoryUpdates };
  } catch (err) {
    console.error("guideUser failed", err);
    return mockGuidance(req);
  }
}
