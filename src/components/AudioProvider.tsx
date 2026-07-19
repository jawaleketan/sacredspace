import { createContext, useContext, useRef, useState, useEffect, useCallback, type ReactNode } from "react";

interface AudioTrack {
  url: string;
  title: string;
  deityName: string;
}

interface AudioContextType {
  track: AudioTrack | null;
  isPlaying: boolean;
  play: (track: AudioTrack) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);
  const [volume, setVolume] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
    return () => { cancelAnimationFrame(animRef.current); audioRef.current?.remove(); };
  }, []);

  const updateProgress = useCallback(() => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    animRef.current = requestAnimationFrame(updateProgress);
  }, []);

  const play = useCallback((t: AudioTrack) => {
    const el = audioRef.current;
    if (!el) return;
    if (track?.url !== t.url) {
      el.src = t.url;
      el.load();
      setTrack(t);
      setCurrentTime(0);
      setDuration(0);
      el.onloadedmetadata = () => setDuration(el.duration);
    }
    el.play().then(() => {
      setIsPlaying(true);
      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(updateProgress);
    }).catch(() => {});
  }, [track, updateProgress]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    cancelAnimationFrame(animRef.current);
  }, []);

  const resume = useCallback(() => {
    const el = audioRef.current;
    if (!el || !track) return;
    el.play().then(() => {
      setIsPlaying(true);
      animRef.current = requestAnimationFrame(updateProgress);
    }).catch(() => {});
  }, [track, updateProgress]);

  const stop = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setIsPlaying(false);
    setTrack(null);
    setCurrentTime(0);
    setDuration(0);
    cancelAnimationFrame(animRef.current);
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.loop = loop;
  }, [loop]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
  }, [volume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnd = () => { if (!loop) { setIsPlaying(false); cancelAnimationFrame(animRef.current); } };
    el.addEventListener("ended", onEnd);
    return () => el.removeEventListener("ended", onEnd);
  }, [loop]);

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    el.currentTime = frac * duration;
    setCurrentTime(frac * duration);
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <AudioContext.Provider value={{ track, isPlaying, play, pause, resume, stop }}>
      {children}
      {track && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant bg-surface-container-lowest shadow-xl transition-all ${
            expanded ? "h-48" : "h-16"
          }`}
        >
          <div className="mx-auto flex h-full max-w-4xl flex-col px-4">
            <div className="flex items-center gap-3 py-3">
              <button
                onClick={() => isPlaying ? pause() : resume()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-gold text-white transition-colors hover:bg-accent-saffron"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-hidden cursor-pointer group" onClick={seek}>
                    <div className="h-1.5 rounded-full bg-surface-container-highest">
                      <div
                        className="h-full rounded-full bg-accent-gold transition-all duration-75"
                        style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-on-surface-variant">
                    {fmt(currentTime)} / {fmt(duration)}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-on-surface-variant">
                  {track.title} &middot; {track.deityName}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container"
                  aria-label="More controls"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
                </button>
                <button
                  onClick={stop}
                  className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container"
                  aria-label="Close"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            {expanded && (
              <div className="flex items-center gap-6 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant">Speed</span>
                  <div className="flex gap-1">
                    {speeds.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                          speed === s
                            ? "bg-accent-gold text-white"
                            : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant">Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-surface-container-highest accent-accent-gold"
                  />
                </div>

                <button
                  onClick={() => setLoop(!loop)}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    loop
                      ? "bg-accent-gold/10 text-accent-gold"
                      : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
                  Loop
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AudioContext.Provider>
  );
}
