/**
 * PYE storage service (database-backed).
 *
 * Keeps the same synchronous method surface the PYE screens already use, but
 * every read comes from the live database cache in `store.ts` and every write
 * is persisted to Lovable Cloud. No seeded or demo content exists here.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  AccountAppeal,
  Advertisement,
  AuditLog,
  BlockedUser,
  BusinessProfile,
  CoinTransaction,
  Comment,
  Conference,
  Conversation,
  DailyMission,
  DirectMessage,
  FollowRelationship,
  GameScoreRecord,
  LikeRelationship,
  LiveStream,
  NotificationItem,
  PaymentLedgerEntry,
  PaymentMethodConfig,
  Post,
  PromotedContent,
  PyeSpace,
  PyesVideo,
  RankingItem,
  SafetyReport,
  SoundTrack,
  TubeVideo,
  User,
} from "@/types";
import { PYE_SPACES } from "@/services/spaces";
import {
  cache,
  emit,
  ensureHydrated,
  getStoreVersion,
  newId,
  nowIso,
  persist,
  refresh,
  refreshPublic,
  setSessionUser,
  startRealtime,
  stopRealtime,
  subscribeStore,
  type CommentRow,
  type ConferenceRow,
  type PostRow,
  type ProfileRow,
  type PyesRow,
  type SoundRow,
} from "@/services/store";

export {
  ensureHydrated,
  getStoreVersion,
  subscribeStore,
  refresh as refreshStore,
  startRealtime,
  stopRealtime,
};

const LOCAL_MISSIONS = "pye_missions_v2";
const LOCAL_PAYMENT_METHODS = "pye_payment_methods_v2";

const DEFAULT_PRIVACY: User["privacySettings"] = {
  isPrivateAccount: false,
  whoCanMessage: "everyone",
  whoCanComment: "everyone",
  whoCanMention: "everyone",
  allowDownload: true,
  showActivityStatus: true,
};

const DEFAULT_MISSIONS: DailyMission[] = [
  {
    id: "watch_pyes",
    title: "Watch 3 PYES Reels",
    description: "Immerse in the PYES vertical cinema feed",
    rewardSilver: 5,
    rewardGold: 0,
    icon: "Flame",
    progress: 0,
    target: 3,
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: "share_pulse",
    title: "Broadcast a Pulse / PYES",
    description: "Share a pulse or PYES with the universe",
    rewardSilver: 5,
    rewardGold: 1,
    icon: "Send",
    progress: 0,
    target: 1,
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: "give_likes",
    title: "Heart 3 Pulses / PYES",
    description: "Show appreciation to fellow pioneers",
    rewardSilver: 3,
    rewardGold: 0,
    icon: "Heart",
    progress: 0,
    target: 3,
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: "play_game",
    title: "Play 1 PYE Arcade Game",
    description: "Play Chess, Checkers, Ludo, or TikTakToe",
    rewardSilver: 5,
    rewardGold: 1,
    icon: "Gamepad2",
    progress: 0,
    target: 1,
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: "listen_sound",
    title: "Listen to a PYE Sound",
    description: "Tune into acoustic soundbites in Sounds",
    rewardSilver: 2,
    rewardGold: 0,
    icon: "Music",
    progress: 0,
    target: 1,
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: "checkin",
    title: "Daily Check-in",
    description: "Open PYE and claim your daily coins",
    rewardSilver: 3,
    rewardGold: 0,
    icon: "Sparkles",
    progress: 1,
    target: 1,
    isCompleted: true,
    isClaimed: false,
  },
];

function readLocal<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / unavailable */
  }
}

function normaliseTargetType(type: string): string {
  return type === "short" ? "pyes" : type;
}

function countLikes(targetId: string, type?: string): number {
  return cache.likes.filter(
    (l) => l.target_id === targetId && (!type || normaliseTargetType(l.target_type) === normaliseTargetType(type)),
  ).length;
}

function countComments(targetId: string): number {
  return cache.comments.filter((c) => c.target_id === targetId).length;
}

// ---------------------------------------------------------------- mappers
function toUser(profile: ProfileRow): User {
  const wallet = cache.wallets.find((w) => w.user_id === profile.id);
  const ownedIds = [
    ...cache.posts.filter((p) => p.author_id === profile.id).map((p) => p.id),
    ...cache.pyes.filter((p) => p.author_id === profile.id).map((p) => p.id),
  ];
  return {
    id: profile.id,
    username: profile.username,
    fullName: profile.full_name || profile.username,
    email: profile.email ?? "",
    phone: profile.phone ?? undefined,
    gender: (profile.gender as User["gender"]) ?? undefined,
    birthDate: profile.birth_date ?? undefined,
    avatar: profile.avatar ?? "",
    banner: profile.banner ?? undefined,
    bio: profile.bio ?? "",
    isVerified: profile.is_verified,
    pieId: profile.pie_id,
    role: profile.role as User["role"],
    isBusiness: profile.is_business,
    businessProfile: (profile.business_profile as BusinessProfile | null) ?? undefined,
    followersCount: cache.follows.filter((f) => f.following_id === profile.id).length,
    followingCount: cache.follows.filter((f) => f.follower_id === profile.id).length,
    likesCount: cache.likes.filter((l) => ownedIds.includes(l.target_id)).length,
    postsCount: cache.posts.filter((p) => p.author_id === profile.id).length,
    shortsCount: cache.pyes.filter((p) => p.author_id === profile.id).length,
    silverCoins: wallet?.silver_coins ?? 0,
    goldCoins: wallet?.gold_coins ?? 0,
    privacySettings: {
      ...DEFAULT_PRIVACY,
      ...((profile.privacy_settings as Partial<User["privacySettings"]>) ?? {}),
    },
    createdAt: profile.created_at,
    isDeactivated: profile.is_deactivated,
  };
}

function authorStub(userId: string): Post["author"] {
  const profile = cache.profiles.find((p) => p.id === userId);
  return {
    id: userId,
    username: profile?.username ?? "unknown",
    fullName: profile?.full_name || profile?.username || "PYE user",
    avatar: profile?.avatar ?? "",
    isVerified: profile?.is_verified ?? false,
  };
}

function isSaved(targetId: string, type: string): boolean {
  const uid = cache.currentUserId;
  if (!uid) return false;
  return cache.saves.some(
    (s) => s.user_id === uid && s.target_id === targetId && normaliseTargetType(s.target_type) === normaliseTargetType(type),
  );
}

function isLikedBy(targetId: string): boolean {
  const uid = cache.currentUserId;
  if (!uid) return false;
  return cache.likes.some((l) => l.user_id === uid && l.target_id === targetId);
}

function toPost(row: PostRow): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    author: authorStub(row.author_id),
    caption: row.caption,
    mediaUrl: row.media_url ?? undefined,
    mediaType: (row.media_type as Post["mediaType"]) ?? undefined,
    hashtags: row.hashtags ?? [],
    spaceSlug: row.space_slug ?? undefined,
    likesCount: countLikes(row.id),
    commentsCount: countComments(row.id),
    sharesCount: row.shares_count,
    isLiked: isLikedBy(row.id),
    isSaved: isSaved(row.id, "post"),
    createdAt: row.created_at,
  };
}

function toPyes(row: PyesRow): PyesVideo {
  return {
    id: row.id,
    authorId: row.author_id,
    author: authorStub(row.author_id),
    title: row.title ?? undefined,
    caption: row.caption,
    videoUrl: row.video_url,
    posterUrl: row.poster_url,
    musicTitle: row.music_title ?? undefined,
    musicAuthor: row.music_author ?? undefined,
    hashtags: row.hashtags ?? [],
    spaceSlug: row.space_slug ?? undefined,
    likesCount: countLikes(row.id),
    commentsCount: countComments(row.id),
    sharesCount: row.shares_count,
    viewsCount: row.views_count,
    savesCount: cache.saves.filter((s) => s.target_id === row.id).length,
    visibility: (row.visibility as PyesVideo["visibility"]) ?? "public",
    moderationStatus: (row.moderation_status as PyesVideo["moderationStatus"]) ?? "approved",
    isLiked: isLikedBy(row.id),
    isSaved: isSaved(row.id, "pyes"),
    createdAt: row.created_at,
  };
}

function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    targetId: row.target_id,
    targetType: normaliseTargetType(row.target_type) as Comment["targetType"],
    author: authorStub(row.author_id),
    text: row.text,
    likesCount: countLikes(row.id, "comment"),
    isLiked: isLikedBy(row.id),
    createdAt: row.created_at,
  };
}

function toSound(row: SoundRow): SoundTrack {
  const profile = row.author_id ? cache.profiles.find((p) => p.id === row.author_id) : undefined;
  return {
    id: row.id,
    title: row.title,
    artist: row.artist || profile?.username || "PYE",
    authorId: row.author_id ?? undefined,
    authorAvatar: profile?.avatar ?? undefined,
    audioUrl: row.audio_url,
    coverUrl: row.cover_url,
    duration: row.duration,
    category: row.category,
    playsCount: row.plays_count,
    likesCount: countLikes(row.id, "sound"),
    usageCount: row.usage_count,
    tags: row.tags ?? [],
    isLiked: isLikedBy(row.id),
    isSaved: isSaved(row.id, "sound"),
    createdAt: row.created_at,
  };
}

function toConference(row: ConferenceRow): Conference {
  const participants = cache.conferenceParticipants.filter((p) => p.conference_id === row.id);
  return {
    id: row.id,
    hostId: row.host_id,
    host: authorStub(row.host_id),
    title: row.title,
    description: row.description,
    coverImage: row.cover_image,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    maxParticipants: row.max_participants,
    currentParticipants: participants.length,
    participantIds: participants.map((p) => p.user_id),
    isJoined: !!cache.currentUserId && participants.some((p) => p.user_id === cache.currentUserId),
    privacy: (row.privacy as Conference["privacy"]) ?? "public",
    speakers: row.speakers ?? [],
    category: row.category,
    sponsoredBy: row.sponsored_by ?? undefined,
    createdAt: row.created_at,
  };
}

function generatePieId(): string {
  return `PYE-${Math.random().toString(36).slice(2, 7).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

// ================================================================ service
class StorageService {
  // ------------------------------------------------------------- lifecycle
  public init(): void {
    /* Hydration is handled by the data provider; kept for compatibility. */
  }

  // ------------------------------------------------------------- users
  public getCurrentUser(): User | null {
    if (!cache.currentUserId) return null;
    const profile = cache.profiles.find((p) => p.id === cache.currentUserId);
    return profile ? toUser(profile) : null;
  }

  public setCurrentUser(_user: User | null): void {
    /* Session is owned by the auth service. */
  }

  public getUsers(): User[] {
    return cache.profiles.filter((p) => !p.is_deactivated).map(toUser);
  }

  public getAllUsers(): User[] {
    return cache.profiles.map(toUser);
  }

  public getUserById(id: string): User | undefined {
    const profile = cache.profiles.find((p) => p.id === id);
    return profile ? toUser(profile) : undefined;
  }

  public getUserByUsername(username: string): User | undefined {
    const clean = username.replace(/^@/, "").toLowerCase();
    const profile = cache.profiles.find((p) => p.username.toLowerCase() === clean);
    return profile ? toUser(profile) : undefined;
  }

  public checkUsernameAvailability(username: string): { available: boolean; suggestions: string[] } {
    const clean = username.replace(/^@/, "").toLowerCase().trim();
    if (!clean) return { available: false, suggestions: [] };
    const taken = cache.profiles.some((p) => p.username.toLowerCase() === clean);
    if (!taken) return { available: true, suggestions: [] };
    const suggestions = [
      `${clean}${Math.floor(Math.random() * 90 + 10)}`,
      `${clean}_pye`,
      `the${clean}`,
      `${clean}${new Date().getFullYear()}`,
    ].filter((s) => !cache.profiles.some((p) => p.username.toLowerCase() === s));
    return { available: false, suggestions: suggestions.slice(0, 3) };
  }

  public async register(data: {
    username: string;
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    gender?: User["gender"];
    birthDate?: string;
    avatar?: string;
  }): Promise<{ ok: boolean; user?: User; error?: string; needsEmailConfirmation?: boolean }> {
    const username = data.username.replace(/^@/, "").trim();
    const email = data.email.trim().toLowerCase();
    if (!username || !email || !data.password) {
      return { ok: false, error: "Username, email and password are required." };
    }
    if (data.password.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters." };
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .maybeSingle();
    if (existing) return { ok: false, error: "That username is already taken." };

    const { data: signUp, error } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });

    if (error) {
      const message = /already registered/i.test(error.message)
        ? "An account with this email already exists. Please log in instead."
        : error.message;
      return { ok: false, error: message };
    }

    const userId = signUp.user?.id;
    if (!userId) return { ok: false, error: "Could not create your account. Please try again." };

    if (!signUp.session) {
      // Email confirmation required: the profile is created on first sign-in.
      writeLocal(`pye_pending_profile_${userId}`, {
        username,
        fullName: data.fullName || username,
        email,
        phone: data.phone ?? null,
        gender: data.gender ?? null,
        birthDate: data.birthDate ?? null,
        avatar: data.avatar ?? "",
      });
      return {
        ok: false,
        needsEmailConfirmation: true,
        error: "Almost there — confirm your email address, then log in to claim your welcome coins.",
      };
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      username,
      full_name: data.fullName || username,
      email,
      phone: data.phone ?? null,
      gender: data.gender ?? null,
      birth_date: data.birthDate ?? null,
      avatar: data.avatar ?? "",
      bio: "",
      pie_id: generatePieId(),
    });
    if (profileError) {
      return { ok: false, error: "Your account was created but the profile could not be saved. Please log in." };
    }

    await setSessionUser(userId);
    startRealtime();
    const user = this.getCurrentUser();
    return user ? { ok: true, user } : { ok: false, error: "Profile could not be loaded." };
  }

  /** Creates the profile row for users who confirmed their email after signup. */
  public async ensureProfile(userId: string, email: string): Promise<void> {
    const { data: existing } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
    if (existing) return;
    const pending = readLocal<{
      username?: string;
      fullName?: string;
      phone?: string | null;
      gender?: string | null;
      birthDate?: string | null;
      avatar?: string;
    } | null>(`pye_pending_profile_${userId}`, null);

    const base = (pending?.username || email.split("@")[0] || "pyer").replace(/[^a-zA-Z0-9_.]/g, "").toLowerCase();
    let username = base;
    for (let i = 0; i < 5; i += 1) {
      const { data: taken } = await supabase.from("profiles").select("id").ilike("username", username).maybeSingle();
      if (!taken) break;
      username = `${base}${Math.floor(Math.random() * 9000 + 100)}`;
    }

    await supabase.from("profiles").insert({
      id: userId,
      username,
      full_name: pending?.fullName || username,
      email,
      phone: pending?.phone ?? null,
      gender: pending?.gender ?? null,
      birth_date: pending?.birthDate ?? null,
      avatar: pending?.avatar ?? "",
      bio: "",
      pie_id: generatePieId(),
    });

    if (typeof localStorage !== "undefined") localStorage.removeItem(`pye_pending_profile_${userId}`);
  }

  public async login(
    usernameOrEmail: string,
    password?: string,
  ): Promise<{ ok: boolean; user?: User; error?: string; code?: string }> {
    const clean = usernameOrEmail.replace(/^@/, "").trim().toLowerCase();
    if (!clean) return { ok: false, error: "Please enter your email address." };
    if (!clean.includes("@")) {
      return { ok: false, error: "Please log in with the email address you signed up with." };
    }
    if (!password) return { ok: false, error: "Please enter your password." };

    const { data, error } = await supabase.auth.signInWithPassword({ email: clean, password });
    if (error) {
      const message = /email not confirmed/i.test(error.message)
        ? "Please confirm your email address first — check your inbox for the PYE confirmation link."
        : /invalid login credentials/i.test(error.message)
          ? "Incorrect email or password. Please verify and try again."
          : error.message;
      return { ok: false, error: message };
    }

    const userId = data.user?.id;
    if (!userId) return { ok: false, error: "Could not sign you in. Please try again." };

    await this.ensureProfile(userId, data.user?.email ?? clean);
    await setSessionUser(userId);
    startRealtime();

    const user = this.getCurrentUser();
    if (!user) return { ok: false, error: "Your profile could not be loaded." };
    if (user.isDeactivated) {
      await supabase.auth.signOut();
      await setSessionUser(null);
      return { ok: false, error: "This account has been deactivated.", code: "deactivated" };
    }
    return { ok: true, user };
  }

  public logout(): void {
    stopRealtime();
    persist("logout", async () => {
      await supabase.auth.signOut();
      await setSessionUser(null);
      return undefined;
    });
    cache.currentUserId = null;
    emit();
  }

  public updateProfile(updates: Partial<User>): User | null {
    const uid = cache.currentUserId;
    if (!uid) return null;
    const index = cache.profiles.findIndex((p) => p.id === uid);
    if (index === -1) return null;

    const row = cache.profiles[index];
    const patch: Record<string, unknown> = {};
    if (updates.username !== undefined) patch["username"] = updates.username.replace(/^@/, "").trim();
    if (updates.fullName !== undefined) patch["full_name"] = updates.fullName;
    if (updates.bio !== undefined) patch["bio"] = updates.bio;
    if (updates.avatar !== undefined) patch["avatar"] = updates.avatar;
    if (updates.banner !== undefined) patch["banner"] = updates.banner;
    if (updates.phone !== undefined) patch["phone"] = updates.phone;
    if (updates.gender !== undefined) patch["gender"] = updates.gender;
    if (updates.birthDate !== undefined) patch["birth_date"] = updates.birthDate;
    if (updates.isBusiness !== undefined) patch["is_business"] = updates.isBusiness;
    if (updates.businessProfile !== undefined) patch["business_profile"] = updates.businessProfile;
    if (updates.privacySettings !== undefined) {
      patch["privacy_settings"] = {
        ...DEFAULT_PRIVACY,
        ...((row.privacy_settings ?? {}) as Record<string, unknown>),
        ...updates.privacySettings,
      };
    }
    if (Object.keys(patch).length === 0) return toUser(row);

    cache.profiles[index] = { ...row, ...patch } as ProfileRow;
    emit();

    persist("updateProfile", () => supabase.from("profiles").update(patch as never).eq("id", uid));
    return toUser(cache.profiles[index]);
  }

  public updatePrivacySettings(settings: Partial<User["privacySettings"]>): User | null {
    return this.updateProfile({ privacySettings: settings as User["privacySettings"] });
  }

  // ------------------------------------------------------------- follows
  public getFollows(): FollowRelationship[] {
    return cache.follows.map((f) => ({
      id: f.id,
      followerId: f.follower_id,
      followingId: f.following_id,
      createdAt: f.created_at,
    }));
  }

  public isFollowing(userId: string): boolean {
    const uid = cache.currentUserId;
    if (!uid) return false;
    return cache.follows.some((f) => f.follower_id === uid && f.following_id === userId);
  }

  public getFollowing(userId: string): FollowRelationship[] {
    return this.getFollows().filter((f) => f.followerId === userId);
  }

  public toggleFollow(targetUserId: string): boolean {
    const uid = cache.currentUserId;
    if (!uid || uid === targetUserId) return false;

    const existing = cache.follows.find((f) => f.follower_id === uid && f.following_id === targetUserId);
    if (existing) {
      cache.follows = cache.follows.filter((f) => f.id !== existing.id);
      emit();
      persist("unfollow", () =>
        supabase.from("follows").delete().eq("follower_id", uid).eq("following_id", targetUserId),
      );
      return false;
    }

    cache.follows = [
      ...cache.follows,
      { id: newId(), follower_id: uid, following_id: targetUserId, created_at: nowIso() },
    ];
    emit();
    persist("follow", async () => {
      const res = await supabase.from("follows").insert({ follower_id: uid, following_id: targetUserId });
      if (!res.error) {
        await supabase.from("notifications").insert({
          user_id: targetUserId,
          type: "follow",
          actor_id: uid,
          content: "started following you",
        });
      }
      return res;
    });
    return true;
  }

  // ------------------------------------------------------------- likes
  public getLikes(): LikeRelationship[] {
    return cache.likes.map((l) => ({
      id: l.id,
      userId: l.user_id,
      targetId: l.target_id,
      targetType: normaliseTargetType(l.target_type) as LikeRelationship["targetType"],
      createdAt: l.created_at,
    }));
  }

  public isLiked(targetId: string): boolean {
    return isLikedBy(targetId);
  }

  public toggleLike(targetId: string, targetType: LikeRelationship["targetType"]): { isLiked: boolean; likesCount: number } {
    const uid = cache.currentUserId;
    if (!uid) return { isLiked: false, likesCount: this.countLikes(targetId, targetType) };
    const type = normaliseTargetType(targetType);

    const existing = cache.likes.find(
      (l) => l.user_id === uid && l.target_id === targetId && normaliseTargetType(l.target_type) === type,
    );
    if (existing) {
      cache.likes = cache.likes.filter((l) => l.id !== existing.id);
      emit();
      persist("unlike", () =>
        supabase.from("likes").delete().eq("user_id", uid).eq("target_id", targetId).eq("target_type", type),
      );
      return { isLiked: false, likesCount: this.countLikes(targetId, targetType) };
    }

    cache.likes = [
      ...cache.likes,
      { id: newId(), user_id: uid, target_id: targetId, target_type: type, created_at: nowIso() },
    ];
    emit();

    const ownerId = this.resolveOwner(targetId, type);
    persist("like", async () => {
      const res = await supabase.from("likes").insert({ user_id: uid, target_id: targetId, target_type: type });
      if (!res.error && ownerId && ownerId !== uid) {
        await supabase.from("notifications").insert({
          user_id: ownerId,
          type: "like",
          actor_id: uid,
          content: type === "comment" ? "liked your comment" : "liked your content",
          target_id: targetId,
          target_type: type,
        });
      }
      return res;
    });
    return { isLiked: true, likesCount: this.countLikes(targetId, targetType) };
  }

  private countLikes(targetId: string, targetType: LikeRelationship["targetType"]): number {
    const type = normaliseTargetType(targetType);
    return cache.likes.filter((l) => l.target_id === targetId && normaliseTargetType(l.target_type) === type).length;
  }

  private resolveOwner(targetId: string, type: string): string | null {
    if (type === "post") return cache.posts.find((p) => p.id === targetId)?.author_id ?? null;
    if (type === "pyes") return cache.pyes.find((p) => p.id === targetId)?.author_id ?? null;
    if (type === "comment") return cache.comments.find((c) => c.id === targetId)?.author_id ?? null;
    if (type === "sound") return cache.sounds.find((s) => s.id === targetId)?.author_id ?? null;
    return null;
  }

  // ------------------------------------------------------------- posts
  public getPosts(): Post[] {
    return cache.posts.map(toPost);
  }

  public addPost(
    post: Omit<Post, "id" | "createdAt" | "likesCount" | "commentsCount" | "sharesCount">,
  ): Post {
    const uid = cache.currentUserId;
    const id = newId();
    const row: PostRow = {
      id,
      author_id: uid ?? post.authorId,
      caption: post.caption ?? "",
      media_url: post.mediaUrl ?? null,
      media_type: post.mediaType ?? null,
      hashtags: post.hashtags ?? [],
      space_slug: post.spaceSlug ?? null,
      shares_count: 0,
      created_at: nowIso(),
    };
    cache.posts = [row, ...cache.posts];
    emit();

    if (uid) {
      persist("addPost", async () => {
        const res = await supabase
          .from("posts")
          .insert({
            author_id: uid,
            caption: row.caption,
            media_url: row.media_url,
            media_type: row.media_type,
            hashtags: row.hashtags,
            space_slug: row.space_slug,
          })
          .select()
          .single();
        if (res.data) {
          cache.posts = cache.posts.map((p) => (p.id === id ? res.data : p));
          emit();
        }
        return res;
      });
    }
    return toPost(row);
  }

  public deletePost(postId: string): void {
    cache.posts = cache.posts.filter((p) => p.id !== postId);
    emit();
    persist("deletePost", () => supabase.from("posts").delete().eq("id", postId));
  }

  public isPostSaved(postId: string): boolean {
    return isSaved(postId, "post");
  }

  public togglePostSave(postId: string): boolean {
    return this.toggleSave(postId, "post");
  }

  private toggleSave(targetId: string, type: string): boolean {
    const uid = cache.currentUserId;
    if (!uid) return false;
    const existing = cache.saves.find(
      (s) => s.user_id === uid && s.target_id === targetId && normaliseTargetType(s.target_type) === type,
    );
    if (existing) {
      cache.saves = cache.saves.filter((s) => s.id !== existing.id);
      emit();
      persist("unsave", () =>
        supabase.from("saves").delete().eq("user_id", uid).eq("target_id", targetId).eq("target_type", type),
      );
      return false;
    }
    cache.saves = [
      ...cache.saves,
      { id: newId(), user_id: uid, target_id: targetId, target_type: type, created_at: nowIso() },
    ];
    emit();
    persist("save", () => supabase.from("saves").insert({ user_id: uid, target_id: targetId, target_type: type }));
    return true;
  }

  // ------------------------------------------------------------- PYES
  public getPyes(filter?: "foryou" | "following" | "discover"): PyesVideo[] {
    const uid = cache.currentUserId;
    let rows = cache.pyes.filter((row) => {
      if (row.author_id === uid) return true;
      if (row.visibility === "private") return false;
      if (row.visibility === "followers") {
        return !!uid && cache.follows.some((f) => f.follower_id === uid && f.following_id === row.author_id);
      }
      return true;
    });

    if (filter === "following" && uid) {
      const following = cache.follows.filter((f) => f.follower_id === uid).map((f) => f.following_id);
      rows = rows.filter((r) => following.includes(r.author_id));
    }
    const list = rows.map(toPyes);
    if (filter === "discover") {
      return [...list].sort((a, b) => b.viewsCount + b.likesCount - (a.viewsCount + a.likesCount));
    }
    return list;
  }

  public getShorts(filter?: "foryou" | "following" | "discover"): PyesVideo[] {
    return this.getPyes(filter);
  }

  public addPyes(
    pyes: Omit<PyesVideo, "id" | "createdAt" | "likesCount" | "commentsCount" | "sharesCount" | "viewsCount">,
  ): PyesVideo {
    const uid = cache.currentUserId;
    const id = newId();
    const row: PyesRow = {
      id,
      author_id: uid ?? pyes.authorId,
      title: pyes.title ?? null,
      caption: pyes.caption ?? "",
      video_url: pyes.videoUrl,
      poster_url: pyes.posterUrl ?? "",
      music_title: pyes.musicTitle ?? null,
      music_author: pyes.musicAuthor ?? null,
      sound_id: null,
      hashtags: pyes.hashtags ?? [],
      space_slug: pyes.spaceSlug ?? null,
      views_count: 0,
      shares_count: 0,
      visibility: pyes.visibility ?? "public",
      moderation_status: pyes.moderationStatus ?? "approved",
      created_at: nowIso(),
    };
    cache.pyes = [row, ...cache.pyes];
    emit();

    if (uid) {
      persist("addPyes", async () => {
        const res = await supabase
          .from("pyes")
          .insert({
            author_id: uid,
            title: row.title,
            caption: row.caption,
            video_url: row.video_url,
            poster_url: row.poster_url,
            music_title: row.music_title,
            music_author: row.music_author,
            hashtags: row.hashtags,
            space_slug: row.space_slug,
            visibility: row.visibility,
          })
          .select()
          .single();
        if (res.data) {
          cache.pyes = cache.pyes.map((p) => (p.id === id ? res.data : p));
          emit();
        }
        return res;
      });
    }
    return toPyes(row);
  }

  public deletePyes(pyesId: string): void {
    cache.pyes = cache.pyes.filter((p) => p.id !== pyesId);
    emit();
    persist("deletePyes", () => supabase.from("pyes").delete().eq("id", pyesId));
  }

  public recordPyesShare(pyesId: string): void {
    const index = cache.pyes.findIndex((p) => p.id === pyesId);
    if (index === -1) return;
    cache.pyes[index] = { ...cache.pyes[index], shares_count: cache.pyes[index].shares_count + 1 };
    emit();
    persist("sharePyes", () => supabase.rpc("increment_pyes_shares", { _pyes_id: pyesId }));
  }

  public recordPyesView(pyesId: string): void {
    persist("viewPyes", () => supabase.rpc("increment_pyes_views", { _pyes_id: pyesId }));
  }

  public togglePyesSave(pyesId: string): boolean {
    return this.toggleSave(pyesId, "pyes");
  }

  public isPyesSaved(pyesId: string): boolean {
    return isSaved(pyesId, "pyes");
  }

  // ------------------------------------------------------------- comments
  public getAllComments(): Comment[] {
    return cache.comments.map(toComment);
  }

  public getComments(targetId: string): Comment[] {
    return cache.comments
      .filter((c) => c.target_id === targetId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .map(toComment);
  }

  public addComment(targetId: string, text: string, targetType: Comment["targetType"]): Comment | null {
    const uid = cache.currentUserId;
    if (!uid || !text.trim()) return null;
    const type = normaliseTargetType(targetType);
    const id = newId();
    const row: CommentRow = {
      id,
      target_id: targetId,
      target_type: type,
      author_id: uid,
      text: text.trim(),
      created_at: nowIso(),
    };
    cache.comments = [row, ...cache.comments];
    emit();

    const ownerId = this.resolveOwner(targetId, type);
    persist("addComment", async () => {
      const res = await supabase
        .from("comments")
        .insert({ target_id: targetId, target_type: type, author_id: uid, text: row.text })
        .select()
        .single();
      if (res.data) {
        cache.comments = cache.comments.map((c) => (c.id === id ? res.data : c));
        emit();
      }
      if (!res.error && ownerId && ownerId !== uid) {
        await supabase.from("notifications").insert({
          user_id: ownerId,
          type: "comment",
          actor_id: uid,
          content: "commented on your content",
          target_id: targetId,
          target_type: type,
        });
      }
      return res;
    });
    return toComment(row);
  }

  public deleteComment(commentId: string): void {
    cache.comments = cache.comments.filter((c) => c.id !== commentId);
    emit();
    persist("deleteComment", () => supabase.from("comments").delete().eq("id", commentId));
  }

  // ------------------------------------------------------------- spaces
  public getSpaces(): PyeSpace[] {
    return PYE_SPACES;
  }

  // ------------------------------------------------------------- conferences
  public getConferences(): Conference[] {
    return cache.conferences.map(toConference);
  }

  public createConference(conf: Omit<Conference, "id" | "currentParticipants" | "createdAt">): Conference {
    const uid = cache.currentUserId;
    const id = newId();
    const row: ConferenceRow = {
      id,
      host_id: uid ?? conf.hostId,
      title: conf.title,
      description: conf.description ?? "",
      cover_image: conf.coverImage ?? "",
      scheduled_date: conf.scheduledDate ?? "",
      scheduled_time: conf.scheduledTime ?? "",
      max_participants: conf.maxParticipants ?? 100,
      privacy: conf.privacy ?? "public",
      speakers: conf.speakers ?? [],
      category: conf.category ?? "General",
      sponsored_by: conf.sponsoredBy ?? null,
      created_at: nowIso(),
    };
    cache.conferences = [row, ...cache.conferences];
    emit();

    if (uid) {
      persist("createConference", async () => {
        const res = await supabase
          .from("conferences")
          .insert({
            host_id: uid,
            title: row.title,
            description: row.description,
            cover_image: row.cover_image,
            scheduled_date: row.scheduled_date,
            scheduled_time: row.scheduled_time,
            max_participants: row.max_participants,
            privacy: row.privacy,
            speakers: row.speakers,
            category: row.category,
          })
          .select()
          .single();
        if (res.data) {
          cache.conferences = cache.conferences.map((c) => (c.id === id ? res.data : c));
          await supabase.from("conference_participants").insert({ conference_id: res.data.id, user_id: uid });
          cache.conferenceParticipants = [
            ...cache.conferenceParticipants,
            { id: newId(), conference_id: res.data.id, user_id: uid, joined_at: nowIso() },
          ];
          emit();
        }
        return res;
      });
    }
    return toConference(row);
  }

  public toggleJoinConference(confId: string): boolean {
    const uid = cache.currentUserId;
    if (!uid) return false;
    const existing = cache.conferenceParticipants.find((p) => p.conference_id === confId && p.user_id === uid);
    if (existing) {
      cache.conferenceParticipants = cache.conferenceParticipants.filter((p) => p.id !== existing.id);
      emit();
      persist("leaveConference", () =>
        supabase.from("conference_participants").delete().eq("conference_id", confId).eq("user_id", uid),
      );
      return false;
    }
    cache.conferenceParticipants = [
      ...cache.conferenceParticipants,
      { id: newId(), conference_id: confId, user_id: uid, joined_at: nowIso() },
    ];
    emit();
    persist("joinConference", () =>
      supabase.from("conference_participants").insert({ conference_id: confId, user_id: uid }),
    );
    return true;
  }

  // ------------------------------------------------------------- missions
  public getDailyMissions(): DailyMission[] {
    const today = new Date().toISOString().slice(0, 10);
    const stored = readLocal<{ date: string; missions: DailyMission[] } | null>(LOCAL_MISSIONS, null);
    if (!stored || stored.date !== today) {
      const fresh = DEFAULT_MISSIONS.map((m) => ({ ...m }));
      writeLocal(LOCAL_MISSIONS, { date: today, missions: fresh });
      return fresh;
    }
    return stored.missions;
  }

  private saveMissions(missions: DailyMission[]): void {
    writeLocal(LOCAL_MISSIONS, { date: new Date().toISOString().slice(0, 10), missions });
  }

  public recordMissionProgress(missionId: string, delta = 1): void {
    const missions = this.getDailyMissions();
    const mission = missions.find((m) => m.id === missionId);
    if (!mission || mission.isCompleted) return;
    mission.progress = Math.min(mission.target, mission.progress + delta);
    if (mission.progress >= mission.target) mission.isCompleted = true;
    this.saveMissions(missions);
  }

  public claimMissionReward(missionId: string): { ok: boolean; silver: number; gold: number; message: string } {
    const uid = cache.currentUserId;
    if (!uid) return { ok: false, silver: 0, gold: 0, message: "Please log in to claim reward" };

    const missions = this.getDailyMissions();
    const mission = missions.find((m) => m.id === missionId);
    if (!mission || !mission.isCompleted || mission.isClaimed) {
      return { ok: false, silver: 0, gold: 0, message: "Mission reward is not available to claim" };
    }
    mission.isClaimed = true;
    this.saveMissions(missions);

    const walletIndex = cache.wallets.findIndex((w) => w.user_id === uid);
    if (walletIndex !== -1) {
      cache.wallets[walletIndex] = {
        ...cache.wallets[walletIndex],
        silver_coins: cache.wallets[walletIndex].silver_coins + mission.rewardSilver,
        gold_coins: cache.wallets[walletIndex].gold_coins + mission.rewardGold,
      };
      emit();
    }

    persist("claimMission", async () => {
      const res = await supabase.rpc("claim_mission_reward", { _mission_id: missionId });
      await this.refreshWallet();
      return res;
    });

    return {
      ok: true,
      silver: mission.rewardSilver,
      gold: mission.rewardGold,
      message: `Claimed +${mission.rewardSilver} SPC${mission.rewardGold > 0 ? ` and +${mission.rewardGold} GPC` : ""}!`,
    };
  }

  public claimDailyReward(): { ok: boolean; message: string; silver?: number; gold?: number } {
    const res = this.claimMissionReward("checkin");
    return { ok: res.ok, message: res.message, silver: res.silver, gold: res.gold };
  }

  private async refreshWallet(): Promise<void> {
    const uid = cache.currentUserId;
    if (!uid) return;
    const [wallet, txs] = await Promise.all([
      supabase.from("wallets").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("coin_transactions").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(200),
    ]);
    if (wallet.data) {
      cache.wallets = [...cache.wallets.filter((w) => w.user_id !== uid), wallet.data];
    }
    if (txs.data) cache.transactions = txs.data;
    emit();
  }

  // ------------------------------------------------------------- sounds
  public getSounds(filter?: "trending" | "new" | "yours" | "saved"): SoundTrack[] {
    const uid = cache.currentUserId;
    let list = cache.sounds.map(toSound);
    if (filter === "yours") list = list.filter((s) => uid && s.authorId === uid);
    if (filter === "saved") list = list.filter((s) => s.isSaved);
    if (filter === "new") list = [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (filter === "trending" || !filter) {
      list = [...list].sort((a, b) => b.playsCount + b.usageCount - (a.playsCount + a.usageCount));
    }
    return list;
  }

  public getSavedSoundIds(): string[] {
    const uid = cache.currentUserId;
    if (!uid) return [];
    return cache.saves.filter((s) => s.user_id === uid && s.target_type === "sound").map((s) => s.target_id);
  }

  public toggleSaveSound(soundId: string): boolean {
    return this.toggleSave(soundId, "sound");
  }

  public isSoundSaved(soundId: string): boolean {
    return isSaved(soundId, "sound");
  }

  public addSound(
    sound: Omit<SoundTrack, "id" | "createdAt" | "playsCount" | "likesCount" | "usageCount">,
  ): SoundTrack {
    const uid = cache.currentUserId;
    const id = newId();
    const row: SoundRow = {
      id,
      title: sound.title,
      artist: sound.artist ?? "",
      author_id: uid ?? sound.authorId ?? null,
      audio_url: sound.audioUrl,
      cover_url: sound.coverUrl ?? "",
      duration: sound.duration ?? "0:00",
      category: sound.category ?? "Original",
      plays_count: 0,
      usage_count: 0,
      tags: sound.tags ?? [],
      created_at: nowIso(),
    };
    cache.sounds = [row, ...cache.sounds];
    emit();

    if (uid) {
      persist("addSound", async () => {
        const res = await supabase
          .from("sounds")
          .insert({
            title: row.title,
            artist: row.artist,
            author_id: uid,
            audio_url: row.audio_url,
            cover_url: row.cover_url,
            duration: row.duration,
            category: row.category,
            tags: row.tags,
          })
          .select()
          .single();
        if (res.data) {
          cache.sounds = cache.sounds.map((s) => (s.id === id ? res.data : s));
          emit();
        }
        return res;
      });
    }
    return toSound(row);
  }

  public incrementSoundPlays(soundId: string): void {
    const index = cache.sounds.findIndex((s) => s.id === soundId);
    if (index === -1) return;
    cache.sounds[index] = { ...cache.sounds[index], plays_count: cache.sounds[index].plays_count + 1 };
    emit();
    persist("soundPlay", () => supabase.rpc("increment_sound_plays", { _sound_id: soundId }));
  }

  public incrementSoundUsage(soundId: string): void {
    const index = cache.sounds.findIndex((s) => s.id === soundId);
    if (index === -1) return;
    cache.sounds[index] = { ...cache.sounds[index], usage_count: cache.sounds[index].usage_count + 1 };
    emit();
    persist("soundUsage", () => supabase.rpc("increment_sound_usage", { _sound_id: soundId }));
  }

  // ------------------------------------------------------------- wallet
  public getTransactions(userId?: string): CoinTransaction[] {
    const uid = userId ?? cache.currentUserId;
    if (!uid) return [];
    return cache.transactions
      .filter((t) => t.user_id === uid)
      .map((t) => ({
        id: t.id,
        userId: t.user_id,
        currency: t.currency as CoinTransaction["currency"],
        type: t.type as CoinTransaction["type"],
        amount: t.amount,
        reason: t.reason,
        timestamp: t.created_at,
        status: t.status as CoinTransaction["status"],
      }));
  }

  public sendGift(targetUserId: string, currency: "silver" | "gold", amount: number, note?: string): boolean {
    const uid = cache.currentUserId;
    if (!uid) return false;
    const wallet = cache.wallets.find((w) => w.user_id === uid);
    const balance = currency === "gold" ? (wallet?.gold_coins ?? 0) : (wallet?.silver_coins ?? 0);
    if (!wallet || balance < amount || amount <= 0) return false;

    cache.wallets = cache.wallets.map((w) =>
      w.user_id === uid
        ? {
            ...w,
            silver_coins: currency === "silver" ? w.silver_coins - amount : w.silver_coins,
            gold_coins: currency === "gold" ? w.gold_coins - amount : w.gold_coins,
          }
        : w,
    );
    emit();

    persist("sendGift", async () => {
      const res = await supabase.rpc("send_coins", {
        _recipient: targetUserId,
        _currency: currency,
        _amount: amount,
        _reason: note ?? undefined,
      });
      await this.refreshWallet();
      return res;
    });
    return true;
  }

  public sendTip(targetUserId: string, currency: "silver" | "gold", amount: number, note?: string): boolean {
    return this.sendGift(targetUserId, currency, amount, note);
  }

  public getWallet(): { silverCoins: number; goldCoins: number } {
    const wallet = cache.wallets.find((w) => w.user_id === cache.currentUserId);
    return { silverCoins: wallet?.silver_coins ?? 0, goldCoins: wallet?.gold_coins ?? 0 };
  }

  // Payment methods stay local: PYE has no payment gateway connected yet.
  public getPaymentMethods(_userId?: string): PaymentMethodConfig[] {
    const uid = cache.currentUserId;
    if (!uid) return [];
    return readLocal<PaymentMethodConfig[]>(`${LOCAL_PAYMENT_METHODS}_${uid}`, []);
  }

  public addPaymentMethod(method: Omit<PaymentMethodConfig, "id" | "createdAt">): PaymentMethodConfig {
    const uid = cache.currentUserId;
    const entry: PaymentMethodConfig = { ...method, id: newId(), createdAt: nowIso() };
    if (uid) writeLocal(`${LOCAL_PAYMENT_METHODS}_${uid}`, [...this.getPaymentMethods(), entry]);
    emit();
    return entry;
  }

  public removePaymentMethod(methodId: string): void {
    const uid = cache.currentUserId;
    if (!uid) return;
    writeLocal(
      `${LOCAL_PAYMENT_METHODS}_${uid}`,
      this.getPaymentMethods().filter((m) => m.id !== methodId),
    );
    emit();
  }

  public getPaymentLedger(_userId?: string): PaymentLedgerEntry[] {
    return [];
  }

  public getCreatorAnalytics(userId: string) {
    const posts = cache.posts.filter((p) => p.author_id === userId);
    const pyes = cache.pyes.filter((p) => p.author_id === userId);
    const ownedIds = [...posts.map((p) => p.id), ...pyes.map((p) => p.id)];
    const totalLikes = cache.likes.filter((l) => ownedIds.includes(l.target_id)).length;
    const totalComments = cache.comments.filter((c) => ownedIds.includes(c.target_id)).length;
    const totalViews = pyes.reduce((sum, p) => sum + p.views_count, 0);
    const totalShares =
      pyes.reduce((sum, p) => sum + p.shares_count, 0) + posts.reduce((sum, p) => sum + p.shares_count, 0);
    const followers = cache.follows.filter((f) => f.following_id === userId).length;
    const earned = cache.transactions
      .filter((t) => t.user_id === userId && t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalPosts: posts.length,
      totalPyes: pyes.length,
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      followers,
      coinsEarned: earned,
      totalPyesViews: totalViews,
      totalSoundPlays: cache.sounds
        .filter((snd) => snd.author_id === userId)
        .reduce((sum, snd) => sum + (snd.plays_count ?? 0), 0),
      totalCoinTipsReceived: cache.transactions
        .filter((t) => t.user_id === userId && t.type === "credit" && /tip|gift/i.test(t.reason ?? ""))
        .reduce((sum, t) => sum + t.amount, 0),
      engagementRate:
        totalViews > 0 ? Number((((totalLikes + totalComments) / totalViews) * 100).toFixed(1)) : 0,
      topContent: [...pyes]
        .sort((a, b) => b.views_count - a.views_count)
        .slice(0, 5)
        .map(toPyes),
    };
  }

  // ------------------------------------------------------------- games
  public getGameRecords(userId?: string): GameScoreRecord[] {
    const uid = userId ?? cache.currentUserId;
    return cache.gameRecords
      .filter((r) => !uid || r.user_id === uid)
      .map((r) => ({
        id: r.id,
        userId: r.user_id,
        gameId: r.game_id,
        result: r.result as GameScoreRecord["result"],
        score: r.score,
        coinsEarned: r.coins_earned,
        opponentName: r.opponent_name,
        playedAt: r.played_at,
      }));
  }

  public recordGameOutcome(record: Omit<GameScoreRecord, "id" | "playedAt">): GameScoreRecord {
    const uid = cache.currentUserId;
    const reward = record.result === "win" ? 5 : record.result === "draw" ? 2 : 0;
    const entry: GameScoreRecord = {
      ...record,
      coinsEarned: reward,
      id: newId(),
      playedAt: nowIso(),
    };
    if (uid) {
      cache.gameRecords = [
        {
          id: entry.id,
          user_id: uid,
          game_id: entry.gameId,
          result: entry.result,
          score: entry.score,
          coins_earned: reward,
          opponent_name: entry.opponentName ?? "",
          played_at: entry.playedAt,
        },
        ...cache.gameRecords,
      ];
      if (reward > 0) {
        cache.wallets = cache.wallets.map((w) =>
          w.user_id === uid ? { ...w, silver_coins: w.silver_coins + reward } : w,
        );
      }
      emit();
      persist("gameOutcome", async () => {
        const res = await supabase.rpc("record_game_outcome", {
          _game_id: entry.gameId,
          _result: entry.result,
          _score: entry.score,
          _opponent_name: entry.opponentName ?? "",
        });
        await this.refreshWallet();
        return res;
      });
    }
    return entry;
  }

  public getRankings(category: RankingItem["category"] = "pulse"): RankingItem[] {
    const users = cache.profiles.filter((p) => !p.is_deactivated).map(toUser);
    const metric = (user: User): { value: number; label: string } => {
      switch (category) {
        case "creators":
          return { value: user.postsCount + user.shortsCount, label: "posts" };
        case "growth":
          return { value: user.followersCount, label: "followers" };
        case "coins":
          return { value: user.silverCoins + user.goldCoins * 100, label: "coins" };
        default:
          return { value: user.likesCount, label: "likes" };
      }
    };

    return users
      .map((user) => ({ user, ...metric(user) }))
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 50)
      .map((entry, index) => ({
        id: `rank_${entry.user.id}`,
        rank: index + 1,
        user: {
          id: entry.user.id,
          username: entry.user.username,
          fullName: entry.user.fullName,
          avatar: entry.user.avatar,
          isVerified: entry.user.isVerified,
          bio: entry.user.bio,
        },
        metricValue: entry.value,
        metricLabel: entry.label,
        category,
        trend: "neutral" as const,
      }));
  }

  // ------------------------------------------------------------- messages
  public getConversations(): Conversation[] {
    const uid = cache.currentUserId;
    if (!uid) return [];
    return cache.conversations
      .map((conv) => {
        const otherId = conv.user_a === uid ? conv.user_b : conv.user_a;
        const profile = cache.profiles.find((p) => p.id === otherId);
        const messages: DirectMessage[] = cache.messages
          .filter((m) => m.conversation_id === conv.id)
          .map((m) => ({
            id: m.id,
            senderId: m.sender_id,
            senderName:
              cache.profiles.find((p) => p.id === m.sender_id)?.full_name ??
              cache.profiles.find((p) => p.id === m.sender_id)?.username ??
              "PYE user",
            senderAvatar: cache.profiles.find((p) => p.id === m.sender_id)?.avatar ?? "",
            text: m.text,
            timestamp: m.created_at,
            isMine: m.sender_id === uid,
          }));
        return {
          id: conv.id,
          participant: {
            id: otherId,
            username: profile?.username ?? "unknown",
            fullName: profile?.full_name || profile?.username || "PYE user",
            avatar: profile?.avatar ?? "",
            isVerified: profile?.is_verified ?? false,
            isOnline: false,
          },
          lastMessage: conv.last_message,
          lastMessageTime: conv.last_message_at,
          unreadCount: cache.messages.filter(
            (m) => m.conversation_id === conv.id && m.sender_id !== uid && !m.read_at,
          ).length,
          messages,
        };
      })
      .sort((a, b) => (a.lastMessageTime < b.lastMessageTime ? 1 : -1));
  }

  public sendMessage(conversationId: string, text: string): Conversation | null {
    const uid = cache.currentUserId;
    if (!uid || !text.trim()) return null;
    const conv = cache.conversations.find((c) => c.id === conversationId);
    if (!conv) return null;

    const id = newId();
    cache.messages = [
      ...cache.messages,
      { id, conversation_id: conversationId, sender_id: uid, text: text.trim(), read_at: null, created_at: nowIso() },
    ];
    cache.conversations = cache.conversations.map((c) =>
      c.id === conversationId ? { ...c, last_message: text.trim(), last_message_at: nowIso() } : c,
    );
    emit();

    const otherId = conv.user_a === uid ? conv.user_b : conv.user_a;
    persist("sendMessage", async () => {
      const res = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: uid, text: text.trim() });
      if (!res.error) {
        await supabase
          .from("conversations")
          .update({ last_message: text.trim(), last_message_at: nowIso() })
          .eq("id", conversationId);
        await supabase
          .from("notifications")
          .insert({ user_id: otherId, type: "system", actor_id: uid, content: "sent you a message" });
      }
      return res;
    });

    return this.getConversations().find((c) => c.id === conversationId) ?? null;
  }

  public sendDirectMessage(recipientId: string, text: string): Conversation | null {
    const uid = cache.currentUserId;
    if (!uid || uid === recipientId) return null;
    const [a, b] = [uid, recipientId].sort();
    let conv = cache.conversations.find((c) => c.user_a === a && c.user_b === b);

    if (!conv) {
      const id = newId();
      conv = { id, user_a: a, user_b: b, last_message: "", last_message_at: nowIso(), created_at: nowIso() };
      cache.conversations = [...cache.conversations, conv];
      emit();

      const localId = id;
      persist("createConversation", async () => {
        const existing = await supabase
          .from("conversations")
          .select("*")
          .eq("user_a", a)
          .eq("user_b", b)
          .maybeSingle();
        let row = existing.data;
        if (!row) {
          const created = await supabase.from("conversations").insert({ user_a: a, user_b: b }).select().single();
          row = created.data;
          if (created.error) return created;
        }
        if (row) {
          cache.conversations = cache.conversations.map((c) => (c.id === localId ? row! : c));
          cache.messages = cache.messages.map((m) =>
            m.conversation_id === localId ? { ...m, conversation_id: row!.id } : m,
          );
          emit();
          if (text.trim()) {
            await supabase.from("messages").insert({ conversation_id: row.id, sender_id: uid, text: text.trim() });
            await supabase
              .from("conversations")
              .update({ last_message: text.trim(), last_message_at: nowIso() })
              .eq("id", row.id);
            await supabase
              .from("notifications")
              .insert({ user_id: recipientId, type: "system", actor_id: uid, content: "sent you a message" });
          }
        }
        return undefined;
      });

      if (text.trim()) {
        cache.messages = [
          ...cache.messages,
          {
            id: newId(),
            conversation_id: id,
            sender_id: uid,
            text: text.trim(),
            read_at: null,
            created_at: nowIso(),
          },
        ];
        cache.conversations = cache.conversations.map((c) =>
          c.id === id ? { ...c, last_message: text.trim(), last_message_at: nowIso() } : c,
        );
        emit();
      }
      return this.getConversations().find((c) => c.id === id) ?? null;
    }

    return text.trim() ? this.sendMessage(conv.id, text) : (this.getConversations().find((c) => c.id === conv!.id) ?? null);
  }

  public markConversationRead(conversationId: string): void {
    const uid = cache.currentUserId;
    if (!uid) return;
    const stamp = nowIso();
    let changed = false;
    cache.messages = cache.messages.map((m) => {
      if (m.conversation_id === conversationId && m.sender_id !== uid && !m.read_at) {
        changed = true;
        return { ...m, read_at: stamp };
      }
      return m;
    });
    if (!changed) return;
    emit();
    persist("markRead", () =>
      supabase
        .from("messages")
        .update({ read_at: stamp })
        .eq("conversation_id", conversationId)
        .neq("sender_id", uid)
        .is("read_at", null),
    );
  }

  // ------------------------------------------------------------- notifications
  public getNotifications(): NotificationItem[] {
    const uid = cache.currentUserId;
    if (!uid) return [];
    return cache.notifications
      .filter((n) => n.user_id === uid)
      .map((n) => {
        const actor = n.actor_id ? cache.profiles.find((p) => p.id === n.actor_id) : undefined;
        return {
          id: n.id,
          type: n.type as NotificationItem["type"],
          actor: {
            id: actor?.id ?? "pye",
            username: actor?.username ?? "pye",
            fullName: actor?.full_name || actor?.username || "PYE",
            avatar: actor?.avatar ?? "",
          },
          content: n.content,
          targetId: n.target_id ?? undefined,
          targetType: n.target_type ?? undefined,
          isRead: n.is_read,
          createdAt: n.created_at,
        };
      });
  }

  public markNotificationAsRead(id: string): void {
    cache.notifications = cache.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    emit();
    persist("readNotification", () => supabase.from("notifications").update({ is_read: true }).eq("id", id));
  }

  public markAllNotificationsAsRead(): void {
    const uid = cache.currentUserId;
    if (!uid) return;
    cache.notifications = cache.notifications.map((n) => ({ ...n, is_read: true }));
    emit();
    persist("readAllNotifications", () =>
      supabase.from("notifications").update({ is_read: true }).eq("user_id", uid).eq("is_read", false),
    );
  }

  public markNotificationsAsRead(): void {
    this.markAllNotificationsAsRead();
  }

  // ------------------------------------------------------------- safety
  public submitReport(report: Omit<SafetyReport, "id" | "timestamp" | "status">): SafetyReport {
    const uid = cache.currentUserId;
    const entry: SafetyReport = { ...report, id: newId(), timestamp: nowIso(), status: "pending" };
    if (uid) {
      persist("submitReport", () =>
        supabase.from("safety_reports").insert({
          reporter_id: uid,
          reported_item_id: report.reportedItemId,
          reported_item_type: report.reportedItemType,
          reported_title: report.reportedTitle ?? null,
          reason: report.reason,
          description: report.description ?? "",
        }),
      );
    }
    return entry;
  }

  public getReports(): SafetyReport[] {
    return cache.reports.map((r) => ({
      id: r.id,
      reporterId: r.reporter_id,
      reporterUsername: cache.profiles.find((p) => p.id === r.reporter_id)?.username ?? "unknown",
      reportedItemId: r.reported_item_id,
      reportedItemType: r.reported_item_type as SafetyReport["reportedItemType"],
      reportedTitle: r.reported_title ?? undefined,
      reason: r.reason,
      description: r.description,
      timestamp: r.created_at,
      status: r.status as SafetyReport["status"],
    }));
  }

  public resolveReport(reportId: string, status: SafetyReport["status"]): void {
    this.updateReportStatus(reportId, status);
  }

  public updateReportStatus(reportId: string, status: SafetyReport["status"]): void {
    cache.reports = cache.reports.map((r) => (r.id === reportId ? { ...r, status } : r));
    emit();
    persist("resolveReport", () => supabase.from("safety_reports").update({ status }).eq("id", reportId));
  }

  public submitAppeal(data: { username: string; email: string; message: string }): void {
    persist("submitAppeal", () =>
      supabase.from("account_appeals").insert({
        user_id: cache.currentUserId,
        username: data.username,
        email: data.email,
        message: data.message,
      }),
    );
  }

  public getAppeals(): AccountAppeal[] {
    return cache.appeals.map((a) => ({
      id: a.id,
      username: a.username,
      email: a.email,
      message: a.message,
      submittedAt: a.created_at,
      status: a.status as AccountAppeal["status"],
    }));
  }

  public getBlockedUsers(): BlockedUser[] {
    return cache.blocked.map((b) => {
      const profile = cache.profiles.find((p) => p.id === b.blocked_id);
      return {
        id: b.blocked_id,
        username: profile?.username ?? "unknown",
        fullName: profile?.full_name || profile?.username || "PYE user",
        avatar: profile?.avatar ?? "",
        blockedAt: b.created_at,
      };
    });
  }

  public blockUser(userId: string): void {
    const uid = cache.currentUserId;
    if (!uid || uid === userId) return;
    if (cache.blocked.some((b) => b.blocked_id === userId)) return;
    cache.blocked = [...cache.blocked, { id: newId(), user_id: uid, blocked_id: userId, created_at: nowIso() }];
    emit();
    persist("blockUser", () => supabase.from("blocked_users").insert({ user_id: uid, blocked_id: userId }));
  }

  public unblockUser(userId: string): void {
    const uid = cache.currentUserId;
    if (!uid) return;
    cache.blocked = cache.blocked.filter((b) => b.blocked_id !== userId);
    emit();
    persist("unblockUser", () =>
      supabase.from("blocked_users").delete().eq("user_id", uid).eq("blocked_id", userId),
    );
  }

  // ------------------------------------------------------------- admin
  public isAdmin(): boolean {
    return cache.roles.includes("admin");
  }

  public getAuditLogs(): AuditLog[] {
    return cache.auditLogs.map((l) => ({
      id: l.id,
      adminId: l.admin_id,
      adminUsername: cache.profiles.find((p) => p.id === l.admin_id)?.username ?? "admin",
      action: l.action,
      target: l.target,
      details: l.details,
      timestamp: l.created_at,
    }));
  }

  public addAuditLog(action: string, target: string, details: string): AuditLog {
    const uid = cache.currentUserId ?? "";
    const entry: AuditLog = {
      id: newId(),
      adminId: uid,
      adminUsername: cache.profiles.find((p) => p.id === uid)?.username ?? "admin",
      action,
      target,
      details,
      timestamp: nowIso(),
    };
    persist("auditLog", () =>
      supabase.rpc("log_admin_action", { _action: action, _target: target, _details: details }),
    );
    return entry;
  }

  public setUserStatus(userId: string, isDeactivated: boolean): void {
    cache.profiles = cache.profiles.map((p) => (p.id === userId ? { ...p, is_deactivated: isDeactivated } : p));
    emit();
    persist("setUserStatus", () =>
      supabase.rpc("admin_set_deactivated", { _user_id: userId, _deactivated: isDeactivated }),
    );
  }

  public toggleUserVerified(userId: string): boolean {
    const profile = cache.profiles.find((p) => p.id === userId);
    if (!profile) return false;
    const next = !profile.is_verified;
    cache.profiles = cache.profiles.map((p) => (p.id === userId ? { ...p, is_verified: next } : p));
    emit();
    persist("toggleVerified", () => supabase.rpc("admin_set_verified", { _user_id: userId, _verified: next }));
    return next;
  }

  // ------------------------------------------------------------- business
  public applyBusinessAccount(userId: string, profile: BusinessProfile): boolean {
    if (userId !== cache.currentUserId) return false;
    this.updateProfile({ isBusiness: true, businessProfile: { ...profile, verificationStatus: "pending" } });
    return true;
  }

  // ------------------------------------------------------------- removed sections
  /** PYE Tube was removed from the product. */
  public getTubeVideos(): TubeVideo[] {
    return [];
  }

  /** Live video was removed from the product. */
  public getLives(): LiveStream[] {
    return [];
  }

  public getAds(_userId?: string): Advertisement[] {
    return [];
  }

  /** Submits an ad campaign for review. */
  public createAd(input: Omit<Advertisement, "id" | "status" | "impressions" | "clicks" | "createdAt">): Advertisement {
    const ad: Advertisement = { ...input, id: newId(), status: "pending_review" as Advertisement["status"], impressions: 0, clicks: 0, createdAt: nowIso() };
    persist("createAd", () =>
      supabase.from("advertisements").insert({
        id: ad.id,
        advertiser_id: input.advertiserId,
        advertiser_name: input.advertiserName,
        title: input.title,
        description: input.description,
        media_url: input.mediaUrl,
        media_type: input.mediaType,
        destination_url: input.destinationUrl,
        call_to_action: input.callToAction,
        category: input.category,
        start_date: input.startDate,
        end_date: input.endDate,
        budget_coins: input.budgetCoins,
        target_audience: input.targetAudience,
      }),
    );
    return ad;
  }

  public createPromotion(input: Omit<PromotedContent, "id" | "status" | "createdAt">): PromotedContent {
    const promo: PromotedContent = { ...input, id: newId(), status: "pending_review", createdAt: nowIso() };
    persist("createPromotion", () =>
      supabase.from("promoted_content").insert({
        id: promo.id,
        author_id: input.authorId,
        content_id: input.contentId,
        content_type: input.contentType,
        content_title: input.contentTitle,
        goal: input.goal,
        audience: input.audience,
        duration_days: input.durationDays,
        budget_coins: input.budgetCoins,
      }),
    );
    return promo;
  }

  /** Real payments are not connected yet: never credit coins from the browser. */
  public processFuturePaymentSimulation(_input: unknown): { success: false; error: string } {
    return { success: false, error: "Coin purchases are not available yet." };
  }

  public getActiveAds(): Advertisement[] {
    return [];
  }

  public getPromotions(_userId?: string): PromotedContent[] {
    return [];
  }
}

export const Storage = new StorageService();
export default Storage;
export { PYE_SPACES } from "@/services/spaces";
