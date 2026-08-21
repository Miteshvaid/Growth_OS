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
  const [mode, setMode] = useState("work"); // 'work' or 'break'
  const [customFocusMins, setCustomFocusMins] = useState(25);
  const [customBreakMins, setCustomBreakMins] = useState(5);
  
  const [duration, setDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const timerRef = useRef(null);

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Update timer whenever custom focus or break duration changes if not running
  useEffect(() => {
    if (!isRunning) {
      const secs = mode === "work" ? customFocusMins * 60 : customBreakMins * 60;
      setDuration(secs);
      setTimeLeft(secs);
    }
  }, [customFocusMins, customBreakMins, mode]);

  // Switch modes
  const handleModeSwitch = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    const secs = newMode === "work" ? customFocusMins * 60 : customBreakMins * 60;
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
  }, [isRunning, mode, duration, customFocusMins, customBreakMins, currentActivity]);

  const sendNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.svg" });
    }
  };

  const handleSessionEnd = () => {
    setIsRunning(false);
    playChime();

    if (mode === "work") {
      setCompletedCount((prev) => prev + 1);
      sendNotification("Pomodoro Complete! 🎉", `Great job! Your ${customFocusMins}m focus session ended.`);
      if (onAutoLogCheckin) {
        onAutoLogCheckin({
          activityType: currentActivity || "Coding",
          focusRating: 5,
        });
      }
      handleModeSwitch("break");
    } else {
      sendNotification("Break Ended! ⚡", "Time to get back into deep focus mode!");
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

      {/* Mode Selector & Custom Durations */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-ink p-2.5 rounded-xl border border-white/5">
        <div className="flex bg-ink-light rounded-lg p-1 border border-white/5 text-xs gap-1">
          <button
            onClick={() => handleModeSwitch("work")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              mode === "work" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-cream"
            }`}
          >
            🎯 Focus Mode
          </button>
          <button
            onClick={() => handleModeSwitch("break")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              mode === "break" ? "bg-emerald-600 text-white shadow-sm" : "text-muted hover:text-cream"
            }`}
          >
            ☕ Break Mode
          </button>
        </div>

        {/* Custom Duration Inputs */}
        <div className="flex items-center gap-2 text-xs text-muted">
          <div className="flex items-center gap-1">
            <span>Focus:</span>
            <input
              type="number"
              min="1"
              max="180"
              value={customFocusMins}
              onChange={(e) => setCustomFocusMins(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isRunning}
              className="w-12 bg-ink border border-white/10 rounded px-1.5 py-0.5 text-center text-cream font-medium focus:outline-none focus:border-accent"
            />
            <span>m</span>
          </div>

          <div className="flex items-center gap-1">
            <span>Break:</span>
            <input
              type="number"
              min="1"
              max="60"
              value={customBreakMins}
              onChange={(e) => setCustomBreakMins(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isRunning}
              className="w-12 bg-ink border border-white/10 rounded px-1.5 py-0.5 text-center text-cream font-medium focus:outline-none focus:border-accent"
            />
            <span>m</span>
          </div>
        </div>
      </div>

      {/* Circular Progress Display */}
      <div className="relative my-2 flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-white/5"
          />
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
              mode === "work" ? "text-accent" : "text-emerald-400"
            } transition-all duration-500`}
          />
        </svg>

        {/* Inner Timer Text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-display text-4xl text-cream tracking-wider">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="text-[11px] text-muted capitalize mt-0.5">
            {mode === "work" ? "Focus Phase" : "Break Phase"}
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
          <span>{isRunning ? "⏸ Pause" : "▶ Start Session"}</span>
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
        <span>Focus Sessions Completed Today: <strong className="text-cream">{completedCount}</strong></span>
        <span>Sound & Notification Active</span>
      </div>
    </div>
  );
}
