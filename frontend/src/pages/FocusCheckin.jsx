import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createCheckin,
  getTodayCheckins,
  getDailySummary,
} from "../api/focusCheckin";
import Navbar from "../components/Navbar";
import PomodoroTimer from "../components/PomodoroTimer";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: -20, x: "-50%" }}
      className={`fixed top-6 left-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2 ${
        type === "success"
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          : "bg-red-500/20 text-red-400 border border-red-500/30"
      }`}
    >
      {type === "success" ? "✅" : "❌"} {message}
    </motion.div>
  );
}

import { getCustomActivities, addCustomActivity } from "../api/auth";

function FocusCheckin() {
  const [activityType, setActivityType] = useState("Studying");
  const [focusRating, setFocusRating] = useState(3);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [todayCheckins, setTodayCheckins] = useState([]);
  const [summary, setSummary] = useState(null);
  const [toast, setToast] = useState(null);

  const [customActivitiesList, setCustomActivitiesList] = useState([]);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [newActName, setNewActName] = useState("");
  const [newActEmoji, setNewActEmoji] = useState("⚡");

  const defaultActivities = [
    { name: "Studying", emoji: "📚" },
    { name: "Coding", emoji: "💻" },
    { name: "Distracted", emoji: "😵" },
    { name: "Break", emoji: "☕" },
    { name: "Other", emoji: "📝" },
  ];

  useEffect(() => {
    loadTodayData();
    loadCustomActivities();
  }, []);

  const loadCustomActivities = async () => {
    try {
      const res = await getCustomActivities();
      setCustomActivitiesList(res.data || []);
    } catch (e) {
      console.error("Custom activities load error", e);
    }
  };

  const handleCreateCustomActivity = async (e) => {
    e.preventDefault();
    if (!newActName.trim()) return;
    try {
      const res = await addCustomActivity({ name: newActName.trim(), emoji: newActEmoji });
      setCustomActivitiesList(res.data || []);
      setActivityType(newActName.trim());
      setNewActName("");
      setShowAddActivityModal(false);
      showToast("Custom activity added! 🌱");
    } catch (err) {
      showToast("Failed to add custom activity", "error");
    }
  };

  const allActivities = [
    ...defaultActivities,
    ...customActivitiesList.map((ca) => ({ name: ca.name, emoji: ca.emoji })),
  ];

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    try {
      const [checkinsRes, summaryRes] = await Promise.all([
        getTodayCheckins(),
        getDailySummary(),
      ]);
      setTodayCheckins(checkinsRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      console.error("Failed to load today data", err);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createCheckin({ activityType, focusRating });
      setFocusRating(3);
      setNotes("");
      showToast("Focus session logged! 🎯");
      await loadTodayData();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to log session", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoLogCheckin = async ({ activityType: act, focusRating: rating }) => {
    try {
      await createCheckin({ activityType: act, focusRating: rating });
      showToast(`25m Pomodoro completed & logged! 🔥`);
      await loadTodayData();
    } catch (err) {
      console.error("Auto log error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-cream">
      <Navbar />

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-3xl mb-2">🎯 Focus Check-in & Timer</h1>
          <p className="text-muted mb-8">
            Run deep work Pomodoro blocks and log your productive momentum
          </p>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Pomodoro Timer & Quick Logger */}
            <div className="lg:col-span-7 space-y-6">
              {/* Pomodoro Timer */}
              <PomodoroTimer
                onAutoLogCheckin={handleAutoLogCheckin}
                currentActivity={activityType}
              />

              {/* Manual Session Log Form */}
              <div className="bg-ink-light border border-white/5 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-display text-cream mb-4">
                  Manual Session Check-in
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-xs text-muted block">
                        Activity Category
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddActivityModal(true)}
                        className="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>+ Custom Activity</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {allActivities.map((a) => (
                        <button
                          key={a.name}
                          type="button"
                          onClick={() => setActivityType(a.name)}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-1.5 ${
                            activityType === a.name
                              ? "border-accent bg-accent/15 text-cream font-medium shadow-sm"
                              : "border-white/10 text-muted hover:border-white/20 hover:text-cream"
                          }`}
                        >
                          <span>{a.emoji}</span>
                          <span>{a.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-muted mb-2.5">
                      Focus Rating:{" "}
                      <span className="text-accent font-bold">
                        {focusRating} / 5
                      </span>
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setFocusRating(num)}
                          className={`flex-1 py-2.5 rounded-xl border transition-all text-center ${
                            focusRating === num
                              ? "border-accent bg-accent/20 text-accent font-medium"
                              : "border-white/10 text-muted hover:border-white/20"
                          }`}
                        >
                          <div className="text-xl">
                            {num === 1 && "😞"}
                            {num === 2 && "😕"}
                            {num === 3 && "😐"}
                            {num === 4 && "😊"}
                            {num === 5 && "🔥"}
                          </div>
                          <div className="text-[10px] mt-0.5">{num}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-muted mb-2">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="What goals or milestones did you work on?"
                      rows={2}
                      className="w-full bg-ink border border-white/10 rounded-xl p-3 text-cream placeholder-muted/50 focus:border-accent focus:outline-none resize-none text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent hover:bg-accent-light text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 text-xs shadow-md shadow-accent/20"
                  >
                    {loading ? "Saving..." : "✅ Log Session"}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Today's Summary & Live Session Feed */}
            <div className="lg:col-span-5 space-y-6">
              {/* Summary Card */}
              {summary && summary.total > 0 && (
                <div className="bg-ink-light border border-white/5 rounded-2xl p-5 shadow-sm">
                  <h2 className="text-sm font-display text-cream mb-4">
                    Today's Summary
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-ink rounded-xl p-3 text-center border border-white/5">
                      <p className="font-display text-2xl text-accent">
                        {summary.total}
                      </p>
                      <p className="text-muted text-[11px] mt-0.5">Check-ins</p>
                    </div>
                    <div className="bg-ink rounded-xl p-3 text-center border border-white/5">
                      <p className="font-display text-2xl text-accent">
                        {summary.avgFocus}
                      </p>
                      <p className="text-muted text-[11px] mt-0.5">Avg Focus</p>
                    </div>
                    <div className="bg-ink rounded-xl p-3 text-center border border-white/5">
                      <p className="font-display text-2xl text-emerald-400">
                        {summary.productivePercent}%
                      </p>
                      <p className="text-muted text-[11px] mt-0.5">Productive</p>
                    </div>
                    <div className="bg-ink rounded-xl p-3 text-center border border-white/5">
                      <p className="font-display text-2xl text-rose-400">
                        {summary.distractedCount}
                      </p>
                      <p className="text-muted text-[11px] mt-0.5">Distracted</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sessions List Card */}
              <div className="bg-ink-light border border-white/5 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-display text-cream">
                    Today's Activity
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted">
                    {todayCheckins.length} logged
                  </span>
                </div>

                {todayCheckins.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-white/5 rounded-xl">
                    <span className="text-2xl mb-1 block">⏳</span>
                    <p className="text-muted text-xs">No sessions logged today yet</p>
                    <p className="text-muted/60 text-[10px] mt-1">
                      Start the Pomodoro timer or check in manually
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {todayCheckins.map((c, i) => (
                      <div
                        key={c._id || i}
                        className="flex items-center gap-3 bg-ink border border-white/5 rounded-xl p-3"
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            c.focusRating >= 4
                              ? "bg-emerald-400"
                              : c.focusRating >= 3
                              ? "bg-amber-400"
                              : "bg-rose-400"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-cream font-medium truncate">
                            {c.activityType}
                          </p>
                          <p className="text-[10px] text-muted">
                            {new Date(c.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold shrink-0 ${
                            c.focusRating >= 4
                              ? "text-emerald-400"
                              : c.focusRating >= 3
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          {c.focusRating}/5
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Add Custom Activity Modal */}
        <AnimatePresence>
          {showAddActivityModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
              onClick={() => setShowAddActivityModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-ink-light border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <h3 className="font-display text-lg text-cream">Add Custom Activity</h3>
                  <button
                    onClick={() => setShowAddActivityModal(false)}
                    className="text-muted hover:text-cream"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCustomActivity} className="space-y-4">
                  <div>
                    <label className="text-xs text-muted mb-1.5 block">Activity Name</label>
                    <input
                      type="text"
                      placeholder="e.g. System Design, Fitness"
                      value={newActName}
                      onChange={(e) => setNewActName(e.target.value)}
                      required
                      className="w-full bg-ink border border-white/10 rounded-xl px-4 py-2.5 text-cream text-xs focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted mb-1.5 block">Pick an Emoji</label>
                    <div className="flex gap-2 flex-wrap">
                      {["⚡", "🎨", "🧪", "🚀", "📊", "🎯", "📖", "🎧", "🏋️", "💡", "🛠️"].map((emo) => (
                        <button
                          key={emo}
                          type="button"
                          onClick={() => setNewActEmoji(emo)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                            newActEmoji === emo
                              ? "bg-accent text-white scale-110 ring-2 ring-accent/50"
                              : "bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          {emo}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-accent hover:bg-accent-light text-white text-xs font-medium rounded-xl py-2.5 transition-all shadow-md"
                    >
                      Create Activity
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddActivityModal(false)}
                      className="px-4 text-xs text-muted hover:text-cream bg-white/5 rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default FocusCheckin;
