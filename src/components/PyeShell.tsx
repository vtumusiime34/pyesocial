import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import type { Conference, User } from "@/types";
import { Storage } from "@/services/storage";
import { useStoreVersion } from "@/components/PyeDataProvider";

import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { RightSidebar } from "@/components/layout/RightSidebar";

import { HomeFeed } from "@/components/home/HomeFeed";
import { PyeShorts } from "@/components/shorts/PyeShorts";
import { PyeSpacesView } from "@/components/spaces/PyeSpacesView";
import { PyeConference } from "@/components/conference/PyeConference";
import { PyeRankings } from "@/components/rankings/PyeRankings";
import { PyeSounds } from "@/components/sounds/PyeSounds";
import { PyeGames } from "@/components/games/PyeGames";
import { CreatorStudio } from "@/components/studio/CreatorStudio";
import { PyeMessages } from "@/components/messages/PyeMessages";
import { ProfileView } from "@/components/profile/ProfileView";
import { SearchView } from "@/components/search/SearchView";
import { SettingsView } from "@/components/settings/SettingsView";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

import { CreateModal } from "@/components/create/CreateModal";
import { PyeWalletModal } from "@/components/wallet/PyeWalletModal";
import { TipModal } from "@/components/wallet/TipModal";
import { ReportModal } from "@/components/safety/ReportModal";
import { NotificationsDrawer } from "@/components/notifications/NotificationsDrawer";

export type PyeView =
  | "home"
  | "shorts"
  | "spaces"
  | "sounds"
  | "games"
  | "conferences"
  | "rankings"
  | "studio"
  | "messages"
  | "search"
  | "profile"
  | "settings"
  | "admin";

/** Maps the legacy view ids the screens emit onto real URLs. */
const VIEW_PATHS: Record<string, string> = {
  home: "/",
  shorts: "/pyes",
  pyes: "/pyes",
  spaces: "/spaces",
  sounds: "/sounds",
  games: "/games",
  conferences: "/conferences",
  rankings: "/rankings",
  studio: "/studio",
  messages: "/messages",
  search: "/search",
  profile: "/profile",
  settings: "/settings",
  admin: "/admin",
  wallet: "/",
  landing: "/welcome",
  // Removed product areas fall back to the feed.
  tube: "/",
  live: "/",
};

interface PyeShellProps {
  view: PyeView;
  profileUsername?: string;
  initialQuery?: string;
}

export function PyeShell({ view, profileUsername, initialQuery = "" }: PyeShellProps) {
  const navigate = useNavigate();
  useStoreVersion();

  const currentUser = Storage.getCurrentUser();
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [tipTarget, setTipTarget] = useState<{ id: string; name: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<{ id: string; type: string; title?: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => setSearchQuery(initialQuery), [initialQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 3500);
  };

  const go = (target: string) => {
    const path = VIEW_PATHS[target] ?? "/";
    if (target === "profile") {
      if (currentUser) {
        void navigate({ to: "/profile/$username", params: { username: currentUser.username } });
      } else {
        void navigate({ to: "/auth", search: { tab: "login" } });
      }
      return;
    }
    void navigate({ to: path });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenAuth = (tab: "login" | "signup" = "login") => {
    void navigate({ to: "/auth", search: { tab } });
  };

  const handleLogout = () => {
    Storage.logout();
    showToast("Signed out of PYE Universe.");
    void navigate({ to: "/" });
  };

  const handleViewProfile = (userId: string) => {
    const user = Storage.getUserById(userId);
    if (!user) return;
    void navigate({ to: "/profile/$username", params: { username: user.username } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectHashtag = (tag: string) => {
    setSearchQuery(tag);
    void navigate({ to: "/search", search: { q: tag } });
  };

  const handleFollowToggle = (userId: string) => {
    if (!currentUser) {
      handleOpenAuth("login");
      return;
    }
    const isNow = Storage.toggleFollow(userId);
    showToast(isNow ? "Creator followed!" : "Unfollowed.");
  };

  const creators: User[] = Storage.getUsers().filter((u) => u.id !== currentUser?.id);
  const conferences: Conference[] = Storage.getConferences();
  const notifications = Storage.getNotifications();
  const conversations = Storage.getConversations();
  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;
  const unreadMessagesCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const viewedProfileId = profileUsername
    ? (Storage.getUserByUsername(profileUsername)?.id ?? "")
    : (currentUser?.id ?? "");

  return (
    <div className="min-h-screen bg-[#07070b] text-[#f1f1f5] flex flex-col selection:bg-[#FF007A] selection:text-white">
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-[#FF007A]/60 text-white text-xs font-semibold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      <Navbar
        currentUser={currentUser}
        onNavigate={go}
        currentView={view}
        onOpenCreate={() => setShowCreateModal(true)}
        onOpenWallet={() => setShowWalletModal(true)}
        onOpenNotifications={() => setShowNotificationsDrawer(true)}
        onOpenMessages={() => go("messages")}
        onLogout={handleLogout}
        onOpenAuth={handleOpenAuth}
        searchQuery={searchQuery}
        onSearchChange={(q: string) => {
          setSearchQuery(q);
          void navigate({ to: "/search", search: { q: q || undefined } });
        }}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadMessagesCount={unreadMessagesCount}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex items-start">
        <Sidebar
          currentView={view}
          onNavigate={go}
          currentUser={currentUser}
          unreadNotificationsCount={unreadNotificationsCount}
          unreadMessagesCount={unreadMessagesCount}
        />

        <main
          className={`flex-1 min-w-0 overflow-x-hidden ${
            view === "shorts" ? "p-1 sm:p-3 lg:p-4" : "p-3 sm:p-5 lg:p-6"
          }`}
        >
          {view === "home" && (
            <HomeFeed
              currentUser={currentUser}
              onOpenCreate={() => setShowCreateModal(true)}
              onOpenAuth={handleOpenAuth}
              onReportItem={(id, type, title) => setReportTarget({ id, type, title })}
              onOpenTipModal={(id, name) => setTipTarget({ id, name })}
              onViewProfile={handleViewProfile}
              onSelectSpace={() => go("spaces")}
            />
          )}

          {view === "shorts" && (
            <PyeShorts
              currentUser={currentUser}
              onOpenAuth={handleOpenAuth}
              onOpenTipModal={(id, name) => setTipTarget({ id, name })}
              onReportItem={(id, type, title) => setReportTarget({ id, type, title })}
              onViewProfile={handleViewProfile}
              onOpenCreate={() => setShowCreateModal(true)}
            />
          )}

          {view === "spaces" && (
            <PyeSpacesView
              currentUser={currentUser}
              onOpenCreate={() => setShowCreateModal(true)}
              onOpenAuth={handleOpenAuth}
              onViewProfile={handleViewProfile}
              onReportItem={(id, type, title) => setReportTarget({ id, type, title })}
              onOpenTipModal={(id, name) => setTipTarget({ id, name })}
            />
          )}

          {view === "sounds" && <PyeSounds currentUser={currentUser} onOpenAuth={handleOpenAuth} />}

          {view === "games" && <PyeGames currentUser={currentUser} onOpenAuth={handleOpenAuth} />}

          {view === "conferences" && (
            <PyeConference
              currentUser={currentUser}
              onOpenAuth={handleOpenAuth}
              onViewProfile={handleViewProfile}
            />
          )}

          {view === "rankings" && (
            <PyeRankings
              currentUser={currentUser}
              onOpenAuth={handleOpenAuth}
              onViewProfile={handleViewProfile}
            />
          )}

          {view === "studio" && (
            <CreatorStudio
              currentUser={currentUser}
              onOpenCreate={() => setShowCreateModal(true)}
              onViewProfile={handleViewProfile}
            />
          )}

          {view === "messages" && (
            <PyeMessages
              currentUser={currentUser}
              onOpenAuth={handleOpenAuth}
              onReportItem={(id, type, title) => setReportTarget({ id, type, title })}
              onViewProfile={handleViewProfile}
            />
          )}

          {view === "search" && (
            <SearchView
              initialQuery={searchQuery}
              onNavigate={go}
              onViewProfile={handleViewProfile}
              onSelectHashtag={handleSelectHashtag}
            />
          )}

          {view === "profile" && (
            <ProfileView
              userId={viewedProfileId}
              currentUser={currentUser}
              onOpenAuth={handleOpenAuth}
              onUserUpdated={() => showToast("Profile updated.")}
            />
          )}

          {view === "settings" && (
            <SettingsView
              currentUser={currentUser}
              onUserUpdated={() => showToast("Settings saved.")}
              onLogout={handleLogout}
              onOpenAuth={handleOpenAuth}
            />
          )}

          {view === "admin" && <AdminDashboard currentUser={currentUser} onNavigate={go} />}
        </main>

        {view === "home" && (
          <RightSidebar
            creators={creators}
            conferences={conferences}
            onFollowToggle={handleFollowToggle}
            isFollowing={(id: string) => Storage.isFollowing(id)}
            onNavigate={go}
            onSelectHashtag={handleSelectHashtag}
            onSelectConference={() => go("conferences")}
          />
        )}
      </div>

      <MobileNav
        currentView={view}
        onNavigate={go}
        onOpenCreate={() => setShowCreateModal(true)}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
      />

      <CreateModal
        currentUser={currentUser}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(msg: string) => {
          showToast(msg);
          go("home");
        }}
        onOpenAuth={() => {
          setShowCreateModal(false);
          handleOpenAuth("login");
        }}
        onGoConferenceTrigger={() => go("conferences")}
      />

      <PyeWalletModal
        currentUser={currentUser}
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onUserUpdated={() => undefined}
      />

      {tipTarget && (
        <TipModal
          currentUser={currentUser}
          targetUserId={tipTarget.id}
          targetName={tipTarget.name}
          isOpen={!!tipTarget}
          onClose={() => setTipTarget(null)}
          onSuccess={(msg: string) => showToast(msg)}
          onOpenAuth={() => {
            setTipTarget(null);
            handleOpenAuth("login");
          }}
          onUserUpdated={() => undefined}
        />
      )}

      {reportTarget && (
        <ReportModal
          currentUser={currentUser}
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetId={reportTarget.id}
          targetType={reportTarget.type}
          targetTitle={reportTarget.title}
          onOpenAuth={() => {
            setReportTarget(null);
            handleOpenAuth("login");
          }}
        />
      )}

      <NotificationsDrawer
        isOpen={showNotificationsDrawer}
        onClose={() => setShowNotificationsDrawer(false)}
        onNavigate={(target: string) => {
          setShowNotificationsDrawer(false);
          go(target);
        }}
        onViewProfile={handleViewProfile}
        onUpdateNotifications={() => undefined}
      />
    </div>
  );
}
