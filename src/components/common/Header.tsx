import React, { useState } from 'react';
import { useQuiz } from '../../context/QuizContext';
import { RoleType } from '../../types/quiz';
import {
  Trophy,
  Tv,
  Sliders,
  Settings,
  Smartphone,
  Volume2,
  VolumeX,
  Radio,
  Layers,
  ExternalLink,
  Maximize,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  onOpenSimulator: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSimulator }) => {
  const {
    quizzes,
    activeQuiz,
    activeQuizId,
    setActiveQuizId,
    role,
    setRole,
    isConnected,
    isSoundMuted,
    toggleMute,
    soundVolume,
    setSoundVolume,
  } = useQuiz();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const roles: { id: RoleType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'projector', label: 'Main Projector Display', icon: <Tv className="w-4 h-4" /> },
    { id: 'quizmaster', label: 'Quizmaster Console', icon: <Sliders className="w-4 h-4" /> },
    { id: 'admin', label: 'Admin Panel', icon: <Settings className="w-4 h-4" /> },
    { id: 'mobile', label: 'Mobile Participant View', icon: <Smartphone className="w-4 h-4" /> },
  ];

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleOpenWindow = (targetRole: RoleType) => {
    const url = `${window.location.origin}?role=${targetRole}&quizId=${activeQuizId}`;
    window.open(url, '_blank', 'width=1280,height=800');
  };

  return (
    <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 sticky top-0 z-50 px-4 py-2.5 transition-all shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-amber-500 shadow-md shadow-sky-500/20">
            <Trophy className="w-5 h-5 text-white" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base md:text-lg bg-gradient-to-r from-sky-400 via-blue-200 to-amber-300 bg-clip-text text-transparent">
                MIND EXPEDITION
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-950 border border-sky-800 text-sky-300">
                Live Quiz System
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block tracking-wide">
              Explore Knowledge. Challenge Intelligence. Discover Excellence.
            </p>
          </div>
        </div>

        {/* Quiz Competition Selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={activeQuizId}
              onChange={(e) => setActiveQuizId(e.target.value)}
              className="bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer max-w-[200px] md:max-w-[260px] truncate font-medium"
            >
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  [{q.code}] {q.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dedicated Interface Switcher Tabs */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl gap-1">
          {roles.map((r) => {
            const isActive = role === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={`Switch to ${r.label}`}
              >
                {r.icon}
                <span className="hidden lg:inline">{r.label}</span>
                <span className="inline lg:hidden">{r.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Right Action Tools: Multi-device Simulator, Sound, Fullscreen, Status */}
        <div className="flex items-center gap-2">
          {/* Multi-device test simulator button */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all shadow-sm"
            title="Launch Multi-Device Buzzer Simulator to test 3-4 participant phones simultaneously"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Test Sim</span>
          </button>

          {/* Pop out to separate window */}
          <button
            onClick={() => handleOpenWindow(role)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Open current interface in new independent window"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Sound Control */}
          <div className="relative">
            <button
              onClick={toggleMute}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowVolumeSlider(!showVolumeSlider);
              }}
              className={`p-1.5 rounded-lg transition ${
                isSoundMuted
                  ? 'text-rose-400 bg-rose-950/40 hover:bg-rose-900/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={isSoundMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects (Right-click for volume)'}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {showVolumeSlider && (
              <div className="absolute right-0 top-10 bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 w-48">
                <span className="text-[10px] text-slate-400">Vol</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                  className="w-full accent-sky-500"
                />
                <span className="text-[10px] text-slate-300 font-mono">{Math.round(soundVolume * 100)}%</span>
              </div>
            )}
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={handleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition hidden sm:block"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>

          {/* Real-time server sync connection status */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border ${
              isConnected
                ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800/80 text-rose-300 animate-pulse'
            }`}
            title={isConnected ? 'Server WebSocket Connected (Sub-second sync)' : 'Reconnecting to Server...'}
          >
            <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className="hidden md:inline">{isConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
