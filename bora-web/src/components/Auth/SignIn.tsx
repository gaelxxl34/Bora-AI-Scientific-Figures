import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError("Invalid email or password. Please try again.");
        return;
      }
      navigate("/app");
    } catch {
      setError("Unable to connect. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lab-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/img/Bora AI.png" alt="Bora" style={{ width: 160 }} className="mx-auto mb-6" />
          </Link>
          <h1 className="text-2xl font-bold text-ink-black">Welcome back</h1>
          <p className="text-sm text-slate mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border-gray p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink-black mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              className="w-full rounded-lg border border-border-gray px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bora-blue/30 focus:border-bora-blue"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-black mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border-gray px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bora-blue/30 focus:border-bora-blue"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink-black text-white font-medium py-2.5 rounded-lg text-sm hover:bg-ink-black/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-slate mt-5">
          Don't have an account?{" "}
          <Link to="/signup" className="text-bora-blue font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
