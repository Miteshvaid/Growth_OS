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
      <div className="min-h-screen bg-ink text-cream relative overflow-hidden flex flex-col justify-between">
        <div className="bg-glow-purple -top-32 -left-32 opacity-40 animate-pulse" />
        <div className="bg-glow-green -bottom-32 -right-32 opacity-30" />

        <Navbar />

        {/* Hero Section */}
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent to-accent-light flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-xl shadow-accent/30 ring-1 ring-white/20">
              🌱
            </div>

            <h1 className="font-display text-4xl md:text-6xl text-cream mb-4 leading-tight tracking-tight">
              {greeting()},{" "}
              <span className="bg-gradient-to-r from-accent-light via-sprout to-amber bg-clip-text text-transparent">
                {user?.name || "Friend"}
              </span>
            </h1>

            <p className="text-muted text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed font-light">
              GrowthOS is your all-in-one productivity garden. Run focused Pomodoro sessions, cultivate notes, manage tasks, and visualize your daily progress.
            </p>

            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 20px 40px -15px rgba(46, 91, 62, 0.4)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowApp(true)}
              className="bg-accent hover:bg-accent-light text-white font-medium text-base px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-accent/25 flex items-center gap-2 mx-auto"
            >
              <span>Enter Workspace</span>
              <span className="text-lg">→</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Section 2: What is GrowthOS & Feature Blocks */}
        <div className="max-w-5xl mx-auto px-6 py-12 relative z-10 border-t border-white/5">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl text-cream mb-2">Everything You Need to Bloom</h2>
            <p className="text-muted text-sm max-w-md mx-auto">Designed for intentional deep work and continuous self-improvement.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-ink-light border border-white/5 rounded-2xl p-6 shadow-sm">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-display text-lg text-cream mb-2">Pomodoro & Focus</h3>
              <p className="text-muted text-xs leading-relaxed">
                Run customized focus blocks with custom duration timer, sound chimes, and browser notifications that auto-log your focus score.
              </p>
            </div>

            <div className="bg-ink-light border border-white/5 rounded-2xl p-6 shadow-sm">
              <div className="text-3xl mb-3">🌿</div>
              <h3 className="font-display text-lg text-cream mb-2">Knowledge Garden</h3>
              <p className="text-muted text-xs leading-relaxed">
                Organize thoughts with custom note icons, AI summaries, automated quizzes, and one-click PDF exports.
              </p>
            </div>

            <div className="bg-ink-light border border-white/5 rounded-2xl p-6 shadow-sm">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="font-display text-lg text-cream mb-2">Rich Analytics</h3>
              <p className="text-muted text-xs leading-relaxed">
                Track your streak, focus ratings, task completion rates, activity distribution, and historical heatmap.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: How It Works */}
        <div className="max-w-5xl mx-auto px-6 py-12 relative z-10 border-t border-white/5">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl text-cream mb-2">3 Steps to Daily Growth</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center mx-auto mb-3">1</div>
              <h4 className="font-medium text-cream text-sm mb-1">Set Your Focus Session</h4>
              <p className="text-muted text-xs">Choose custom focus & break minutes, pick an activity, and launch the timer.</p>
            </div>

            <div className="p-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center mx-auto mb-3">2</div>
              <h4 className="font-medium text-cream text-sm mb-1">Plant Your Knowledge</h4>
              <p className="text-muted text-xs">Jot down notes, attach custom emojis, generate AI quizzes and summaries.</p>
            </div>

            <div className="p-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center mx-auto mb-3">3</div>
              <h4 className="font-medium text-cream text-sm mb-1">Watch Your Garden Grow</h4>
              <p className="text-muted text-xs">Review daily summaries, build focus streaks, and export reports anytime.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/5 py-6 text-center text-xs text-muted">
          <p>© {new Date().getFullYear()} GrowthOS — Cultivate Your Best Self 🌱</p>
        </footer>
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

          <div className="mb-8">
            <h1 className="font-display text-3xl text-cream mb-2">
              What would you like to do today?
            </h1>
            <p className="text-muted text-sm">
              Welcome back to your workspace. Select a module below to start focusing, managing tasks, or analyzing your growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <Link
              to="/focus-checkin"
              className="group bg-ink-light border border-white/10 rounded-2xl p-6 hover:border-accent/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/10 flex flex-col justify-between"
            >
              <div>
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                  🎯
                </div>
                <h3 className="font-display text-lg text-cream mb-2 group-hover:text-accent transition-colors">
                  Focus Check-in
                </h3>
                <p className="text-muted text-xs leading-relaxed mb-4">
                  Run custom Pomodoro sessions, log activities like System Design & Coding, and track real-time focus ratings.
                </p>
              </div>
              <span className="text-[11px] text-accent font-medium group-hover:underline flex items-center gap-1">
                Start Session →
              </span>
            </Link>

            <Link
              to="/notes"
              className="group bg-ink-light border border-white/10 rounded-2xl p-6 hover:border-accent/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/10 flex flex-col justify-between"
            >
              <div>
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                  🌱
                </div>
                <h3 className="font-display text-lg text-cream mb-2 group-hover:text-accent transition-colors">
                  Knowledge Garden
                </h3>
                <p className="text-muted text-xs leading-relaxed mb-4">
                  Capture thoughts with rich text & custom emojis, generate Gemini AI summaries, quizzes, and one-click PDF exports.
                </p>
              </div>
              <span className="text-[11px] text-accent font-medium group-hover:underline flex items-center gap-1">
                Explore Garden →
              </span>
            </Link>

            <Link
              to="/tasks"
              className="group bg-ink-light border border-white/10 rounded-2xl p-6 hover:border-accent/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/10 flex flex-col justify-between"
            >
              <div>
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                  ✅
                </div>
                <h3 className="font-display text-lg text-cream mb-2 group-hover:text-accent transition-colors">
                  Tasks & Goals
                </h3>
                <p className="text-muted text-xs leading-relaxed mb-4">
                  Organize tasks on a Kanban board, assign priorities & due dates, and align your daily execution with long-term goals.
                </p>
              </div>
              <span className="text-[11px] text-accent font-medium group-hover:underline flex items-center gap-1">
                Manage Tasks →
              </span>
            </Link>

            <Link
              to="/analytics"
              className="group bg-ink-light border border-white/10 rounded-2xl p-6 hover:border-accent/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/10 flex flex-col justify-between"
            >
              <div>
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                  📊
                </div>
                <h3 className="font-display text-lg text-cream mb-2 group-hover:text-accent transition-colors">
                  Analytics
                </h3>
                <p className="text-muted text-xs leading-relaxed mb-4">
                  Visualize historical focus trends, 90-day activity heatmaps, task completion metrics, and export PDF/CSV reports.
                </p>
              </div>
              <span className="text-[11px] text-accent font-medium group-hover:underline flex items-center gap-1">
                View Trends →
              </span>
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
                <div className="bg-ink-light border border-white/10 rounded-xl p-4 text-center hover:border-accent/30 transition-colors">
                  <p className="font-display text-2xl text-accent">{stats.notes}</p>
                  <p className="text-muted text-xs mt-1">Notes</p>
                </div>
                <div className="bg-ink-light border border-white/10 rounded-xl p-4 text-center hover:border-orange-500/30 transition-colors">
                  <p className="font-display text-2xl text-orange-400">🔥 {stats.streak}d</p>
                  <p className="text-muted text-xs mt-1">Focus Streak</p>
                </div>
                <div className="bg-ink-light border border-white/10 rounded-xl p-4 text-center hover:border-green-500/30 transition-colors">
                  <p className="font-display text-2xl text-emerald-400">{stats.sessions}</p>
                  <p className="text-muted text-xs mt-1">Sessions Today</p>
                </div>
                <div className="bg-ink-light border border-white/10 rounded-xl p-4 text-center hover:border-purple-500/30 transition-colors">
                  <p className="font-display text-2xl text-indigo-400">{stats.avgFocus} / 5</p>
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
