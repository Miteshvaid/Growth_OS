import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";
import { toast } from "sonner";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (pass) => {
    if (pass.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pass)) return "Need at least one uppercase letter (A-Z)";
    if (!/[a-z]/.test(pass)) return "Need at least one lowercase letter (a-z)";
    if (!/[0-9]/.test(pass)) return "Need at least one number (0-9)";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass))
      return "Need at least one special character (!@#$%^&*)";
    return "";
  };

  const getStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthLabels = [
    "Very Weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
    "Very Strong",
  ];
  const strengthColors = [
    "bg-red-500",
    "bg-red-400",
    "bg-yellow-500",
    "bg-yellow-400",
    "bg-green-400",
    "bg-green-500",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validatePassword(password);
    if (error) {
      toast.error(error, {
        icon: "🔒",
        description: "Please fix the password requirements",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await register({ name, email, password });
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

      toast.success("Account created successfully!", {
        icon: "🎉",
        description: `Welcome, ${name}!`,
      });

      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      toast.error(message, {
        icon: "❌",
        description: "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const Requirement = ({ met, text }) => (
    <div
      className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
        met ? "text-green-400" : "text-muted"
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
          met ? "bg-green-500/20 text-green-400" : "bg-white/5 text-muted"
        }`}
      >
        {met ? "✓" : ""}
      </span>
      {text}
    </div>
  );

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="bg-ink-light border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-black/20">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-accent/25">
            G
          </div>
          <h1 className="font-display text-3xl text-cream mb-2">Get Started</h1>
          <p className="text-muted">Create your GrowthOS account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-cream/80 mb-2 font-medium">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
              className="w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-cream placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
            />
          </div>

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
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Create a strong password"
                className={`w-full bg-ink border rounded-xl px-4 py-3 pr-12 text-cream placeholder:text-muted/50 focus:outline-none focus:ring-1 transition-all ${
                  strength >= 4
                    ? "border-green-500/50 focus:border-green-500 focus:ring-green-500/30"
                    : "border-white/10 focus:border-accent focus:ring-accent/30"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Strength Bar */}
            {password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${strengthColors[strength]}`}
                      style={{
                        width: `${((strength + 1) / 6) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted">
                    {strengthLabels[strength]}
                  </span>
                </div>

                {/* Requirements Grid */}
                <div className="bg-ink/50 rounded-lg p-3 space-y-2 border border-white/5">
                  <p className="text-xs text-muted font-medium">
                    Password must have:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Requirement
                      met={password.length >= 8}
                      text="8+ characters"
                    />
                    <Requirement
                      met={/[A-Z]/.test(password)}
                      text="Uppercase (A-Z)"
                    />
                    <Requirement
                      met={/[a-z]/.test(password)}
                      text="Lowercase (a-z)"
                    />
                    <Requirement
                      met={/[0-9]/.test(password)}
                      text="Number (0-9)"
                    />
                    <Requirement
                      met={/[!@#$%^&*(),.?":{}|<>]/.test(password)}
                      text="Special (!@#$%)"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || strength < 4}
            className="w-full bg-accent hover:bg-accent-light disabled:bg-accent/30 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-accent/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-accent hover:text-accent-light font-medium transition-colors"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
