import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { getNotes } from "../api/notes";
import { getTodayCheckins, getDailySummary } from "../api/focusCheckin";

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
      const [notesRes, checkinsRes, summaryRes] = await Promise.all([
        getNotes().catch(() => ({ data: [] })),
        getTodayCheckins().catch(() => ({ data: [] })),
        getDailySummary().catch(() => ({ data: { total: 0, avgFocus: 0 } })),
      ]);

      const notes = notesRes.data || [];
      const checkins = checkinsRes.data || [];
      const summary = summaryRes.data || {};

      // Calculate streak from checkins
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

  // --- LANDING VIEW ---
  if (!showApp) {
    return (
      <div className="min-h-screen bg-ink text-cream">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-20 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-white text-2xl font-bold mx-auto mb-8 shadow-lg shadow-accent/30">
              G
            </div>

            <h1 className="font-display text-5xl md:text-6xl text-cream mb-4 leading-tight">
              {greeting()},{" "}
              <span className="text-accent">{user?.name || "Friend"}</span>
            </h1>

            <p className="text-muted text-lg md:text-xl max-w-lg mx-auto mb-10 leading-relaxed">
              Your personal space to grow. Track focus sessions, capture
              learnings, and watch your progress bloom.
            </p>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowApp(true)}
              className="bg-accent hover:bg-accent-light text-white font-medium text-lg px-10 py-4 rounded-2xl transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40"
            >
              Get Started →
            </motion.button>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-8 mt-16 text-sm text-muted"
            >
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">●</span>
                <span>Track focus sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent">●</span>
                <span>Build knowledge garden</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400">●</span>
                <span>Visualize growth</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- APP VIEW ---
  return (
    <div className="min-h-screen bg-ink text-cream">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={() => setShowApp(false)}
            className="text-muted text-sm hover:text-cream transition-colors mb-6"
          >
            ← Back
          </button>

          <h1 className="font-display text-3xl text-cream mb-8">
            What would you like to do?
          </h1>

          {/* 3 Cards — Tasks hata diya */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/focus-checkin"
              className="group bg-ink-light border border-white/5 rounded-2xl p-6 hover:border-accent/30 transition-all hover:-translate-y-1"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                🎯
              </div>
              <h3 className="font-display text-lg text-cream mb-2">
                Focus Check-in
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Log your focus sessions and track productivity.
              </p>
            </Link>

            <Link
              to="/notes"
              className="group bg-ink-light border border-white/5 rounded-2xl p-6 hover:border-accent/30 transition-all hover:-translate-y-1"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                🌱
              </div>
              <h3 className="font-display text-lg text-cream mb-2">
                Knowledge Garden
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Capture and organize everything you learn.
              </p>
            </Link>

            <Link
              to="/analytics"
              className="group bg-ink-light border border-white/5 rounded-2xl p-6 hover:border-accent/30 transition-all hover:-translate-y-1"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                📊
              </div>
              <h3 className="font-display text-lg text-cream mb-2">
                Analytics
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Visualize your progress and growth patterns.
              </p>
            </Link>
          </div>

          {/* Real Stats — API se aayenge */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-ink-light border border-white/5 rounded-xl p-4 text-center">
              <p className="font-display text-2xl text-cream">
                {loading ? "..." : stats.notes}
              </p>
              <p className="text-muted text-xs mt-1">Notes</p>
            </div>
            <div className="bg-ink-light border border-white/5 rounded-xl p-4 text-center">
              <p className="font-display text-2xl text-cream">
                {loading ? "..." : stats.streak}
              </p>
              <p className="text-muted text-xs mt-1">Focus Streak</p>
            </div>
            <div className="bg-ink-light border border-white/5 rounded-xl p-4 text-center">
              <p className="font-display text-2xl text-cream">
                {loading ? "..." : stats.sessions}
              </p>
              <p className="text-muted text-xs mt-1">Sessions Today</p>
            </div>
            <div className="bg-ink-light border border-white/5 rounded-xl p-4 text-center">
              <p className="font-display text-2xl text-cream">
                {loading ? "..." : stats.avgFocus}
              </p>
              <p className="text-muted text-xs mt-1">Avg Focus</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;
