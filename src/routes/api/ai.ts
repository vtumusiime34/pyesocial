import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const Body = z.object({
  mode: z.enum(["caption", "pixie"]),
  draft: z.string().max(4000).optional(),
  tone: z.string().max(40).optional(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(30)
    .optional(),
});

const CAPTION_PROMPT = `You write captions for PYE Social Universe, a creator social app (PYES short videos, Universe pulses, PYE Sounds).
Rewrite the creator's draft into 3 polished, engaging caption options. Keep the creator's meaning and language; never invent facts, stats, names or links.
Each option: a strong hook, 1-3 short lines, a few fitting emojis, and 3-5 relevant hashtags at the end.
Output ONLY the three captions, separated by a line containing exactly "---". No numbering, no intro.`;

const PIXIE_PROMPT = `You are Pixie, the friendly creative assistant inside PYE Social Universe (by APPIX).
You help with PYES video ideas, hooks, captions, hashtags, sound suggestions, coins (Silver SPC / Gold GPC), PYE IDs, games and navigating the app.
Be concise and warm; use bullets or emojis when helpful. Never invent information about other users' private accounts.`;

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Please sign in to use AI tools.", { status: 401 });
        const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userData, error: authErr } = await sb.auth.getUser(token);
        if (authErr || !userData.user) return new Response("Please sign in to use AI tools.", { status: 401 });

        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid request.", { status: 400 });
        const body = parsed.data;

        let messages: ModelMessage[];
        let instructions: string;
        if (body.mode === "caption") {
          if (!body.draft?.trim()) return new Response("Write a draft first.", { status: 400 });
          instructions = CAPTION_PROMPT;
          messages = [
            { role: "user", content: `Tone: ${body.tone || "engaging"}\n\nDraft:\n${body.draft.trim()}` },
          ];
        } else {
          if (!body.messages?.length) return new Response("Say something to Pixie.", { status: 400 });
          instructions = PIXIE_PROMPT;
          messages = body.messages;
        }

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("AI is not configured.", { status: 500 });
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });

        let upstreamError: { status: number; message: string } | null = null;
        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          instructions,
          messages,
          abortSignal: request.signal,
          maxRetries: 0,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
          onError: ({ error }) => {
            const e = error as { statusCode?: number; message?: string };
            upstreamError = { status: e.statusCode ?? 500, message: e.message ?? "AI request failed" };
          },
        } as Parameters<typeof streamText>[0]);

        // Surface gateway errors (402 credits, 429 rate limit, 403) before streaming text.
        const reader = result.textStream[Symbol.asyncIterator]();
        let first: IteratorResult<string>;
        try {
          first = await reader.next();
        } catch (e) {
          const err = e as { statusCode?: number; message?: string };
          upstreamError = upstreamError ?? { status: err.statusCode ?? 500, message: err.message ?? "AI request failed" };
          first = { done: true, value: undefined };
        }
        if (first.done && upstreamError) {
          const { status, message } = upstreamError as { status: number; message: string };
          const friendly =
            status === 402
              ? "AI credits have run out for this workspace."
              : status === 429
                ? "Too many AI requests right now. Please wait a moment and try again."
                : message;
          return new Response(friendly, { status: status >= 400 ? status : 500 });
        }
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            if (!first.done) controller.enqueue(encoder.encode(first.value));
            try {
              for (;;) {
                const n = await reader.next();
                if (n.done) break;
                controller.enqueue(encoder.encode(n.value));
              }
            } catch {
              /* aborted */
            }
            controller.close();
          },
        });
        return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8" } });
      },
    },
  },
});
