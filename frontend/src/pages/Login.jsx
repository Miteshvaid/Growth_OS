import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";
import { toast } from "sonner";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login({ email, password });
      const token = res.data.token;

      if (!token) {
        toast.error("Something went wrong!", {
          icon: "⚠️",
          description: "No token received from server",
        });
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(res.data));

      toast.success("Welcome back!", {
        icon: "👋",
        description: `Good to see you, ${res.data.name}!`,
      });

      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";

      // ✅ Beautiful toast instead of alert
      toast.error(message, {
        icon: "🔐",
        description: "Please check your email and password",
        action: {
          label: "Try Again",
          onClick: () => {
            setPassword("");
            document.getElementById("password-input")?.focus();
          },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="bg-ink-light border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-black/20">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-accent/25">
            G
          </div>
          <h1 className="font-display text-3xl text-cream mb-2">
            Welcome Back
          </h1>
          <p className="text-muted">Login to your GrowthOS account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-cream/80 mb-2 font-medium">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-cream placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm text-cream/80 mb-2 font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full bg-ink border border-white/10 rounded-xl px-4 py-3 pr-12 text-cream placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-light disabled:bg-accent/30 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-accent/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-accent hover:text-accent-light font-medium transition-colors"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
