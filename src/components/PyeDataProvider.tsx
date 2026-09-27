import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Storage, ensureHydrated, getStoreVersion, startRealtime, stopRealtime, subscribeStore } from "@/services/storage";
import { setSessionUser } from "@/services/store";
import { PyeLogo } from "@/components/ui/PyeLogo";

/** Re-renders the caller whenever PYE data changes. */
export function useStoreVersion(): number {
  return useSyncExternalStore(subscribeStore, getStoreVersion, () => 0);
}

/**
 * Loads PYE data from the database once on the client, keeps the session in
 * sync, and only renders the app when data is available.
 */
export function PyeDataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    ensureHydrated()
      .then(() => {
        if (!active) return;
        setReady(true);
        startRealtime();
      })
      .catch((error) => {
        console.error("[pye:hydrate]", error);
        if (active) setFailed(true);
      });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void (async () => {
        const userId = session?.user.id ?? null;
        if (userId && session?.user.email) await Storage.ensureProfile(userId, session.user.email);
        await setSessionUser(userId);
        stopRealtime();
        startRealtime();
      })();
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
      stopRealtime();
    };
  }, []);

  if (failed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#07070b] px-6 text-center text-[#f1f1f5]">
        <PyeLogo size={44} />
        <p className="text-sm text-zinc-400">
          PYE could not reach the network. Please check your connection and reload.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full pye-gradient-bg px-5 py-2 text-xs font-bold text-white"
        >
          Reload PYE
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07070b]">
        <div className="flex flex-col items-center gap-4">
          <PyeLogo size={44} />
          <div className="h-1 w-32 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-1/2 animate-pulse rounded-full pye-gradient-bg" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
