import { useCallback, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CLUBS } from '@/game/data/clubs';
import type { CameraPreset, ControlState, TeamData } from '@/game/types';
import type { FootballMatch } from '@/game/engine/FootballMatch';
import { GameCanvas } from './GameCanvas';
import { VirtualControls } from './VirtualControls';
import { MatchHUD } from './MatchHUD';
import { MatchSummary } from './MatchSummary';
import { PauseMenu } from './PauseMenu';
import { TeamSelectModal } from '@/components/menu/TeamSelectModal';

export function FootballApp() {
  const [teams, setTeams] = useState<{home: TeamData; away: TeamData} | null>(null);
  const [setup, setSetup] = useState(false);
  const [paused, setPaused] = useState(false);
  const [camera, setCamera] = useState<CameraPreset>('tv_broadcast');
  const [round, setRound] = useState(0);
  const [match, setMatch] = useState<FootballMatch | null>(null);
  const [, tick] = useState(0);
  const last = useRef(0);
  const [controls, setControls] = useState<ControlState>({moveX:0,moveZ:0,isSprinting:false,passRequested:false,throughRequested:false,shootRequested:false,shootPower:0,lobRequested:false,tackleRequested:false,slideRequested:false,switchPlayerRequested:false,skillRequested:false});
  const update = useCallback((next: FootballMatch) => { if (performance.now() - last.current < 100) return; last.current = performance.now(); setMatch(next); tick(v => v+1); }, []);
  const exit = () => {setTeams(null);setMatch(null);setPaused(false);};
  const restart = () => {setMatch(null);setPaused(false);setRound(v=>v+1);};
  if (!teams) return <div className="dark min-h-screen bg-background text-foreground p-6"><Button asChild variant="ghost"><Link to="/games"><ArrowLeft /> Games</Link></Button><div className="max-w-4xl mx-auto py-12 space-y-6"><h1 className="text-3xl font-bold">PYE Football</h1><p className="text-muted-foreground">{CLUBS.length} clubs · 11 vs 11</p><Button onClick={()=>setSetup(true)}>Quick match</Button></div>{setup && <TeamSelectModal isOpen onClose={()=>setSetup(false)} onStartMatch={(home,away)=>{setTeams({home,away});setSetup(false);}} />}</div>;
  return <div className="fixed inset-0 overflow-hidden bg-background"><GameCanvas key={round} homeTeam={teams.home} awayTeam={teams.away} controls={controls} graphicsQuality="medium" cameraPreset={camera} isPaused={paused} onMatchUpdate={update} />{match && <MatchHUD match={match} onPause={()=>setPaused(true)} currentCamera={camera} onCycleCamera={()=>setCamera(camera === 'tv_broadcast' ? 'action_cam' : 'tv_broadcast')} />}{!paused && match?.phase !== 'full_time' && <VirtualControls inPossession={Boolean(match?.homePlayers.some(p=>p.hasBall))} hasBall={match?.userPlayer?.hasBall ?? false} stamina={match?.userPlayer?.stamina ?? 100} onControlChange={setControls} />}{paused && match && <PauseMenu match={match} onResume={()=>setPaused(false)} onRestart={restart} onQuit={exit} onCameraChange={setCamera} currentCamera={camera} />}{match?.phase === 'full_time' && <MatchSummary match={match} onRematch={restart} onExit={exit} />}</div>;
}