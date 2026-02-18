"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface Log {
  id: string;
  checkInTime: string;
  user: { name: string };
  checkpoint: { name: string };
  status: string;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

interface ThreatData {
  threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  score: number;
  shortAnalysis: string;
  actionItems: string[];
}

export default function SupervisorDashboard() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const isDark = theme === "dark";
  const surfaceCardClass = isDark
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-200";

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);

  const [threatData, setThreatData] = useState<ThreatData | null>(null);
  const [scanning, setScanning] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("secure_user_role");
    if (!storedRole || storedRole !== "SUPERVISOR") {
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("sp_dashboard_theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      return;
    }

    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sp_dashboard_theme", theme);
  }, [theme]);

  const fetchLogs = useCallback(
    async (loadingMode: "initial" | "table" | "silent") => {
      try {
        if (loadingMode === "initial") setIsInitialLoading(true);
        if (loadingMode === "table") setIsTableLoading(true);

        const res = await fetch(`/api/logs?page=${page}&search=${searchQuery}`);
        const data = await res.json();

        if (data.logs) {
          setLogs(data.logs);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error("Failed to fetch logs");
      } finally {
        setIsInitialLoading(false);
        setIsTableLoading(false);
      }
    },
    [page, searchQuery],
  );

  useEffect(() => {
    const mode = isInitialLoading ? "initial" : "table";
    const timer = setTimeout(() => {
      fetchLogs(mode);
    }, 500);
    return () => clearTimeout(timer);
  }, [page, searchQuery, fetchLogs, isInitialLoading]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchLogs("silent");
    }, 5000);
    return () => clearInterval(intervalId);
  }, [fetchLogs]);

  const runThreatScan = async () => {
    setScanning(true);
    setThreatData(null);
    try {
      const res = await fetch("/api/ai_threat", { method: "POST" });
      const data = await res.json();
      setThreatData(data);
    } catch (err) {
      alert("Diagnostic Scan Failed. Check Console.");
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (logId: string) => {
    if (
      !confirm("Confirm that this emergency is handled and the guard is safe?")
    )
      return;

    setLogs((prevLogs) =>
      prevLogs.map((log) =>
        log.id === logId ? { ...log, status: "RESOLVED" } : log,
      ),
    );

    try {
      await fetch("/api/logs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });

      fetchLogs("silent");
    } catch (error) {
      alert("Failed to resolve. Check connection.");
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: userText }]);
    setChatLoading(true);

    setTimeout(
      () => chatScrollRef.current?.scrollIntoView({ behavior: "smooth" }),
      100,
    );

    try {
      const res = await fetch("/api/ai_chat", {
        method: "POST",
        body: JSON.stringify({ question: userText }),
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: "System Error." },
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(
        () => chatScrollRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  };

  if (isInitialLoading) {
    return (
      <div
        className={`min-h-screen p-8 transition-colors duration-300 ${
          isDark
            ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
            : "bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50"
        }`}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          {/* Top bar skeleton */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-3">
              <div className="h-7 w-52 rounded-lg bg-slate-700/40" />
              <div className="h-4 w-40 rounded bg-slate-700/30" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-24 rounded-full bg-slate-700/40" />
              <div className="h-9 w-40 rounded-xl bg-indigo-500/70" />
            </div>
          </div>

          {/* Stat cards skeleton */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-xl border p-5 shadow-sm ${
                  isDark
                    ? "border-slate-800 bg-slate-900/70"
                    : "border-slate-200/80 bg-white/90"
                }`}
              >
                <div className="mb-3 h-3 w-24 rounded bg-slate-700/40" />
                <div className="mb-1 h-7 w-16 rounded bg-slate-700/40" />
                <div className="h-3 w-20 rounded bg-emerald-500/50" />
                <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            ))}
          </div>

          {/* Search bar skeleton */}
          <div
            className={`h-12 w-full rounded-xl border shadow-sm ${
              isDark
                ? "border-slate-800 bg-slate-900/60"
                : "border-slate-200/80 bg-white/90"
            }`}
          >
            <div className="h-full w-full rounded-xl bg-slate-700/30" />
          </div>

          {/* Table skeleton */}
          <div
            className={`relative overflow-hidden rounded-2xl border shadow-lg ${
              isDark
                ? "border-slate-800 bg-slate-950/70"
                : "border-slate-200/80 bg-white/95"
            }`}
          >
            <div
              className={`flex items-center justify-between gap-4 border-b px-6 py-4 text-xs font-medium ${
                isDark ? "border-slate-800" : "border-slate-200/80"
              }`}
            >
              <div className="flex gap-4">
                <div className="h-3 w-16 rounded bg-slate-700/40" />
                <div className="h-3 w-20 rounded bg-slate-700/40" />
                <div className="h-3 w-20 rounded bg-slate-700/40" />
                <div className="h-3 w-28 rounded bg-slate-700/40" />
              </div>
              <div className="h-3 w-16 rounded bg-emerald-500/60" />
            </div>

            <div className="space-y-3 px-6 py-4">
              {[1, 2, 3, 4].map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex flex-1 items-center gap-4">
                    <div className="h-7 w-28 rounded-md bg-slate-700/30" />
                    <div className="h-3 w-32 rounded bg-slate-700/30" />
                    <div className="h-3 w-40 rounded bg-slate-700/20" />
                  </div>
                  <div className="h-6 w-20 rounded-full bg-emerald-500/40" />
                </div>
              ))}
            </div>

            <div
              className={`flex items-center justify-between border-t px-6 py-3 text-[11px] ${
                isDark ? "border-slate-800" : "border-slate-200/80"
              }`}
            >
              <div className="h-3 w-20 rounded bg-slate-700/40" />
              <div className="h-3 w-28 rounded bg-slate-700/30" />
              <div className="h-3 w-20 rounded bg-slate-700/40" />
            </div>

            <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-8 font-sans pb-32 transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <span>🛡️ Project Aegis</span>
            <span className="text-purple-500 text-sm align-top font-semibold">
              BETA
            </span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            Real-time Security Operations Center for on-ground patrols.
          </p>
          <a
            href="/dashboard/manage"
            className="text-xs font-semibold text-slate-400 hover:text-purple-400"
          >
            ⚙️ MANAGE SOPs
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setTheme((prev) => (prev === "light" ? "dark" : "light"))
            }
            aria-label="Toggle light and dark mode"
            aria-pressed={isDark}
            className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                : "border-slate-200 bg-white/70 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="text-base">{isDark ? "🌙" : "☀️"}</span>
            <span>{isDark ? "Dark mode" : "Light mode"}</span>
          </button>

          <button
            onClick={runThreatScan}
            disabled={scanning}
            className={`px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg flex items-center gap-3 transition-all ${
              scanning
                ? "bg-slate-500"
                : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105"
            }`}
          >
            {scanning ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                RUNNING DIAGNOSTICS...
              </>
            ) : (
              <>🚀 RUN THREAT SCAN</>
            )}
          </button>
        </div>
      </div>

      {threatData && (
        <div className="max-w-6xl mx-auto mb-8 animate-fade-in-up">
          <div
            className={`rounded-2xl shadow-xl border overflow-hidden ${surfaceCardClass}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-4">
              <div
                className={`p-8 text-white flex flex-col items-center justify-center ${
                  threatData.threatLevel === "LOW"
                    ? "bg-green-500"
                    : threatData.threatLevel === "MEDIUM"
                      ? "bg-yellow-500"
                      : "bg-red-600"
                }`}
              >
                <div className="text-6xl font-black">{threatData.score}</div>
                <div className="text-xs font-bold uppercase tracking-widest mt-2 opacity-90">
                  Safety Score
                </div>
                <div className="mt-4 px-3 py-1 bg-black/20 rounded-full text-xs font-bold">
                  LEVEL: {threatData.threatLevel}
                </div>
              </div>
              <div className="p-8 md:col-span-3">
                <h3 className="text-xl font-bold mb-2">
                  AI Commander Analysis
                </h3>
                <p className="text-slate-500 text-sm mb-6">
                  {threatData.shortAnalysis}
                </p>
                {threatData.actionItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Recommended Actions
                    </h4>
                    <div className="grid gap-2">
                      {threatData.actionItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100"
                        >
                          <span className="text-indigo-600 font-bold">⚠️</span>
                          <span className="text-sm text-slate-700 font-medium">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={`p-6 rounded-xl shadow-sm border ${surfaceCardClass}`}>
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Total Patrols
          </div>
          <div className="text-3xl font-bold mt-2">
            {logs.length}+
          </div>
          <div className="text-xs text-emerald-500 mt-1">Live updates active</div>
        </div>
        <div className={`p-6 rounded-xl shadow-sm border ${surfaceCardClass}`}>
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Active Guards
          </div>
          <div className="text-3xl font-bold mt-2">
            {new Set(logs.map((l) => l.user.name)).size}
          </div>
        </div>
        <div className={`p-6 rounded-xl shadow-sm border ${surfaceCardClass}`}>
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            System Status
          </div>
          <div className="text-3xl font-bold text-emerald-500 mt-2">OPTIMAL</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mb-4">
        <input
          type="text"
          placeholder="🔍 Search logs by Guard Name..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className={`w-full p-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder-slate-400 text-sm ${
            isDark
              ? "border-slate-800 bg-slate-900 text-slate-50"
              : "border-slate-200 bg-white text-slate-800"
          }`}
        />
      </div>

      <div
        className={`max-w-6xl mx-auto rounded-xl shadow-lg border overflow-hidden relative min-h-fit ${surfaceCardClass}`}
      >
        {isTableLoading && (
          <div className="absolute inset-0 bg-black/10 z-10 flex items-center justify-center backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-3 rounded-xl bg-slate-900/70 px-4 py-3 text-xs text-slate-100">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
              <span className="font-semibold text-emerald-300 uppercase tracking-widest">
                Updating Data...
              </span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap text-sm">
            <thead
              className={`uppercase text-xs font-bold tracking-wider border-b ${
                isDark
                  ? "bg-slate-900 text-slate-300 border-slate-800"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Guard Identity</th>
                <th className="p-4">Checkpoint</th>
                <th className="p-4">Verification</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDark ? "divide-slate-800" : "divide-slate-100"
              }`}
            >
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className={`transition-colors group ${
                    isDark ? "hover:bg-slate-900/70" : "hover:bg-purple-50"
                  }`}
                >
                  <td className="p-4 text-slate-600 text-xs md:text-sm font-mono">
                    {new Date(log.checkInTime).toLocaleString("en-US", {
                      timeZone: "Asia/Kolkata",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-4 font-semibold group-hover:text-purple-400">
                    {log.user.name}
                  </td>
                  <td className="p-4 text-slate-500 font-medium">
                    📍 {log.checkpoint.name}
                  </td>
                  <td className="p-4">
                    {log.status === "SOS" ? (
                      <div className="flex items-center gap-3">
                        <span className="bg-red-500/15 text-red-300 px-3 py-1 rounded-full text-xs font-bold border border-red-400/40 animate-pulse flex items-center gap-1">
                          🚨 SOS
                        </span>

                        <button
                          onClick={() => handleResolve(log.id)}
                          className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded shadow-md hover:bg-slate-700 transition-all active:scale-95"
                        >
                          RESOLVE
                        </button>
                      </div>
                    ) : log.status === "RESOLVED" ? (
                      <span className="bg-blue-500/10 text-blue-300 px-3 py-1 rounded-full text-xs font-bold border border-blue-400/40">
                        RESOLVED
                      </span>
                    ) : (
                      <span className="bg-emerald-500/10 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-400/40">
                        VERIFIED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className={`p-4 border-t flex justify-between items-center text-xs md:text-sm ${
            isDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-slate-50"
          }`}
        >
          <button
            disabled={page === 1 || isTableLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-4 py-2 border rounded-lg text-sm font-medium shadow-sm disabled:opacity-50 ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                : "border-gray-300 bg-white text-slate-700 hover:bg-gray-100"
            }`}
          >
            ← Previous
          </button>
          <span className="text-sm font-medium text-slate-400">
            Page <span className="text-purple-400 font-bold">{page}</span> of{" "}
            {totalPages}
          </span>
          <button
            disabled={page === totalPages || isTableLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`px-4 py-2 border rounded-lg text-sm font-medium shadow-sm disabled:opacity-50 ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                : "border-gray-300 bg-white text-slate-700 hover:bg-gray-100"
            }`}
          >
            Next →
          </button>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105"
          >
            <span className="text-2xl">🤖</span>
            <span className="font-bold">Ask AI Commander</span>
          </button>
        )}

        {isChatOpen && (
          <div
            className={`rounded-2xl shadow-2xl border w-80 md:w-96 flex flex-col h-[500px] animate-fade-in-up ${
              isDark ? "border-slate-800 bg-slate-950" : "border-purple-100 bg-white"
            }`}
          >
            <div className="bg-purple-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="font-bold">AI Commander</h3>
                <p className="text-xs text-purple-200">Online • Security Ops</p>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-purple-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div
              className={`flex-1 overflow-y-auto p-4 space-y-4 ${
                isDark ? "bg-slate-950" : "bg-slate-50"
              }`}
            >
              {chatMessages.length === 0 && (
                <div className="text-center text-sm mt-10 text-slate-400">
                  <p>👋 Hello Supervisor.</p>
                  <p className="mt-2">
                    I have access to live patrol logs. Ask me anything.
                  </p>
                </div>
              )}

              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white rounded-br-none"
                        : isDark
                          ? "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none shadow-sm"
                          : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-500 p-3 rounded-xl rounded-bl-none text-xs animate-pulse">
                    Analyzing...
                  </div>
                </div>
              )}
              <div ref={chatScrollRef} />
            </div>

            <form
              onSubmit={handleChatSubmit}
              className={`p-3 border-t rounded-b-2xl ${
                isDark ? "border-slate-800 bg-slate-950" : "border-gray-100 bg-white"
              }`}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a command..."
                  className={`flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:border-purple-500 ${
                    isDark
                      ? "border-slate-700 bg-slate-900 text-slate-50"
                      : "border-gray-200 bg-white text-slate-800"
                  }`}
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
