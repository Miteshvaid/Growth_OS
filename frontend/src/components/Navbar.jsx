// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useTheme } from "../context/ThemeContext";

// function Navbar() {
//   const { theme, toggleTheme } = useTheme();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const user = JSON.parse(localStorage.getItem("user") || "null");

//   const handleLogout = () => {
//     localStorage.clear();
//     navigate("/login");
//   };

//   const isActive = (path) => location.pathname === path;

//   return (
//     <nav className="sticky top-0 z-50 backdrop-blur-xl bg-ink-light/80 border-b border-white/10 shadow-sm">
//       <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
//         {/* Logo */}
//         <Link to="/dashboard" className="flex items-center gap-3 group">
//           <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition">
//             G
//           </div>

//           <div>
//             <h1 className="font-display text-lg text-cream leading-none">
//               Growth OS
//             </h1>
//             <p className="text-xs text-muted">Build Better Every Day</p>
//           </div>
//         </Link>

//         {/* Navigation */}
//         <div className="hidden md:flex items-center gap-2">
//           <Link
//             to="/notes"
//             className={`px-4 py-2 rounded-xl transition-all ${
//               isActive("/notes")
//                 ? "bg-accent text-white shadow"
//                 : "text-muted hover:bg-accent/10 hover:text-accent"
//             }`}
//           >
//             🌿 Garden
//           </Link>

//           <Link
//             to="/daily-log"
//             className={`px-4 py-2 rounded-xl transition-all ${
//               isActive("/daily-log")
//                 ? "bg-accent text-white shadow"
//                 : "text-muted hover:bg-accent/10 hover:text-accent"
//             }`}
//           >
//             📅 Daily Log
//           </Link>

//           <Link
//             to="/analytics"
//             className={`px-4 py-2 rounded-xl transition-all ${
//               isActive("/analytics")
//                 ? "bg-accent text-white shadow"
//                 : "text-muted hover:bg-accent/10 hover:text-accent"
//             }`}
//           >
//             📊 Analytics
//           </Link>
//         </div>

//         {/* Right Side */}
//         <div className="flex items-center gap-3">
//           {/* Theme Toggle */}
//           <button
//             onClick={toggleTheme}
//             className="w-10 h-10 rounded-xl border border-white/10 bg-ink flex items-center justify-center hover:bg-accent hover:text-white transition"
//           >
//             {theme === "dark" ? "☀️" : "🌙"}
//           </button>

//           {/* User */}
//           <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/10">
//             <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-semibold">
//               {user?.name?.charAt(0).toUpperCase() || "U"}
//             </div>

//             <span className="text-sm text-cream">{user?.name}</span>
//           </div>

//           {/* Logout */}
//           <button
//             onClick={handleLogout}
//             className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition"
//           >
//             Logout
//           </button>
//         </div>
//       </div>
//     </nav>
//   );
// }

// export default Navbar;

////////
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAppsModal, setShowAppsModal] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const dropdownRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        localStorage.setItem("profileImage", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load saved profile image
  useEffect(() => {
    const saved = localStorage.getItem("profileImage");
    if (saved) setProfileImage(saved);
  }, []);

  const links = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Garden", path: "/notes" },
    { name: "Analytics", path: "/analytics" },
    { name: "Focus", path: "/focus-checkin" },
  ];

  const isActive = (path) => location.pathname === path;

  const connectedApps = [
    { name: "Google", icon: "🔍", status: "connect", color: "text-blue-400" },
    { name: "Notion", icon: "📝", status: "connect", color: "text-white" },
    { name: "Slack", icon: "💬", status: "connect", color: "text-purple-400" },
    { name: "GitHub", icon: "🐙", status: "connected", color: "text-gray-400" },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-ink-light/95 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-white/10"
            : "bg-ink-light/60 backdrop-blur-md border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-3 shrink-0 group"
          >
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white font-bold shadow-lg shadow-accent/25">
              G
            </div>
            <span className="font-display text-xl text-cream group-hover:text-accent transition-colors duration-200">
              Growth OS
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] rounded-full px-2 py-1.5 border border-white/5">
            {links.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? "bg-accent text-white"
                    : "text-muted hover:text-cream hover:bg-white/5"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-sm transition-colors"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="hidden sm:flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-full hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold ring-2 ring-white/10 overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>
                <span className="text-sm text-cream/80 font-medium max-w-[100px] truncate">
                  {user?.name}
                </span>
                <svg
                  className={`w-4 h-4 text-muted transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-ink-light border border-white/10 rounded-xl shadow-xl shadow-black/20 overflow-hidden"
                  >
                    <div className="p-3 border-b border-white/5">
                      <p className="text-cream font-medium text-sm">
                        {user?.name}
                      </p>
                      <p className="text-muted text-xs">
                        {user?.email || "user@example.com"}
                      </p>
                    </div>

                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setShowProfileModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-cream/80 hover:text-cream hover:bg-white/5 transition-colors text-left"
                      >
                        <svg
                          className="w-4 h-4 text-muted"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        View Profile
                      </button>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setShowSettingsModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-cream/80 hover:text-cream hover:bg-white/5 transition-colors text-left"
                      >
                        <svg
                          className="w-4 h-4 text-muted"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Settings
                      </button>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setShowAppsModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-cream/80 hover:text-cream hover:bg-white/5 transition-colors text-left"
                      >
                        <svg
                          className="w-4 h-4 text-muted"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                          />
                        </svg>
                        Connected Apps
                      </button>
                    </div>

                    <div className="p-1.5 border-t border-white/5">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
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
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center"
            >
              <div className="w-4 h-3 flex flex-col justify-between">
                <span
                  className={`block w-full h-[1.5px] bg-cream rounded-full origin-left transition-all duration-200 ${mobileOpen ? "rotate-45 translate-y-[5px]" : ""}`}
                />
                <span
                  className={`block w-full h-[1.5px] bg-cream rounded-full transition-all duration-200 ${mobileOpen ? "opacity-0" : ""}`}
                />
                <span
                  className={`block w-full h-[1.5px] bg-cream rounded-full origin-left transition-all duration-200 ${mobileOpen ? "-rotate-45 -translate-y-[5px]" : ""}`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden border-t border-white/5 bg-ink-light/95 backdrop-blur-xl overflow-hidden transition-all duration-200 ease-in-out ${mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="px-4 py-3 space-y-1">
            {links.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  isActive(item.path)
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-muted hover:text-cream hover:bg-white/5"
                }`}
              >
                {item.name}
                {isActive(item.path) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/5 mt-2">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors"
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-ink-light border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-cream">Profile</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-muted hover:text-cream p-1 rounded-lg hover:bg-white/5"
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

              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-accent text-white flex items-center justify-center text-3xl font-bold ring-4 ring-white/10 overflow-hidden">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user?.name?.charAt(0)?.toUpperCase() || "U"
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
                <h3 className="font-display text-lg text-cream mt-4">
                  {user?.name}
                </h3>
                <p className="text-muted text-sm">
                  {user?.email || "user@example.com"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-ink border border-white/5 rounded-xl p-3 text-center">
                  <p className="font-display text-xl text-cream">12</p>
                  <p className="text-muted text-xs">Notes</p>
                </div>
                <div className="bg-ink border border-white/5 rounded-xl p-3 text-center">
                  <p className="font-display text-xl text-cream">5</p>
                  <p className="text-muted text-xs">Streak</p>
                </div>
                <div className="bg-ink border border-white/5 rounded-xl p-3 text-center">
                  <p className="font-display text-xl text-cream">3</p>
                  <p className="text-muted text-xs">Logs</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-ink-light border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-cream">Settings</h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-muted hover:text-cream p-1 rounded-lg hover:bg-white/5"
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

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-ink rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {theme === "dark" ? "🌙" : "☀️"}
                    </span>
                    <div>
                      <p className="text-cream text-sm font-medium">
                        Dark Mode
                      </p>
                      <p className="text-muted text-xs">
                        Toggle between light and dark
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`w-11 h-6 rounded-full transition-colors relative ${theme === "dark" ? "bg-accent" : "bg-white/10"}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${theme === "dark" ? "left-6" : "left-1"}`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-ink rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔔</span>
                    <div>
                      <p className="text-cream text-sm font-medium">
                        Notifications
                      </p>
                      <p className="text-muted text-xs">Daily reminders</p>
                    </div>
                  </div>
                  <div className="w-11 h-6 rounded-full bg-accent relative">
                    <div className="w-4 h-4 rounded-full bg-white absolute top-1 left-6" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-ink rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔒</span>
                    <div>
                      <p className="text-cream text-sm font-medium">Privacy</p>
                      <p className="text-muted text-xs">Manage your data</p>
                    </div>
                  </div>
                  <button className="text-accent text-sm hover:underline">
                    Manage
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connected Apps Modal */}
      <AnimatePresence>
        {showAppsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
            onClick={() => setShowAppsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-ink-light border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-cream">
                  Connected Apps
                </h2>
                <button
                  onClick={() => setShowAppsModal(false)}
                  className="text-muted hover:text-cream p-1 rounded-lg hover:bg-white/5"
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

              <div className="space-y-3">
                {connectedApps.map((app) => (
                  <div
                    key={app.name}
                    className="flex items-center justify-between p-3 bg-ink rounded-xl border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{app.icon}</span>
                      <div>
                        <p className="text-cream text-sm font-medium">
                          {app.name}
                        </p>
                        <p
                          className={`text-xs ${app.status === "connected" ? "text-emerald-400" : "text-muted"}`}
                        >
                          {app.status === "connected"
                            ? "Connected"
                            : "Not connected"}
                        </p>
                      </div>
                    </div>
                    <button
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        app.status === "connected"
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "bg-accent/10 text-accent hover:bg-accent/20"
                      }`}
                    >
                      {app.status === "connected" ? "Disconnect" : "Connect"}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
