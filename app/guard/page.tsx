"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Checkpoint {
  id: string;
  name: string;
  instruction?: string;
  videoUrl?: string;
}

export default function GuardDashboard() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isSosActive, setIsSosActive] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  const [showInstruction, setShowInstruction] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] =
    useState<Checkpoint | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  const isDark = theme === "dark";
  const surfaceCardClass = isDark
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-200";

  const openInstruction = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setShowInstruction(true);
  };

  const confirmCheckIn = async () => {
    if (!selectedCheckpoint) return;
    setShowInstruction(false);
    await handleCheckIn(selectedCheckpoint.id);
  };

  const handleSOS = async () => {
    if (!confirm("⚠️ ARE YOU SURE? This will alert all Supervisors.")) return;

    setIsSosActive(true);

    try {
      const firstPoint = checkpoints[0]?.id;

      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          checkpointId: firstPoint,
          status: "SOS",
        }),
      });

      setTimeout(() => {
        alert("🚨 EMERGENCY SIGNAL SENT 🚨");
        setIsSosActive(false);
      }, 3000);
    } catch (error) {
      setIsSosActive(false);
      alert("Failed to send alert");
    }
  };

  useEffect(() => {
    const storedId = localStorage.getItem("secure_user_id");
    const storedRole = localStorage.getItem("secure_user_role");

    if (!storedId) {
      router.push("/");
      return;
    }

    if (storedRole === "SUPERVISOR") {
      alert("⚠️ Access Denied: Supervisors cannot perform Check-Ins.");
      router.push("/dashboard");
      return;
    }

    setUserId(storedId);

    fetch("/api/checkpoints")
      .then((res) => res.json())
      .then((data) => {
        setCheckpoints(data);
        setLoading(false);
      })
      .catch((err) => setLoading(false));
  }, [router]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("sp_guard_theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      return;
    }

    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sp_guard_theme", theme);
  }, [theme]);

  const handleCheckIn = async (checkpointId: string) => {
    if (!userId) return;

    setCheckingIn(checkpointId);

    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          checkpointId: checkpointId,
        }),
      });

      if (res.ok) {
        toast.success("Check-in Verified ✅");
      } else {
        alert("❌ Error: Could not check in.");
      }
    } catch (error) {
      alert("❌ Network Error");
    } finally {
      setCheckingIn(null);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen p-4 transition-colors duration-300 ${
          isDark ? "bg-slate-950" : "bg-gray-100"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="animate-pulse h-8 bg-gray-300/80 rounded w-48"></div>
          <div className="animate-pulse h-4 bg-gray-300/80 rounded w-16"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/80 p-6 rounded-xl shadow-md h-32"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-4 pb-32 transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-slate-50" : "bg-gray-100 text-slate-900"
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="mr-1">👮</span> Guard Patrol
          </h1>
          <p className="text-xs text-slate-400">
            Follow SOPs, verify checkpoints, and stay safe.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setTheme((prev) => (prev === "light" ? "dark" : "light"))
            }
            aria-label="Toggle light and dark mode"
            aria-pressed={isDark}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                : "border-slate-200 bg-white/70 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="text-sm">{isDark ? "🌙" : "☀️"}</span>
            <span>{isDark ? "Dark" : "Light"}</span>
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("secure_user_id");
              localStorage.removeItem("secure_user_role");
              localStorage.removeItem("secure_user_name");
              toast.success("Logged out");
              router.push("/");
            }}
            className="text-xs md:text-sm text-red-400 hover:text-red-300 font-medium underline-offset-2 hover:underline"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {checkpoints.map((spot) => (
          <div
            key={spot.id}
            className={`p-5 rounded-xl shadow-sm border ${surfaceCardClass}`}
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold">{spot.name}</h2>

              <button
                onClick={() => handleCheckIn(spot.id)}
                disabled={checkingIn === spot.id}
                className={`px-5 py-2 rounded-lg font-bold text-xs md:text-sm text-white shadow-sm transition-all ${
                  checkingIn === spot.id
                    ? "bg-gray-400"
                    : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                }`}
              >
                {checkingIn === spot.id ? "Saving..." : "Check In"}
              </button>
            </div>

            <div className="bg-blue-500/5 rounded-lg p-3 flex justify-between items-center border border-blue-500/20">
              <div className="flex items-start gap-2">
                <span className="text-lg">📋</span>
                <p
                  className={`text-xs md:text-[13px] font-medium leading-relaxed ${
                    isDark ? "text-blue-200" : "text-blue-700"
                  }`}
                >
                  {spot.instruction || "Verify perimeter and check locks."}
                </p>
              </div>

              <button
                onClick={() => openInstruction(spot)}
                className="ml-3 h-8 w-8 flex-shrink-0 bg-white rounded-full text-blue-600 shadow-sm border border-blue-200 flex items-center justify-center hover:scale-105 transition-transform"
                title="Watch SOP Video"
              >
                ▶️
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-4 z-40">
        <button
          onClick={handleSOS}
          className={`w-full py-4 rounded-xl font-black text-lg md:text-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
            isSosActive
              ? "bg-red-600 animate-pulse text-white"
              : isDark
                ? "bg-slate-900 text-red-400 border-2 border-red-600"
                : "bg-white text-red-600 border-2 border-red-500"
          }`}
        >
          <span>🚨</span>
          {isSosActive ? "SENDING ALERT..." : "PANIC BUTTON"}
        </button>
      </div>

      {isSosActive && (
        <div className="fixed inset-0 bg-red-600/30 z-50 animate-pulse pointer-events-none"></div>
      )}

      {showInstruction && selectedCheckpoint && (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative w-full h-56 bg-black">
              <iframe
                src={
                  selectedCheckpoint.videoUrl ||
                  "https://www.youtube.com/embed/ScMzIvxBSi4"
                }
                className="w-full h-full object-cover"
                title="SOP Video"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedCheckpoint.name} Protocol
                </h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                  SOP
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                Please review the video above to ensure compliance with security
                standards before verifying this checkpoint.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowInstruction(false)}
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCheckIn}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>✅</span> VERIFY & CHECK IN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
