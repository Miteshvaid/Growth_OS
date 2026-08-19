import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../api/tasks";

// Toast notification component
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

const PRIORITY_CONFIG = {
  high: { label: "High", color: "bg-rose-500/15 text-rose-400 border-rose-500/30", dot: "🔴" },
  medium: { label: "Medium", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "🟡" },
  low: { label: "Low", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "🟢" },
};

const COLUMNS = [
  { id: "todo", label: "To Do", icon: "📋", badge: "bg-white/10 text-cream" },
  { id: "in-progress", label: "In Progress", icon: "⚡", badge: "bg-accent/20 text-accent-light" },
  { id: "done", label: "Completed", icon: "✨", badge: "bg-emerald-500/20 text-emerald-400" },
];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    dueDate: "",
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await getTasks();
      const data = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      setTasks(data);
    } catch (err) {
      console.error("Fetch tasks error:", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const openNewTaskModal = (defaultStatus = "todo") => {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      status: defaultStatus,
      dueDate: "",
    });
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "medium",
      status: task.status || "todo",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingTask) {
        await updateTask(editingTask._id, formData);
        showToast("Task updated ✅");
      } else {
        await createTask(formData);
        showToast("Task created ✅");
      }
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      console.error("Submit task error:", err);
      showToast("Operation failed", "error");
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await updateTask(task._id, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error("Status update error:", err);
      showToast("Status change failed", "error");
    }
  };

  const handleDelete = async (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      await deleteTask(id);
      showToast("Task deleted ✅");
      fetchTasks();
    } catch (err) {
      console.error("Delete task error:", err);
      showToast("Delete failed", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === "done") return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesPriority = filterPriority === "all" || t.priority === filterPriority;
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesPriority && matchesSearch;
  });

  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in-progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;

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

      <div className="max-w-6xl mx-auto px-4 py-10">
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
              Tasks & Goals
            </h1>
            <p className="text-muted text-sm mt-1">
              Organize your priorities, track execution, and meet deadlines
            </p>
          </div>
          <button
            onClick={() => openNewTaskModal("todo")}
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
            Add Task
          </button>
        </motion.div>

        {/* Top Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-ink-light border border-white/5 rounded-xl p-4 text-center">
            <p className="font-display text-2xl text-cream">{tasks.length}</p>
            <p className="text-muted text-xs mt-1">Total Tasks</p>
          </div>
          <div className="bg-ink-light border border-white/5 rounded-xl p-4 text-center">
            <p className="font-display text-2xl text-accent-light">{inProgressCount}</p>
            <p className="text-muted text-xs mt-1">In Progress</p>
          </div>
          <div className="bg-ink-light border border-white/5 rounded-xl p-4 text-center">
            <p className="font-display text-2xl text-emerald-400">{doneCount}</p>
            <p className="text-muted text-xs mt-1">Completed</p>
          </div>
          <div className="bg-ink-light border border-white/5 rounded-xl p-4 text-center">
            <p className="font-display text-2xl text-rose-400">{overdueCount}</p>
            <p className="text-muted text-xs mt-1">Overdue</p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-8"
        >
          <div className="relative flex-1 max-w-md">
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
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-ink-light border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-cream placeholder-muted/50 focus:outline-none focus:border-accent text-sm"
            />
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs text-muted mr-1">Priority:</span>
            {["all", "high", "medium", "low"].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`text-xs px-3 py-1.5 rounded-full capitalize transition-all ${
                  filterPriority === p
                    ? "bg-accent text-white font-medium"
                    : "bg-white/5 text-muted hover:text-cream hover:bg-white/10"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Kanban Board Columns */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-ink-light border border-white/5 rounded-2xl p-5 space-y-4 animate-pulse">
                <div className="h-6 w-24 bg-white/10 rounded-lg" />
                <div className="h-28 bg-white/5 rounded-xl" />
                <div className="h-28 bg-white/5 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);

              return (
                <div
                  key={col.id}
                  className="bg-ink-light border border-white/5 rounded-2xl p-5 flex flex-col min-h-[450px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{col.icon}</span>
                      <h2 className="font-display text-base text-cream">{col.label}</h2>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${col.badge}`}>
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Task Cards */}
                  <div className="space-y-3 flex-1">
                    <AnimatePresence mode="popLayout">
                      {colTasks.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-12 border border-dashed border-white/5 rounded-xl"
                        >
                          <p className="text-muted text-xs mb-3">No tasks in {col.label.toLowerCase()}</p>
                          <button
                            onClick={() => openNewTaskModal(col.id)}
                            className="text-xs text-accent hover:text-accent-light transition-colors"
                          >
                            + Add one here
                          </button>
                        </motion.div>
                      ) : (
                        colTasks.map((task) => {
                          const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                          const overdue = isOverdue(task.dueDate, task.status);
                          const isDeleting = deletingId === task._id;

                          return (
                            <motion.div
                              key={task._id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: isDeleting ? 0.3 : 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              className="bg-ink border border-white/5 rounded-xl p-4 hover:border-accent/30 transition-all group relative cursor-pointer"
                              onClick={() => openEditModal(task)}
                            >
                              {/* Header & Badges */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className={`text-sm font-medium flex-1 ${task.status === "done" ? "line-through text-muted" : "text-cream"}`}>
                                  {task.title}
                                </h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priority.color}`}>
                                  {priority.dot} {priority.label}
                                </span>
                              </div>

                              {/* Description */}
                              {task.description && (
                                <p className="text-muted text-xs line-clamp-2 mb-3 leading-relaxed">
                                  {task.description}
                                </p>
                              )}

                              {/* Footer & Due Date */}
                              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                                {task.dueDate ? (
                                  <span className={`text-[11px] flex items-center gap-1 ${overdue ? "text-rose-400 font-medium" : "text-muted"}`}>
                                    📅 {new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                                    {overdue && " (Overdue)"}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-muted/40">No due date</span>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  {/* Move status buttons */}
                                  {task.status !== "todo" && (
                                    <button
                                      title="Move to Todo"
                                      onClick={() => handleStatusChange(task, "todo")}
                                      className="p-1 text-muted hover:text-cream rounded hover:bg-white/5 text-xs"
                                    >
                                      ⏪
                                    </button>
                                  )}
                                  {task.status !== "in-progress" && (
                                    <button
                                      title="Move to In Progress"
                                      onClick={() => handleStatusChange(task, "in-progress")}
                                      className="p-1 text-muted hover:text-accent-light rounded hover:bg-white/5 text-xs"
                                    >
                                      ⚡
                                    </button>
                                  )}
                                  {task.status !== "done" ? (
                                    <button
                                      title="Mark Complete"
                                      onClick={() => handleStatusChange(task, "done")}
                                      className="p-1 text-muted hover:text-emerald-400 rounded hover:bg-white/5 text-xs"
                                    >
                                      ✅
                                    </button>
                                  ) : (
                                    <button
                                      title="Reopen Task"
                                      onClick={() => handleStatusChange(task, "todo")}
                                      className="p-1 text-muted hover:text-amber-400 rounded hover:bg-white/5 text-xs"
                                    >
                                      🔄
                                    </button>
                                  )}

                                  {/* Delete with inline confirmation */}
                                  {confirmDeleteId === task._id ? (
                                    <div className="flex items-center gap-1 ml-1">
                                      <button
                                        onClick={() => handleDelete(task._id)}
                                        className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="text-[10px] px-1.5 py-0.5 bg-white/5 text-muted rounded hover:bg-white/10"
                                      >
                                        ✗
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleDelete(task._id)}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-rose-400 rounded hover:bg-rose-500/10 transition-all text-xs"
                                    >
                                      <svg
                                        className="w-3.5 h-3.5"
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
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Add task button in column footer */}
                  <button
                    onClick={() => openNewTaskModal(col.id)}
                    className="mt-4 w-full py-2 border border-dashed border-white/10 hover:border-accent/40 rounded-xl text-xs text-muted hover:text-cream transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>+</span> Add Task
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Modal (Create / Edit) */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-ink-light border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-cream">
                  {editingTask ? "Edit Task" : "New Task"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-muted hover:text-cream p-1 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-muted mb-1.5 block">Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Complete System Design Chapter"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full bg-ink border border-white/10 rounded-xl px-4 py-2.5 text-cream placeholder-muted/50 focus:outline-none focus:border-accent text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted mb-1.5 block">Description</label>
                  <textarea
                    placeholder="Add more details, checkpoints, or notes..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full bg-ink border border-white/10 rounded-xl px-4 py-2.5 text-cream placeholder-muted/50 focus:outline-none focus:border-accent resize-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted mb-1.5 block">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full bg-ink border border-white/10 rounded-xl px-3 py-2.5 text-cream focus:outline-none focus:border-accent text-xs"
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-muted mb-1.5 block">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-ink border border-white/10 rounded-xl px-3 py-2.5 text-cream focus:outline-none focus:border-accent text-xs"
                    >
                      <option value="todo">📋 To Do</option>
                      <option value="in-progress">⚡ In Progress</option>
                      <option value="done">✨ Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-muted mb-1.5 block">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full bg-ink border border-white/10 rounded-xl px-3 py-2 text-cream focus:outline-none focus:border-accent text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-2.5 text-sm transition-all shadow-lg shadow-accent/20"
                  >
                    {editingTask ? "Save Changes" : "Create Task"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 text-muted hover:text-cream bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors"
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
  );
}
