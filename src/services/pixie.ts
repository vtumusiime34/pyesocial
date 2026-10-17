// Pixie AI Assistant — calls the app's secure AI endpoint (no keys in the browser).
import { streamAi } from "@/lib/ai-client";

export interface PixieMessage {
  id: string;
  sender: "user" | "pixie";
  text: string;
  timestamp: string;
  suggestedActions?: { label: string; action: string }[];
}

const intro = (): PixieMessage => ({
  id: "pixie_intro",
  sender: "pixie",
  text: "Hey there! ✨ I'm Pixie, your creative assistant in PYE. Ask me for PYES ideas, hooks, captions, hashtags or help using the app!",
  timestamp: "Just now",
});

const time = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

class PixieService {
  private history: PixieMessage[] = [intro()];

  getMessages() {
    return this.history;
  }

  async sendMessage(userText: string, onUpdate?: () => void): Promise<PixieMessage> {
    this.history.push({ id: `u_${Date.now()}`, sender: "user", text: userText, timestamp: time() });
    const reply: PixieMessage = { id: `p_${Date.now()}`, sender: "pixie", text: "", timestamp: time() };
    const convo = this.history
      .filter((m) => m.id !== "pixie_intro")
      .slice(-20)
      .map((m) => ({ role: m.sender === "user" ? ("user" as const) : ("assistant" as const), content: m.text }));
    this.history.push(reply);
    try {
      await streamAi({ mode: "pixie", messages: convo }, (full) => {
        reply.text = full;
        onUpdate?.();
      });
      if (!reply.text.trim()) reply.text = "The AI service returned no answer.";
    } catch (e) {
      reply.text = `⚠️ ${(e as Error).message}`;
    }
    return reply;
  }

  clearHistory() {
    this.history = [intro()];
  }
}

export const Pixie = new PixieService();
