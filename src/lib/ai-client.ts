import { supabase } from "@/integrations/supabase/client";

type AiBody =
  | { mode: "caption"; draft: string; tone?: string }
  | { mode: "pixie"; messages: { role: "user" | "assistant"; content: string }[] };

/** Streams text from the app's AI endpoint. Calls onChunk with the full text so far. */
export async function streamAi(body: AiBody, onChunk: (full: string) => void, signal?: AbortSignal) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in to use AI tools.");
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw new Error((await res.text().catch(() => "")) || "AI request failed");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += dec.decode(value, { stream: true });
    onChunk(full);
  }
  return full;
}
