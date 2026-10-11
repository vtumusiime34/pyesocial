import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  CheckCircle,
  Phone,
  Video,
  Info,
  ArrowLeft,
  Shield,
  Ban,
  X,
} from 'lucide-react';
import { User } from '../../types';
import { Storage } from '../../services/storage';
import { WebRTC } from '../../services/webrtc';
import { useStoreVersion } from '@/components/PyeDataProvider';

interface PyeMessagesProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onReportItem: (itemId: string, itemType: string, title?: string) => void;
  onViewProfile: (userId: string) => void;
}

export const PyeMessages: React.FC<PyeMessagesProps> = ({ currentUser, onOpenAuth, onReportItem, onViewProfile }) => {
  useStoreVersion();
  const conversations = Storage.getConversations();
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConvId) ?? (mobileShowChat ? undefined : conversations[0]);
  const activeId = activeConversation?.id ?? '';
  const isBlocked = activeConversation ? Storage.isBlocked?.(activeConversation.participant.id) ?? false : false;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
    if (activeId) Storage.markConversationRead(activeId);
  }, [activeId, activeConversation?.messages.length]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 3000);
  };

  const filtered = useMemo(
    () =>
      conversations.filter(
        (c) =>
          c.participant.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
          c.participant.username.toLowerCase().includes(searchFilter.toLowerCase()),
      ),
    [conversations, searchFilter],
  );

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4 p-8 rounded-3xl bg-[#0f0f18] border border-white/5">
        <MessageSquare className="w-10 h-10 mx-auto text-[#ff1493]" />
        <p className="text-sm text-zinc-300">Sign in to chat and call other PYE creators.</p>
        <button onClick={onOpenAuth} className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#ff1493] to-[#ff8c00] text-white text-sm font-bold">
          Sign in
        </button>
      </div>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeId || isBlocked) return;
    Storage.sendMessage(activeId, msgInput.trim());
    setMsgInput('');
  };

  const startCall = async (type: 'voice' | 'video') => {
    if (!activeConversation) return;
    const res = await WebRTC.startCall(currentUser, activeConversation.participant, type);
    if (!res.ok) showToast(res.error || 'Could not start call');
    else window.dispatchEvent(new Event('pye:call-started'));
  };

  const p = activeConversation?.participant;

  return (
    <div className="w-full h-[calc(100dvh-9rem)] md:h-[calc(100dvh-6.5rem)] rounded-3xl bg-[#0f0f18] border border-white/5 overflow-hidden shadow-2xl flex">
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 px-4 py-2 rounded-xl bg-zinc-900 border border-[#ff1493]/50 text-white text-xs shadow-2xl">
          {toastMsg}
        </div>
      )}

      {/* Conversation list */}
      <div className={`${mobileShowChat ? 'hidden' : 'flex'} md:flex w-full md:w-80 border-r border-white/5 flex-col bg-[#0b0b12]`}>
        <div className="p-4 border-b border-white/5 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#ff1493]" /> Messages
          </h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff1493]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="p-6 text-center text-xs text-zinc-500">
              No conversations yet. Open a creator's profile and tap Message to start chatting.
            </p>
          )}
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveConvId(c.id);
                setMobileShowChat(true);
                setShowInfo(false);
              }}
              className={`w-full p-3.5 flex items-center gap-3 text-left transition ${
                c.id === activeId ? 'bg-white/5 border-l-2 border-[#ff1493]' : 'hover:bg-white/5 border-l-2 border-transparent'
              }`}
            >
              <img src={c.participant.avatar} alt="" className="w-11 h-11 rounded-full bg-zinc-800 object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-semibold text-white truncate">{c.participant.fullName}</span>
                  <span className="text-[10px] text-zinc-500 shrink-0">{c.lastMessageTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-zinc-400 truncate flex-1">{c.lastMessage || 'Say hi 👋'}</p>
                  {c.unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff1493] text-[10px] font-bold text-white flex items-center justify-center">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat window */}
      {activeConversation && p ? (
        <div className={`${mobileShowChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0 relative`}>
          <div className="sticky top-0 z-10 px-3 sm:px-4 py-3 border-b border-white/5 bg-[#0f0f18]/95 backdrop-blur flex items-center gap-3">
            <button onClick={() => setMobileShowChat(false)} className="md:hidden p-1.5 text-zinc-400" aria-label="Back">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button onClick={() => onViewProfile(p.id)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
              <img src={p.avatar} alt="" className="w-10 h-10 rounded-full bg-zinc-800 object-cover" />
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-sm font-bold text-white truncate">
                  {p.fullName}
                  {p.isVerified && <CheckCircle className="w-3.5 h-3.5 text-[#ff1493] shrink-0" />}
                </div>
                <div className="text-[11px] text-zinc-400 truncate">@{p.username}</div>
              </div>
            </button>
            <button onClick={() => startCall('voice')} disabled={isBlocked} className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/5 disabled:opacity-30" aria-label="Voice call">
              <Phone className="w-5 h-5" />
            </button>
            <button onClick={() => startCall('video')} disabled={isBlocked} className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/5 disabled:opacity-30" aria-label="Video call">
              <Video className="w-5 h-5" />
            </button>
            <button onClick={() => setShowInfo((v) => !v)} className={`p-2 rounded-full hover:bg-white/5 ${showInfo ? 'text-[#ff1493]' : 'text-zinc-300'}`} aria-label="Conversation info">
              <Info className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-2">
            {activeConversation.messages.length === 0 && (
              <p className="text-center text-xs text-zinc-500 mt-10">Start your conversation with {p.fullName}.</p>
            )}
            {activeConversation.messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.isMine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[78%] sm:max-w-md rounded-3xl px-4 py-2.5 text-sm leading-relaxed break-words ${
                    m.isMine
                      ? 'bg-gradient-to-r from-[#ff1493] to-[#ff8c00] text-white rounded-br-md'
                      : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-zinc-500 mt-0.5 px-2">{m.timestamp}</span>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {isBlocked ? (
            <div className="p-4 border-t border-white/5 text-center text-xs text-zinc-400">You blocked this user. Unblock them in conversation info to message again.</div>
          ) : (
            <form onSubmit={handleSend} className="p-3 border-t border-white/5 flex gap-2">
              <input
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                placeholder="Message..."
                className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-full text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff1493]"
              />
              <button type="submit" disabled={!msgInput.trim()} className="p-3 rounded-full bg-gradient-to-r from-[#ff1493] to-[#ff8c00] text-white disabled:opacity-40" aria-label="Send">
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

          {showInfo && (
            <div className="absolute right-0 top-0 bottom-0 w-full sm:w-72 z-20 bg-[#0b0b12] border-l border-white/10 p-5 space-y-4 overflow-y-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">Details</h3>
                <button onClick={() => setShowInfo(false)} className="text-zinc-400" aria-label="Close details">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center space-y-2">
                <img src={p.avatar} alt="" className="w-20 h-20 rounded-full mx-auto object-cover bg-zinc-800" />
                <div className="text-sm font-bold text-white">{p.fullName}</div>
                <div className="text-xs text-zinc-400">@{p.username}</div>
                <button onClick={() => onViewProfile(p.id)} className="text-xs text-[#ff1493] hover:underline">View profile</button>
              </div>
              <button
                onClick={() => {
                  if (isBlocked) Storage.unblockUser(p.id);
                  else Storage.blockUser(p.id);
                  showToast(isBlocked ? 'User unblocked' : 'User blocked');
                }}
                className="w-full flex items-center gap-2 p-3 rounded-xl bg-zinc-900 text-xs text-zinc-200 hover:bg-zinc-800"
              >
                <Ban className="w-4 h-4 text-rose-400" /> {isBlocked ? 'Unblock' : 'Block'} @{p.username}
              </button>
              <button
                onClick={() => onReportItem(activeConversation.id, 'message', `Conversation with @${p.username}`)}
                className="w-full flex items-center gap-2 p-3 rounded-xl bg-zinc-900 text-xs text-zinc-200 hover:bg-zinc-800"
              >
                <Shield className="w-4 h-4 text-amber-400" /> Report conversation
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-xs text-zinc-500">
          Select a conversation to start messaging.
        </div>
      )}
    </div>
  );
};
