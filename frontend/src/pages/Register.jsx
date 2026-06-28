import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await register({ name, email, password });
      console.log("Register response:", res.data);

      const token = res.data.token;
      if (!token) {
        alert("No token received!");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(res.data));
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="bg-ink-light border border-white/10 rounded-2xl p-8 w-full max-w-md">
        <h1 className="font-display text-3xl text-cream mb-2">Get Started</h1>
        <p className="text-muted mb-6">Create your GrowthOS account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-ink border border-white/10 rounded-xl p-3 text-cream focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-ink border border-white/10 rounded-xl p-3 text-cream focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-ink border border-white/10 rounded-xl p-3 text-cream focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-light text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? "Loading..." : "Register"}
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
