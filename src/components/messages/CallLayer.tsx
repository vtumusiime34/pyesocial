import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import type { CallSession } from '@/types';
import { WebRTC } from '@/services/webrtc';
import { CallModal } from './CallModal';

/** App-wide call handling: listens for incoming calls and shows the active call window. */
export const CallLayer: React.FC<{ currentUserId: string | null }> = ({ currentUserId }) => {
  const [incoming, setIncoming] = useState<CallSession | null>(null);
  const [showCall, setShowCall] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    WebRTC.setUser(currentUserId);
  }, [currentUserId]);

  useEffect(
    () =>
      WebRTC.subscribe((e) => {
        if (e.type === 'incoming_call' && e.session) setIncoming(e.session);
        if (e.type === 'call_connected') setShowCall(true);
        if (e.type === 'call_ended') {
          setIncoming(null);
          setShowCall(false);
        }
        if (e.type === 'error' && e.error) {
          setError(e.error);
          window.setTimeout(() => setError(null), 3500);
        }
      }),
    [],
  );

  // Outgoing calls started from Messages open the call window.
  useEffect(() => {
    const open = () => setShowCall(true);
    window.addEventListener('pye:call-started', open);
    return () => window.removeEventListener('pye:call-started', open);
  }, []);

  if (!currentUserId) return null;

  return (
    <>
      {incoming && !showCall && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] w-[92vw] max-w-sm rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-[#FF007A]/40 shadow-2xl p-3 flex items-center gap-3">
          <img src={incoming.callerAvatar} alt="" className="w-11 h-11 rounded-full object-cover bg-zinc-800" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">{incoming.callerName}</div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-1">
              {incoming.type === 'video' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
              Incoming {incoming.type === 'video' ? 'video' : 'voice'} call…
            </div>
          </div>
          <button
            onClick={() => {
              WebRTC.rejectCall(incoming);
              setIncoming(null);
            }}
            aria-label="Decline call"
            className="p-2.5 rounded-full bg-rose-600 text-white"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              const res = await WebRTC.answerCall(incoming);
              if (!res.ok) setError(res.error || 'Could not answer');
              setIncoming(null);
              setShowCall(res.ok);
            }}
            aria-label="Answer call"
            className="p-2.5 rounded-full bg-emerald-500 text-white animate-pulse"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>
      )}
      {showCall && <CallModal currentUserId={currentUserId} onClose={() => setShowCall(false)} />}
      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-xl bg-zinc-900 border border-rose-500/50 text-white text-xs">
          {error}
        </div>
      )}
    </>
  );
};
