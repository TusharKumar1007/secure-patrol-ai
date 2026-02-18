"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Successfully logged in");

        localStorage.setItem("secure_user_id", data.id);
        localStorage.setItem("secure_user_name", data.name);
        localStorage.setItem("secure_user_role", data.role.trim());

        if (data.role.trim() === "SUPERVISOR") {
          router.push("/dashboard");
        } else {
          router.push("/guard");
        }
      } else {
        const message =
          data?.message ||
          "User not found. Try john@gmail.com or josh@admin.com.";
        setError(message);
        toast.error(message);
        setLoading(false);
      }
    } catch (err) {
      const message = "Something went wrong. Please try again.";
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-5xl w-full grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
        {/* Left / Hero section */}
        <section className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] font-medium text-slate-300">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            24/7 secure patrol monitoring
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-50">
              Smart guard check-ins for modern sites.
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-md">
              Keep every patrol accountable. Supervisors see real-time logs,
              while guards check in with a fast, focused workflow.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-4 max-w-sm text-xs md:text-sm">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <dt className="text-slate-400">Roles</dt>
              <dd className="font-medium text-slate-50">Guard & Supervisor</dd>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <dt className="text-slate-400">Checkpoints</dt>
              <dd className="font-medium text-slate-50">
                GPS & instruction ready
              </dd>
            </div>
          </dl>
        </section>

        {/* Right / Login card */}
        <section className="bg-slate-950/70 border border-slate-800 shadow-2xl shadow-slate-950/40 rounded-2xl p-6 md:p-8 backdrop-blur">
          <div className="mb-6 space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              Sign in to Secure Patrol
            </h2>
            <p className="text-xs text-slate-400">
              Use your registered email to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" aria-busy={loading}>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-200"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="john@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/60"
              />
              <p className="text-[11px] text-slate-400">
                We&apos;ll use this to match your guard or supervisor profile.
              </p>
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/70 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                  Logging in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-slate-900/70 border border-slate-800 px-4 py-3 text-[11px] text-slate-300">
            <p className="font-medium text-slate-200 mb-1">Demo accounts</p>
            <p>
              <span className="text-slate-400">Guard</span>:{" "}
              <b>john@gmail.com</b>
            </p>
            <p className="mt-1">
              <span className="text-slate-400">Supervisor</span>:{" "}
              <b>josh@admin.com</b>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
