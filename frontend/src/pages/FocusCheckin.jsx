import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  createCheckin,
  getTodayCheckins,
  getDailySummary,
} from "../api/focusCheckin";
import Navbar from "../components/Navbar";

function FocusCheckin() {
  const [activityType, setActivityType] = useState("Studying");
  const [focusRating, setFocusRating] = useState(3);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [todayCheckins, setTodayCheckins] = useState([]);
  const [summary, setSummary] = useState(null);

  const activities = [
    { value: "Studying", label: "📚 Studying" },
    { value: "Coding", label: "💻 Coding" },
    { value: "Distracted", label: "😵 Distracted" },
    { value: "Break", label: "☕ Break" },
    { value: "Other", label: "📝 Other" },
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
      setTodayCheckins(checkinsRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error("Failed to load", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createCheckin({ activityType, focusRating });
      setFocusRating(3);
      setNotes("");
      await loadTodayData();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-cream">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl mb-2">🎯 Focus Check-in</h1>
          <p className="text-muted mb-8">Log your focus session</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-ink-light border border-white/5 rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-6">Log Session</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm text-muted mb-3">
                    Activity
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {activities.map((a) => (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => setActivityType(a.value)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          activityType === a.value
                            ? "border-accent bg-accent/10 text-cream"
                            : "border-white/10 text-muted hover:border-white/20"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-muted mb-3">
                    Focus:{" "}
                    <span className="text-accent font-bold">
                      {focusRating}/5
                    </span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFocusRating(num)}
                        className={`flex-1 py-3 rounded-xl border transition-all ${
                          focusRating === num
                            ? "border-accent bg-accent/20 text-accent"
                            : "border-white/10 text-muted"
                        }`}
                      >
                        <div className="text-2xl">
                          {num === 1 && "😞"}
                          {num === 2 && "😕"}
                          {num === 3 && "😐"}
                          {num === 4 && "😊"}
                          {num === 5 && "🔥"}
                        </div>
                        <div className="text-xs">{num}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-muted mb-2">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What are you working on?"
                    rows={2}
                    className="w-full bg-ink border border-white/10 rounded-xl p-3 text-cream placeholder-muted focus:border-accent focus:outline-none resize-none text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent-light text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? "Saving..." : "✅ Log Session"}
                </button>
              </form>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              {summary && summary.total > 0 && (
                <div className="bg-ink-light border border-white/5 rounded-2xl p-6">
                  <h2 className="text-lg font-medium mb-4">Today's Summary</h2>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-ink rounded-xl p-3 text-center">
                      <p className="font-display text-2xl text-accent">
                        {summary.total}
                      </p>
                      <p className="text-muted text-xs">Check-ins</p>
                    </div>
                    <div className="bg-ink rounded-xl p-3 text-center">
                      <p className="font-display text-2xl text-accent">
                        {summary.avgFocus}
                      </p>
                      <p className="text-muted text-xs">Avg Focus</p>
                    </div>
                    <div className="bg-ink rounded-xl p-3 text-center">
                      <p className="font-display text-2xl text-green-400">
                        {summary.productivePercent}%
                      </p>
                      <p className="text-muted text-xs">Productive</p>
                    </div>
                    <div className="bg-ink rounded-xl p-3 text-center">
                      <p className="font-display text-2xl text-red-400">
                        {summary.distractedCount}
                      </p>
                      <p className="text-muted text-xs">Distracted</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-ink-light border border-white/5 rounded-2xl p-6">
                <h2 className="text-lg font-medium mb-4">
                  Sessions ({todayCheckins.length})
                </h2>
                {todayCheckins.length === 0 ? (
                  <p className="text-muted text-sm text-center py-4">
                    No sessions yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {todayCheckins.map((c, i) => (
                      <div
                        key={c._id || i}
                        className="flex items-center gap-3 bg-ink rounded-xl p-3"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            c.focusRating >= 4
                              ? "bg-green-400"
                              : c.focusRating >= 3
                                ? "bg-yellow-400"
                                : "bg-red-400"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm text-cream">{c.activityType}</p>
                          <p className="text-xs text-muted">
                            {new Date(c.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            c.focusRating >= 4
                              ? "text-green-400"
                              : c.focusRating >= 3
                                ? "text-yellow-400"
                                : "text-red-400"
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
      </div>
    </div>
  );
}

export default FocusCheckin;
