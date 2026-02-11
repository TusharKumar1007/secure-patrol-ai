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
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto animate-pulse space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-3">
              <div className="h-8 bg-slate-300 rounded-lg w-64"></div>
              <div className="h-4 bg-slate-200 rounded w-40"></div>
            </div>
            <div className="h-10 bg-purple-200 rounded-lg w-40"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl border border-slate-200 h-32"
              ></div>
            ))}
          </div>
          <div className="h-14 bg-white rounded-xl border border-slate-200 w-full"></div>
          <div className="bg-white rounded-xl border border-slate-200 h-fit">
            <div className="flex gap-4 p-4 justify-between">
              <div className="h-5 bg-purple-300/30 rounded-xl w-50 mb-2"></div>
              <div className="h-5 bg-purple-300/30 rounded-xl w-50 mb-2"></div>
              <div className="h-5 bg-purple-300/30 rounded-xl w-50 mb-2"></div>
              <div className="h-5 bg-purple-300/30 rounded-xl w-50 mb-2"></div>
            </div>
            <div className="center p-6">
              <div className="h-8 bg-slate-300/60 rounded-xl w-5/5 mb-4"></div>
              <div className="h-8 bg-slate-300/60 rounded-xl w-5/5 mb-4"></div>
              <div className="h-8 bg-slate-300/60 rounded-xl w-5/5 mb-4"></div>
              <div className="h-8 bg-slate-300/60 rounded-xl w-5/5 mb-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900 pb-32">
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            🛡️ Project Aegis{" "}
            <span className="text-purple-600 text-sm align-top">BETA</span>
          </h1>
          <p className="text-slate-500">Real-time Security Operations Center</p>
          <a
            href="/dashboard/manage"
            className="text-xs font-bold text-slate-400 hover:text-purple-600"
          >
            ⚙️ MANAGE SOPs
          </a>
        </div>

        <button
          onClick={runThreatScan}
          disabled={scanning}
          className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg flex items-center gap-3 transition-all ${
            scanning
              ? "bg-slate-400"
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

      {threatData && (
        <div className="max-w-6xl mx-auto mb-8 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
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
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  AI Commander Analysis
                </h3>
                <p className="text-slate-600 mb-6">
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-gray-500 text-sm font-medium uppercase tracking-wider">
            Total Patrols
          </div>
          <div className="text-3xl font-bold text-slate-800 mt-2">
            {logs.length}+
          </div>
          <div className="text-xs text-green-600 mt-1">Live updates active</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-gray-500 text-sm font-medium uppercase tracking-wider">
            Active Guards
          </div>
          <div className="text-3xl font-bold text-slate-800 mt-2">
            {new Set(logs.map((l) => l.user.name)).size}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-gray-500 text-sm font-medium uppercase tracking-wider">
            System Status
          </div>
          <div className="text-3xl font-bold text-green-600 mt-2">OPTIMAL</div>
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
          className="w-full p-4 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all text-slate-800 placeholder-slate-400"
        />
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative min-h-fit">
        {isTableLoading && (
          <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">
                Updating Data...
              </span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Guard Identity</th>
                <th className="p-4">Checkpoint</th>
                <th className="p-4">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-purple-50 transition-colors group"
                >
                  <td className="p-4 text-slate-600 text-sm font-mono">
                    {new Date(log.checkInTime).toLocaleString("en-US", {
                      timeZone: "Asia/Kolkata",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-4 font-bold text-slate-800 group-hover:text-purple-700">
                    {log.user.name}
                  </td>
                  <td className="p-4 text-slate-600 font-medium">
                    📍 {log.checkpoint.name}
                  </td>
                  <td className="p-4">
                    {log.status === "SOS" ? (
                      <div className="flex items-center gap-3">
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 animate-pulse flex items-center gap-1">
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
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
                        RESOLVED
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                        VERIFIED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
          <button
            disabled={page === 1 || isTableLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 text-slate-700 shadow-sm"
          >
            ← Previous
          </button>
          <span className="text-sm font-medium text-slate-600">
            Page <span className="text-purple-700 font-bold">{page}</span> of{" "}
            {totalPages}
          </span>
          <button
            disabled={page === totalPages || isTableLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 text-slate-700 shadow-sm"
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
          <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 w-80 md:w-96 flex flex-col h-[500px] animate-fade-in-up">
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

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-400 text-sm mt-10">
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
              className="p-3 border-t border-gray-100 bg-white rounded-b-2xl"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a command..."
                  className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 text-slate-800"
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
