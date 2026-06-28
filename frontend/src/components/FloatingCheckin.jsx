import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createCheckin } from "../api/focusCheckin";
import Toast from "./Toast";

const ACTIVITIES = [
  {
    type: "Studying",
    emoji: "📚",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    type: "Coding",
    emoji: "💻",
    color: "bg-accent/20 text-accent border-accent/30",
  },
  {
    type: "Distracted",
    emoji: "🌀",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  {
    type: "Break",
    emoji: "☕",
    color: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  },
  {
    type: "Other",
    emoji: "📝",
    color: "bg-white/10 text-muted border-white/20",
  },
];

export default function FloatingCheckin() {
  const [isOpen, setIsOpen] = useState(false);
  const [focusRating, setFocusRating] = useState(3);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleCheckin = async (activityType) => {
    try {
      await createCheckin({ activityType, focusRating });
      showToast("Check-in logged ✅");
      setIsOpen(false);
      setFocusRating(3);
    } catch (err) {
      console.error(err);
      showToast("Failed to log", "error");
    }
  };

  return (
    <>
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-accent text-white rounded-full shadow-lg shadow-accent/30 flex items-center justify-center text-2xl z-40 hover:bg-accent-light transition-colors"
      >
        {isOpen ? "✕" : "⚡"}
      </motion.button>

      {/* Check-in Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-80 bg-ink-light border border-white/10 rounded-2xl p-5 shadow-xl z-40"
          >
            <h3 className="text-cream font-medium mb-1">Quick Check-in</h3>
            <p className="text-muted text-xs mb-4">
              What are you doing right now?
            </p>

            {/* Activity Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {ACTIVITIES.map((a) => (
                <button
                  key={a.type}
                  onClick={() => handleCheckin(a.type)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all hover:scale-[1.02] ${a.color}`}
                >
                  <span>{a.emoji}</span>
                  {a.type}
                </button>
              ))}
            </div>

            {/* Focus Rating */}
            <div className="mb-2">
              <p className="text-muted text-xs mb-2">
                Focus level: {focusRating}/5
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setFocusRating(n)}
                    className={`flex-1 h-8 rounded-lg text-xs font-medium transition-all ${
                      focusRating >= n
                        ? "bg-accent text-white"
                        : "bg-white/5 text-muted hover:bg-white/10"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
