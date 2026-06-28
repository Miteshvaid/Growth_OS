import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Toast({ message, type, onClose }) {
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
