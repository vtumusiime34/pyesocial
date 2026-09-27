/**
 * PYE data store.
 *
 * Holds an in-memory cache of the Lovable Cloud database so the existing
 * screens can keep reading data synchronously, while every write goes to the
 * database. Writes update the cache optimistically and then persist.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

export type ProfileRow = Tables["profiles"]["Row"];
export type WalletRow = Tables["wallets"]["Row"];
export type PostRow = Tables["posts"]["Row"];
export type PyesRow = Tables["pyes"]["Row"];
export type CommentRow = Tables["comments"]["Row"];
export type SoundRow = Tables["sounds"]["Row"];
export type FollowRow = Tables["follows"]["Row"];
export type LikeRow = Tables["likes"]["Row"];
export type SaveRow = Tables["saves"]["Row"];
export type ConversationRow = Tables["conversations"]["Row"];
export type MessageRow = Tables["messages"]["Row"];
export type NotificationRow = Tables["notifications"]["Row"];
export type ConferenceRow = Tables["conferences"]["Row"];
export type ConferenceParticipantRow = Tables["conference_participants"]["Row"];
export type GameRecordRow = Tables["game_records"]["Row"];
export type TransactionRow = Tables["coin_transactions"]["Row"];
export type ReportRow = Tables["safety_reports"]["Row"];
export type BlockedRow = Tables["blocked_users"]["Row"];
export type AppealRow = Tables["account_appeals"]["Row"];
export type AuditLogRow = Tables["audit_logs"]["Row"];

export interface Cache {
  currentUserId: string | null;
  profiles: ProfileRow[];
  wallets: WalletRow[];
  follows: FollowRow[];
  likes: LikeRow[];
  saves: SaveRow[];
  posts: PostRow[];
  pyes: PyesRow[];
  comments: CommentRow[];
  sounds: SoundRow[];
  conversations: ConversationRow[];
  messages: MessageRow[];
  notifications: NotificationRow[];
  conferences: ConferenceRow[];
  conferenceParticipants: ConferenceParticipantRow[];
  gameRecords: GameRecordRow[];
  transactions: TransactionRow[];
  reports: ReportRow[];
  blocked: BlockedRow[];
  appeals: AppealRow[];
  auditLogs: AuditLogRow[];
  roles: string[];
  ready: boolean;
}

export const cache: Cache = {
  currentUserId: null,
  profiles: [],
  wallets: [],
  follows: [],
  likes: [],
  saves: [],
  posts: [],
  pyes: [],
  comments: [],
  sounds: [],
  conversations: [],
  messages: [],
  notifications: [],
  conferences: [],
  conferenceParticipants: [],
  gameRecords: [],
  transactions: [],
  reports: [],
  blocked: [],
  appeals: [],
  auditLogs: [],
  roles: [],
  ready: false,
};

let version = 0;
const listeners = new Set<() => void>();

export function emit(): void {
  version += 1;
  listeners.forEach((l) => l());
}

export function subscribeStore(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getStoreVersion(): number {
  return version;
}

/** Generates a client-side uuid so optimistic rows have stable keys. */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

function logError(scope: string, error: unknown): void {
  if (!error) return;
  console.error(`[pye:${scope}]`, error);
}

/** Fire-and-forget persistence that never breaks the UI. */
export function persist(
  scope: string,
  run: () => PromiseLike<{ error?: unknown } | void> | Promise<unknown>,
): void {
  void (async () => {
    try {
      const res = await run();
      if (res && "error" in res && res.error) logError(scope, res.error);
    } catch (error) {
      logError(scope, error);
    }
  })();
}

async function loadPublic(): Promise<void> {
  const [profiles, wallets, follows, likes, posts, pyes, comments, sounds, conferences, participants, games] =
    await Promise.all([
      supabase.from("profiles").select("*").limit(2000),
      supabase.from("wallets").select("*").limit(2000),
      supabase.from("follows").select("*").limit(5000),
      supabase.from("likes").select("*").limit(10000),
      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("pyes").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("comments").select("*").order("created_at", { ascending: false }).limit(2000),
      supabase.from("sounds").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("conferences").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("conference_participants").select("*").limit(2000),
      supabase.from("game_records").select("*").order("played_at", { ascending: false }).limit(500),
    ]);

  logError("profiles", profiles.error);
  logError("pyes", pyes.error);

  cache.profiles = profiles.data ?? [];
  cache.wallets = wallets.data ?? [];
  cache.follows = follows.data ?? [];
  cache.likes = likes.data ?? [];
  cache.posts = posts.data ?? [];
  cache.pyes = pyes.data ?? [];
  cache.comments = comments.data ?? [];
  cache.sounds = sounds.data ?? [];
  cache.conferences = conferences.data ?? [];
  cache.conferenceParticipants = participants.data ?? [];
  cache.gameRecords = games.data ?? [];
}

async function loadPrivate(userId: string): Promise<void> {
  const [saves, conversations, notifications, transactions, blocked, roles] = await Promise.all([
    supabase.from("saves").select("*").eq("user_id", userId),
    supabase.from("conversations").select("*").or(`user_a.eq.${userId},user_b.eq.${userId}`),
    supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
    supabase.from("coin_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
    supabase.from("blocked_users").select("*").eq("user_id", userId),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  cache.saves = saves.data ?? [];
  cache.conversations = conversations.data ?? [];
  cache.notifications = notifications.data ?? [];
  cache.transactions = transactions.data ?? [];
  cache.blocked = blocked.data ?? [];
  cache.roles = (roles.data ?? []).map((r) => r.role as string);

  const convIds = cache.conversations.map((c) => c.id);
  if (convIds.length) {
    const messages = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: true });
    cache.messages = messages.data ?? [];
  } else {
    cache.messages = [];
  }

  if (cache.roles.includes("admin")) {
    const [reports, appeals, logs] = await Promise.all([
      supabase.from("safety_reports").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("account_appeals").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(300),
    ]);
    cache.reports = reports.data ?? [];
    cache.appeals = appeals.data ?? [];
    cache.auditLogs = logs.data ?? [];
  }
}

function clearPrivate(): void {
  cache.saves = [];
  cache.conversations = [];
  cache.messages = [];
  cache.notifications = [];
  cache.transactions = [];
  cache.blocked = [];
  cache.reports = [];
  cache.appeals = [];
  cache.auditLogs = [];
  cache.roles = [];
}

let hydrating: Promise<void> | null = null;

export async function hydrate(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  cache.currentUserId = data.session?.user.id ?? null;
  await loadPublic();
  if (cache.currentUserId) {
    await loadPrivate(cache.currentUserId);
  } else {
    clearPrivate();
  }
  cache.ready = true;
  emit();
}

export function ensureHydrated(): Promise<void> {
  if (!hydrating) hydrating = hydrate();
  return hydrating;
}

/** Re-reads everything from the database (after sign-in, sign-out, realtime). */
export async function refresh(): Promise<void> {
  await hydrate();
}

export async function refreshPublic(): Promise<void> {
  await loadPublic();
  emit();
}

export async function setSessionUser(userId: string | null): Promise<void> {
  cache.currentUserId = userId;
  if (userId) {
    await loadPublic();
    await loadPrivate(userId);
  } else {
    clearPrivate();
  }
  emit();
}

// ---------------------------------------------------------------- realtime
let channels: { unsubscribe: () => void }[] = [];

export function startRealtime(): void {
  stopRealtime();
  const userId = cache.currentUserId;

  const feed = supabase
    .channel("pye-feed")
    .on("postgres_changes", { event: "*", schema: "public", table: "pyes" }, () => void refreshPublic())
    .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => void refreshPublic())
    .subscribe();
  channels.push(feed);

  if (!userId) return;

  const personal = supabase
    .channel("pye-personal")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      async () => {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(200);
        cache.notifications = data ?? [];
        emit();
      },
    )
    .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, async () => {
      const convs = await supabase.from("conversations").select("*").or(`user_a.eq.${userId},user_b.eq.${userId}`);
      cache.conversations = convs.data ?? [];
      const ids = cache.conversations.map((c) => c.id);
      if (ids.length) {
        const msgs = await supabase
          .from("messages")
          .select("*")
          .in("conversation_id", ids)
          .order("created_at", { ascending: true });
        cache.messages = msgs.data ?? [];
      }
      emit();
    })
    .subscribe();
  channels.push(personal);
}

export function stopRealtime(): void {
  channels.forEach((c) => {
    try {
      c.unsubscribe();
    } catch {
      /* ignore */
    }
  });
  channels = [];
}
