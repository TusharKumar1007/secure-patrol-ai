"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("Successfully Loged in");

      localStorage.setItem("secure_user_id", data.id);
      localStorage.setItem("secure_user_name", data.name);
      localStorage.setItem("secure_user_role", data.role.trim());

      if (data.role.trim() === "SUPERVISOR") {
        router.push("/dashboard");
      } else {
        router.push("/guard");
      }
    } else {
      alert("❌ User not found! Try: guard1@test.com");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-slate-800">
          Secure Patrol
        </h1>
        <p className="text-center text-slate-500 mb-8">
          Login to access the system
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="john@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all"
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-xs text-center text-gray-400">
          Tip: Use <b>john@gmail.com</b> or <b>josh@admin.com</b>
        </div>
      </div>
    </div>
  );
}
