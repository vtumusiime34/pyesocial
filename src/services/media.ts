/**
 * Media uploads for avatars, banners, posters, videos and audio.
 *
 * Files land in the `pye-media` bucket under the signed-in user's folder and
 * are served through a long-lived signed URL that is stored with the record.
 */
import { supabase } from "@/integrations/supabase/client";
import { cache } from "@/services/store";

const BUCKET = "pye-media";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export type MediaFolder = "avatars" | "banners" | "posts" | "pyes" | "posters" | "sounds" | "covers";

function extensionFor(file: File): string {
  const fromName = file.name.includes(".") ? file.name.split(".").pop() : "";
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  const fromType = file.type.split("/")[1];
  return (fromType || "bin").toLowerCase();
}

export interface UploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

/** Uploads a file and returns a URL that can be used directly in the app. */
export async function uploadMedia(file: File, folder: MediaFolder): Promise<UploadResult> {
  const userId = cache.currentUserId;
  if (!userId) return { ok: false, error: "Please log in to upload files." };
  if (!file) return { ok: false, error: "No file selected." };
  if (file.size > 200 * 1024 * 1024) return { ok: false, error: "That file is larger than 200 MB." };

  const path = `${userId}/${folder}/${Date.now()}-${Math.random().toString(16).slice(2)}.${extensionFor(file)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) {
    console.error("[pye:upload]", error);
    return { ok: false, error: "Upload failed. Please check your connection and try again." };
  }

  const signed = await supabase.storage.from(BUCKET).createSignedUrl(path, TEN_YEARS);
  if (signed.error || !signed.data?.signedUrl) {
    console.error("[pye:signedUrl]", signed.error);
    return { ok: false, error: "The file uploaded but could not be published. Please try again." };
  }
  return { ok: true, url: signed.data.signedUrl };
}

/** Uploads a data URL (used by the image cropper) as a real file. */
export async function uploadDataUrl(dataUrl: string, folder: MediaFolder, name = "image"): Promise<UploadResult> {
  if (!dataUrl.startsWith("data:")) return { ok: true, url: dataUrl };
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = (blob.type.split("/")[1] || "png").toLowerCase();
    const file = new File([blob], `${name}.${ext}`, { type: blob.type });
    return uploadMedia(file, folder);
  } catch (error) {
    console.error("[pye:uploadDataUrl]", error);
    return { ok: false, error: "That image could not be processed." };
  }
}
