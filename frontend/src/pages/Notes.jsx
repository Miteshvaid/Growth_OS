//////////////////////
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getNotes, createNote, updateNote, deleteNote } from "../api/notes";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

// --- Reusable Toast Component ---
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

function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  // const fetchNotes = async () => {
  //   try {
  //     const data = await getNotes();
  //     setNotes(data);
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchNotes = async () => {
    try {
      const res = await getNotes();
      console.log("Raw API response:", res);

      // Handle all cases
      let data = [];
      if (Array.isArray(res)) {
        data = res;
      } else if (res && Array.isArray(res.data)) {
        data = res.data;
      } else if (res && typeof res === "object") {
        data = [res]; // Single object wrap in array
      }

      console.log("Processed notes:", data);
      setNotes(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const openNewNoteModal = () => {
    setEditingNote(null);
    setFormData({ title: "", content: "", tags: "" });
    setShowModal(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags.join(", "),
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ title: "", content: "", tags: "" });
    setEditingNote(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      content: formData.content,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      if (editingNote) {
        await updateNote(editingNote._id, payload);
        showToast("Note updated ✅");
      } else {
        await createNote(payload);
        showToast("Note added ✅");
      }

      // Clear form + close modal + refresh
      resetForm();
      setShowModal(false);
      fetchNotes();
    } catch (err) {
      console.error(err);
      showToast("Something went wrong", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Ye note delete karna hai?")) return;
    setDeletingId(id);
    try {
      await deleteNote(id);
      showToast("Note deleted ✅");
      fetchNotes();
    } catch (err) {
      console.error(err);
      showToast("Delete failed", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const getGrowthStage = (editCount) => {
    if (editCount > 10)
      return { icon: "🌳", label: "Mature Tree", color: "text-emerald-400" };
    if (editCount > 5)
      return { icon: "🌲", label: "Growing Tree", color: "text-emerald-400" };
    if (editCount >= 2)
      return { icon: "🌿", label: "Sprout", color: "text-accent-light" };
    return { icon: "🌱", label: "Seed", color: "text-muted" };
  };

  // Group notes by tag for topic-wise sections
  const getNotesByTag = () => {
    const grouped = {};

    filteredNotes.forEach((note) => {
      if (note.tags.length === 0) {
        if (!grouped["Uncategorized"]) grouped["Uncategorized"] = [];
        grouped["Uncategorized"].push(note);
      } else {
        note.tags.forEach((tag) => {
          if (!grouped[tag]) grouped[tag] = [];
          grouped[tag].push(note);
        });
      }
    });

    return grouped;
  };

  // ✅ ALTERNATIVE (no flatMap)
  const allTags = [
    ...new Set(notes.reduce((acc, n) => acc.concat(n.tags || []), [])),
  ];
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !activeTag || note.tags.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const getTagColor = (tag, index) => {
    const colors = [
      "bg-accent/10 text-accent",
      "bg-emerald-500/10 text-emerald-400",
      "bg-amber-500/10 text-amber-400",
      "bg-sky-500/10 text-sky-400",
      "bg-rose-500/10 text-rose-400",
      "bg-violet-500/10 text-violet-400",
    ];
    return colors[index % colors.length];
  };

  const getSectionIcon = (tag) => {
    const icons = {
      DSA: "🧮",
      Coding: "💻",
      Java: "☕",
      React: "⚛️",
      JavaScript: "📜",
      Aptitude: "🧠",
      String: "🔤",
      Array: "📊",
      System: "⚙️",
      Design: "🎨",
    };
    return icons[tag] || "📝";
  };

  const notesByTag = getNotesByTag();
  const sortedTags = Object.keys(notesByTag).sort((a, b) => {
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <div className="px-4 py-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
          >
            <div>
              <Link
                to="/dashboard"
                className="text-muted text-sm hover:text-accent transition-colors"
              >
                ← Dashboard
              </Link>
              <h1 className="font-display text-3xl text-cream mt-2">
                Knowledge Garden
              </h1>
              <p className="text-muted text-sm mt-1">
                {notes.length} {notes.length === 1 ? "note" : "notes"} growing
              </p>
            </div>
            <button
              onClick={openNewNoteModal}
              className="bg-accent hover:bg-accent-light text-white font-medium rounded-xl px-6 py-3 transition-all shadow-lg shadow-accent/20 hover:shadow-accent/30 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Note
            </button>
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-6"
          >
            <div className="relative mb-4">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-ink-light border border-white/10 rounded-xl pl-11 pr-4 py-3 text-cream placeholder-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>

            {allTags.length > 0 && (
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs text-muted mr-1">Filter:</span>
                <button
                  onClick={() => setActiveTag(null)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    !activeTag
                      ? "bg-accent text-white"
                      : "bg-white/5 text-muted hover:text-cream hover:bg-white/10"
                  }`}
                >
                  All
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                      activeTag === tag
                        ? "bg-accent text-white"
                        : "bg-white/5 text-muted hover:text-cream hover:bg-white/10"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 border border-white/5 rounded-2xl bg-ink-light"
            >
              <div className="text-4xl mb-3">🌱</div>
              <p className="text-muted mb-1">
                {notes.length === 0
                  ? "Koi note nahi hai abhi"
                  : "Koi match nahi mila"}
              </p>
              <p className="text-muted/50 text-sm">
                {notes.length === 0
                  ? "Pehla seed plant karo"
                  : "Try different search"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {sortedTags.map((tag) => (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xl">{getSectionIcon(tag)}</span>
                    <h2 className="font-display text-lg text-cream">{tag}</h2>
                    <span className="text-xs text-muted bg-white/5 px-2 py-1 rounded-full">
                      {notesByTag[tag].length}
                    </span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  {/* Notes Grid for this section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {notesByTag[tag].map((note, i) => {
                        const stage = getGrowthStage(note.editCount);
                        const isDeleting = deletingId === note._id;
                        return (
                          <motion.div
                            key={note._id}
                            layout
                            initial={{ opacity: 0, y: 15 }}
                            animate={{
                              opacity: isDeleting ? 0.3 : 1,
                              y: 0,
                              scale: isDeleting ? 0.95 : 1,
                            }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.25, delay: i * 0.02 }}
                            className="group bg-ink-light border border-white/5 rounded-2xl p-5 cursor-pointer hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all relative overflow-hidden"
                            onClick={() => openEditModal(note)}
                          >
                            {/* Top accent line */}
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-display text-lg text-cream line-clamp-1 flex-1 mr-2">
                                {note.title}
                              </h3>
                              <div
                                className="flex items-center gap-1"
                                title={stage.label}
                              >
                                <span className="text-lg">{stage.icon}</span>
                                {note.editCount > 0 && (
                                  <span className="text-[10px] text-muted">
                                    {note.editCount}
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-muted text-sm line-clamp-3 mb-4 leading-relaxed">
                              {note.content.slice(0, 140)}
                              {note.content.length > 140 ? "..." : ""}
                            </p>

                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                              <div className="flex gap-1.5 flex-wrap">
                                {note.tags.slice(0, 3).map((t, idx) => (
                                  <span
                                    key={t}
                                    className={`text-[10px] px-2 py-1 rounded-full ${getTagColor(t, idx)}`}
                                  >
                                    {t}
                                  </span>
                                ))}
                                {note.tags.length > 3 && (
                                  <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-muted">
                                    +{note.tags.length - 3}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(note._id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all p-1.5 rounded-lg hover:bg-red-500/10"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="bg-ink-light border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl text-cream">
                    {editingNote ? "Edit Note" : "New Note"}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-muted hover:text-cream p-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-muted mb-1.5 block">
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. React Hooks Deep Dive"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                      className="w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-cream placeholder-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted mb-1.5 block">
                      Content
                    </label>
                    <textarea
                      placeholder="Write your thoughts here..."
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      required
                      rows={6}
                      className="w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-cream placeholder-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 resize-none transition-all"
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-xs text-muted">
                        {formData.content.length} chars
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted mb-1.5 block">
                      Tags
                    </label>
                    <input
                      type="text"
                      placeholder="DSA, Java, React (comma separated)"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                      className="w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-cream placeholder-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-all shadow-lg shadow-accent/20"
                    >
                      {editingNote ? "Save Changes" : "Create Note"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 text-muted hover:text-cream bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
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

export default Notes;
