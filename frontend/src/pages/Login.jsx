import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { loginUser } from "../api/auth";
import { useTheme } from "../context/ThemeContext";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      console.log("Login response:", res); // Kya aa raha hai?

      // Token kahan hai?
      const token = res.token || res.accessToken || res.jwt;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(res));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex">
      {/* Left: Branding panel */}
      <div className="hidden lg:flex w-1/2 bg-ink-light items-center justify-center px-12 border-r border-white/5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-md"
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="w-2.5 h-2.5 rounded-full bg-accent"></div>
            <span className="text-muted text-sm tracking-widest uppercase">
              Growth OS
            </span>
          </div>
          <h2 className="font-display text-4xl text-cream leading-tight mb-4">
            Welcome back to
            <br />
            your growth journey.
          </h2>
          <p className="text-muted leading-relaxed">
            Your notes, habits, and reflections are waiting right where you left
            them.
          </p>
          <div className="flex gap-2 mt-10">
            {["🌱", "🌿", "🌳"].map((emoji, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.15 }}
                className="text-2xl"
              >
                {emoji}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
        {/* Theme Toggle — top right corner */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs hover:bg-accent/10 transition-colors"
        >
          {theme === "dark" ? (
            <>
              <span>☀️</span>
              <span>Light mode</span>
            </>
          ) : (
            <>
              <span>🌙</span>
              <span>Dark mode</span>
            </>
          )}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-muted text-sm tracking-widest uppercase">
              Growth OS
            </span>
          </div>

          <h1 className="font-display text-3xl text-cream mb-1">
            Welcome back
          </h1>
          <p className="text-muted text-sm mb-8">
            Continue your growth journey.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-5"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-muted text-xs uppercase tracking-wide mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full bg-ink-light border border-accent/20 rounded-lg px-4 py-3 text-cream placeholder-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-muted text-xs uppercase tracking-wide mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Your password"
                className="w-full bg-ink-light border border-accent/20 rounded-lg px-4 py-3 text-cream placeholder-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-lg py-3 mt-2 transition-colors disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log in"}
            </motion.button>
          </form>

          <p className="text-muted text-sm text-center mt-6">
            New here?{" "}
            <Link
              to="/register"
              className="text-accent hover:text-accent-light font-medium"
            >
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;
