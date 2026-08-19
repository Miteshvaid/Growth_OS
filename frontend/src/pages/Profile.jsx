import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import { getProfile, updateProfile, changePassword } from "../api/auth";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const [userData, setUserData] = useState({
    _id: "",
    name: "",
    email: "",
    createdAt: "",
  });

  const [stats, setStats] = useState({
    notes: 0,
    streak: 0,
    logs: 0,
    totalTasks: 0,
    completedTasks: 0,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
  });

  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const savedImg = localStorage.getItem("profileImage");
    if (savedImg) setProfileImage(savedImg);

    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      if (res.data) {
        setUserData({
          _id: res.data._id || "",
          name: res.data.name || "",
          email: res.data.email || "",
          createdAt: res.data.createdAt || "",
        });
        setEditForm({
          name: res.data.name || "",
          email: res.data.email || "",
        });
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      toast.error("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        localStorage.setItem("profileImage", reader.result);
        toast.success("Profile avatar updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast.error("Name and Email cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile(editForm);
      toast.success(res.data.message || "Profile updated successfully!");

      // Update localStorage user token state if needed
      const existingUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...existingUser,
          name: editForm.name,
          email: editForm.email,
        })
      );

      setUserData((prev) => ({
        ...prev,
        name: editForm.name,
        email: editForm.email,
      }));
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passForm.currentPassword || !passForm.newPassword) {
      toast.error("Please fill in current and new password");
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    setChangingPass(true);
    try {
      const res = await changePassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      toast.success(res.data.message || "Password changed successfully!");
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error("Password change error:", err);
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPass(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <div className="px-4 py-10 max-w-4xl mx-auto space-y-8">
        {/* Header navigation */}
        <div>
          <Link to="/dashboard" className="text-muted text-sm hover:text-accent">
            ← Dashboard
          </Link>
          <h1 className="font-display text-3xl text-cream mt-2">
            Profile & Settings
          </h1>
          <p className="text-muted text-xs sm:text-sm mt-1">
            Manage your personal details, security settings, and productivity achievements.
          </p>
        </div>

        {/* Profile Card / Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-ink-light border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-accent text-white flex items-center justify-center text-3xl font-bold ring-4 ring-white/10 overflow-hidden shadow-xl">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userData.name?.charAt(0)?.toUpperCase() || "U"
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:bg-accent-light transition-colors shadow-lg">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="font-display text-2xl text-cream font-bold">
                {userData.name}
              </h2>
              <p className="text-muted text-sm">{userData.email}</p>
              {userData.createdAt && (
                <p className="text-xs text-muted/70 mt-1">
                  Member since {new Date(userData.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-medium transition-all"
          >
            Log Out Account
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-ink-light border border-white/5 rounded-xl p-4 text-center hover:border-accent/30 transition-colors">
            <p className="text-2xl font-display text-accent">{stats.notes}</p>
            <p className="text-xs text-muted mt-1">Notes Created</p>
          </div>
          <div className="bg-ink-light border border-white/5 rounded-xl p-4 text-center hover:border-orange-500/30 transition-colors">
            <p className="text-2xl font-display text-orange-400">🔥 {stats.streak}d</p>
            <p className="text-xs text-muted mt-1">Current Streak</p>
          </div>
          <div className="bg-ink-light border border-white/5 rounded-xl p-4 text-center hover:border-green-500/30 transition-colors">
            <p className="text-2xl font-display text-green-400">{stats.completedTasks} / {stats.totalTasks}</p>
            <p className="text-xs text-muted mt-1">Tasks Completed ({completionRate}%)</p>
          </div>
          <div className="bg-ink-light border border-white/5 rounded-xl p-4 text-center hover:border-purple-500/30 transition-colors">
            <p className="text-2xl font-display text-purple-400">{stats.logs}</p>
            <p className="text-xs text-muted mt-1">Focus Check-ins</p>
          </div>
        </div>

        {/* Growth Achievements & Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-ink-light border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-cream flex items-center gap-2">
              <span>🏆</span> Growth Milestones & Badges
            </h3>
            <span className="text-xs text-accent bg-accent/10 px-3 py-1 rounded-full font-medium border border-accent/20">
              Level {Math.floor((stats.notes + stats.completedTasks + stats.logs) / 5) + 1} Gardener
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition-all ${stats.notes >= 1 ? "bg-accent/10 border-accent/30 text-cream" : "bg-white/5 border-white/5 opacity-50"}`}>
              <span className="text-2xl mb-1">🌱</span>
              <p className="text-xs font-semibold">First Seed</p>
              <p className="text-[10px] text-muted mt-0.5">Created 1+ Note</p>
            </div>

            <div className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition-all ${stats.completedTasks >= 5 ? "bg-green-500/10 border-green-500/30 text-cream" : "bg-white/5 border-white/5 opacity-50"}`}>
              <span className="text-2xl mb-1">⚡</span>
              <p className="text-xs font-semibold">Task Master</p>
              <p className="text-[10px] text-muted mt-0.5">5+ Tasks Done</p>
            </div>

            <div className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition-all ${stats.streak >= 3 ? "bg-orange-500/10 border-orange-500/30 text-cream" : "bg-white/5 border-white/5 opacity-50"}`}>
              <span className="text-2xl mb-1">🔥</span>
              <p className="text-xs font-semibold">Streak Flame</p>
              <p className="text-[10px] text-muted mt-0.5">3+ Day Streak</p>
            </div>

            <div className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition-all ${stats.logs >= 5 ? "bg-purple-500/10 border-purple-500/30 text-cream" : "bg-white/5 border-white/5 opacity-50"}`}>
              <span className="text-2xl mb-1">🧘</span>
              <p className="text-xs font-semibold">Deep Focus</p>
              <p className="text-[10px] text-muted mt-0.5">5+ Check-ins</p>
            </div>
          </div>
        </motion.div>

        {/* Form Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Edit Profile Form */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-ink-light border border-white/10 rounded-2xl p-6"
          >
            <h3 className="font-display text-lg text-cream mb-4 flex items-center gap-2">
              <span>👤</span> Edit Personal Information
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full bg-ink border border-white/10 rounded-xl px-3.5 py-2.5 text-cream text-sm focus:outline-none focus:border-accent transition-colors"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full bg-ink border border-white/10 rounded-xl px-3.5 py-2.5 text-cream text-sm focus:outline-none focus:border-accent transition-colors"
                  placeholder="your.email@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-accent hover:bg-accent-light text-white text-xs font-medium py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {saving && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Save Changes
              </button>
            </form>
          </motion.div>

          {/* Change Password Form */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-ink-light border border-white/10 rounded-2xl p-6"
          >
            <h3 className="font-display text-lg text-cream mb-4 flex items-center gap-2">
              <span>🔒</span> Security & Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passForm.currentPassword}
                  onChange={(e) =>
                    setPassForm({ ...passForm, currentPassword: e.target.value })
                  }
                  className="w-full bg-ink border border-white/10 rounded-xl px-3.5 py-2 text-cream text-sm focus:outline-none focus:border-accent transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passForm.newPassword}
                  onChange={(e) =>
                    setPassForm({ ...passForm, newPassword: e.target.value })
                  }
                  className="w-full bg-ink border border-white/10 rounded-xl px-3.5 py-2 text-cream text-sm focus:outline-none focus:border-accent transition-colors"
                  placeholder="Min 8 chars, 1 uppercase, 1 special"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passForm.confirmPassword}
                  onChange={(e) =>
                    setPassForm({ ...passForm, confirmPassword: e.target.value })
                  }
                  className="w-full bg-ink border border-white/10 rounded-xl px-3.5 py-2 text-cream text-sm focus:outline-none focus:border-accent transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={changingPass}
                className="w-full bg-white/10 hover:bg-white/20 text-cream text-xs font-medium py-2.5 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                {changingPass && (
                  <span className="w-3.5 h-3.5 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
                )}
                Update Password
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
