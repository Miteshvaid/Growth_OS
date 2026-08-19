import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const MODES = {
  work: { label: "Deep Focus", defaultMinutes: 25, icon: "🎯", color: "text-accent" },
  shortBreak: { label: "Short Break", defaultMinutes: 5, icon: "☕", color: "text-emerald-400" },
  longBreak: { label: "Long Break", defaultMinutes: 15, icon: "🌿", color: "text-sky-400" },
};

// Web Audio API chime tone synthesizer
const playChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    // Note 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.8);

    // Note 2 (Harmonic octave up)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.2); // A5
    gain2.gain.setValueAtTime(0.18, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 1.2);
  } catch (e) {
    console.error("Audio playback error:", e);
  }
};

export default function PomodoroTimer({ onAutoLogCheckin, currentActivity = "Coding" }) {
  const [mode, setMode] = useState("work");
  const [duration, setDuration] = useState(MODES.work.defaultMinutes * 60);
  const [timeLeft, setTimeLeft] = useState(MODES.work.defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const timerRef = useRef(null);

  // Switch modes
  const handleModeSwitch = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    const secs = MODES[newMode].defaultMinutes * 60;
    setDuration(secs);
    setTimeLeft(secs);
  };

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, mode, duration, currentActivity]);

  const handleSessionEnd = () => {
    setIsRunning(false);
    playChime();

    if (mode === "work") {
      setCompletedCount((prev) => prev + 1);
      // Auto log check-in
      if (onAutoLogCheckin) {
        onAutoLogCheckin({
          activityType: currentActivity || "Coding",
          focusRating: 5,
        });
      }
      // Suggest short break
      handleModeSwitch("shortBreak");
    } else {
      handleModeSwitch("work");
    }
  };

  const togglePlay = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

  // SVG circle calculations
  const size = 180;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="bg-ink-light border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

      {/* Mode Selector */}
      <div className="flex bg-ink rounded-xl p-1 border border-white/5 mb-6 text-xs gap-1">
        {Object.entries(MODES).map(([key, config]) => (
          <button
            key={key}
            onClick={() => handleModeSwitch(key)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              mode === key
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-cream"
            }`}
          >
            <span className="mr-1">{config.icon}</span>
            {config.label}
          </button>
        ))}
      </div>

      {/* Circular Progress Display */}
      <div className="relative my-2 flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-white/5"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className={`${
              mode === "work"
                ? "text-accent"
                : mode === "shortBreak"
                ? "text-emerald-400"
                : "text-sky-400"
            } transition-all duration-500`}
          />
        </svg>

        {/* Inner Timer Text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-display text-4xl text-cream tracking-wider">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="text-[11px] text-muted capitalize mt-0.5">
            {MODES[mode].label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mt-6">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          className={`px-6 py-2.5 rounded-xl font-medium text-xs transition-all shadow-md flex items-center gap-2 ${
            isRunning
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "bg-accent hover:bg-accent-light text-white shadow-accent/25"
          }`}
        >
          <span>{isRunning ? "⏸ Pause" : "▶ Start Focus"}</span>
        </motion.button>

        <button
          onClick={resetTimer}
          className="p-2.5 rounded-xl text-muted hover:text-cream bg-white/5 hover:bg-white/10 text-xs transition-colors"
          title="Reset timer"
        >
          🔄
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-4 border-t border-white/5 w-full flex items-center justify-between text-[11px] text-muted">
        <span>Completed Today: <strong className="text-cream">{completedCount}</strong></span>
        <span>Auto-logs at 00:00</span>
      </div>
    </div>
  );
}
