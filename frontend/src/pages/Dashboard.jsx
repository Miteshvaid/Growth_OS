import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { getNotes } from "../api/notes";
import { getTodayCheckins, getDailySummary } from "../api/focusCheckin";

// Reusable skeleton pulse block
function StatSkeleton() {
  return (
    <div className="bg-ink-light border border-white/5 rounded-xl p-4 text-center animate-pulse">
      <div className="h-7 w-12 bg-white/10 rounded-lg mx-auto mb-2" />
      <div className="h-3 w-16 bg-white/5 rounded mx-auto" />
    </div>
  );
}

function Dashboard() {
  const [user, setUser] = useState(null);
  const [showApp, setShowApp] = useState(false);
  const [stats, setStats] = useState({
    notes: 0,
    streak: 0,
    sessions: 0,
    avgFocus: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse user");
      }
    }
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [notesData, checkinsRes, summaryRes] = await Promise.all([
        getNotes().catch(() => []),
        getTodayCheckins().catch(() => ({ data: [] })),
        getDailySummary().catch(() => ({ data: { total: 0, avgFocus: 0 } })),
      ]);

      const notes = Array.isArray(notesData) ? notesData : [];
      const checkins = checkinsRes.data || [];
      const summary = summaryRes.data || {};

      // Calculate streak from today's check-ins
      const uniqueDates = [...new Set(checkins.map((c) => c.date))].sort();
      let streak = 0;
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      if (uniqueDates.includes(today)) {
        streak = 1;
        for (let i = uniqueDates.length - 1; i > 0; i--) {
          const curr = new Date(uniqueDates[i]);
          const prev = new Date(uniqueDates[i - 1]);
          const diff = (curr - prev) / (1000 * 60 * 60 * 24);
          if (diff === 1) streak++;
          else break;
        }
      } else if (uniqueDates.includes(yesterday)) {
        streak = 1;
        for (let i = uniqueDates.length - 1; i > 0; i--) {
          const curr = new Date(uniqueDates[i]);
          const prev = new Date(uniqueDates[i - 1]);
          const diff = (curr - prev) / (1000 * 60 * 60 * 24);
          if (diff === 1) streak++;
          else break;
        }
      }

      setStats({
        notes: notes.length,
        streak: streak,
        sessions: checkins.length,
        avgFocus: summary.avgFocus || 0,
      });
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setLoading(false);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (!showApp) {
    return (
      <div className="min-h-screen bg-ink text-cream relative overflow-hidden">
        <div className="bg-glow-purple -top-32 -left-32 opacity-40 animate-pulse" />
        <div className="bg-glow-green -bottom-32 -right-32 opacity-30" />

        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-20 md:py-32 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent to-accent-light flex items-center justify-center text-white text-2xl font-bold mx-auto mb-8 shadow-xl shadow-accent/30 ring-1 ring-white/20">
              G
            </div>

            <h1 className="font-display text-5xl md:text-6xl text-cream mb-4 leading-tight tracking-tight">
              {greeting()},{" "}
              <span className="bg-gradient-to-r from-accent-light via-purple-300 to-sprout-light bg-clip-text text-transparent">
                {user?.name || "Friend"}
              </span>
            </h1>

            <p className="text-muted text-lg md:text-xl max-w-lg mx-auto mb-10 leading-relaxed font-light">
              Your personal space to grow. Track focus sessions, capture
              learnings, and watch your progress bloom.
            </p>

            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 20px 40px -15px rgba(124, 58, 237, 0.4)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowApp(true)}
              className="bg-accent hover:bg-accent-light text-white font-medium text-lg px-10 py-4 rounded-2xl transition-all shadow-lg shadow-accent/25 flex items-center gap-2 mx-auto"
            >
              <span>Get Started</span>
              <span className="text-xl">→</span>
            </motion.button>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-8 mt-16 text-sm text-muted"
            >
              <div className="flex items-center gap-2 bg-white/[0.03] px-3.5 py-1.5 rounded-full border border-white/5">
                <span className="text-emerald-400 text-xs">●</span>
                <span>Track focus sessions</span>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.03] px-3.5 py-1.5 rounded-full border border-white/5">
                <span className="text-accent text-xs">●</span>
                <span>Build knowledge garden</span>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.03] px-3.5 py-1.5 rounded-full border border-white/5">
                <span className="text-amber-400 text-xs">●</span>
                <span>Visualize growth</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-cream relative overflow-hidden">
      <div className="bg-glow-purple -top-40 right-0 opacity-30" />
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={() => setShowApp(false)}
            className="text-muted text-sm hover:text-cream transition-colors mb-6 flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 hover:border-white/10"
          >
            <span>←</span> Back Overview
          </button>

          <h1 className="font-display text-3xl text-cream mb-8">
            What would you like to do?
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              to="/focus-checkin"
              className="group glass-panel rounded-2xl p-6 hover:border-accent/40 transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-accent/10"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                🎯
              </div>
              <h3 className="font-display text-lg text-cream mb-2 group-hover:text-accent transition-colors">
                Focus Check-in
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Log your focus sessions and track productivity.
              </p>
            </Link>

            <Link
              to="/notes"
              className="group glass-panel rounded-2xl p-6 hover:border-accent/40 transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-accent/10"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                🌱
              </div>
              <h3 className="font-display text-lg text-cream mb-2 group-hover:text-accent transition-colors">
                Knowledge Garden
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Capture and organize everything you learn.
              </p>
            </Link>

            <Link
              to="/tasks"
              className="group glass-panel rounded-2xl p-6 hover:border-accent/40 transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-accent/10"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                ✅
              </div>
              <h3 className="font-display text-lg text-cream mb-2 group-hover:text-accent transition-colors">
                Tasks & Goals
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Manage tasks and track your goals.
              </p>
            </Link>

            <Link
              to="/analytics"
              className="group glass-panel rounded-2xl p-6 hover:border-accent/40 transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-accent/10"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                📊
              </div>
              <h3 className="font-display text-lg text-cream mb-2 group-hover:text-accent transition-colors">
                Analytics
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Visualize your progress and growth patterns.
              </p>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {loading ? (
              <>
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </>
            ) : (
              <>
                <div className="glass-panel rounded-xl p-4 text-center hover:border-accent/30 transition-colors">
                  <p className="font-display text-2xl text-accent">{stats.notes}</p>
                  <p className="text-muted text-xs mt-1">Notes</p>
                </div>
                <div className="glass-panel rounded-xl p-4 text-center hover:border-orange-500/30 transition-colors">
                  <p className="font-display text-2xl text-orange-400">🔥 {stats.streak}d</p>
                  <p className="text-muted text-xs mt-1">Focus Streak</p>
                </div>
                <div className="glass-panel rounded-xl p-4 text-center hover:border-green-500/30 transition-colors">
                  <p className="font-display text-2xl text-green-400">{stats.sessions}</p>
                  <p className="text-muted text-xs mt-1">Sessions Today</p>
                </div>
                <div className="glass-panel rounded-xl p-4 text-center hover:border-purple-500/30 transition-colors">
                  <p className="font-display text-2xl text-purple-400">{stats.avgFocus} / 5</p>
                  <p className="text-muted text-xs mt-1">Avg Focus</p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;
