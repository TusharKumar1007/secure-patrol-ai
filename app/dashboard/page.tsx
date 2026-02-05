'use client';

import { useEffect, useState } from 'react';

interface Log {
  id: string;
  checkInTime: string;
  user: { name: string };
  checkpoint: { name: string };
}

export default function SupervisorDashboard() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/logs')
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      });
  }, []);

  const generateAiReport = async () => {
    setAiLoading(true);
    setAiReport(null);

    try {
      const res = await fetch('/api/ai_analysis', { method: 'POST' });
      const data = await res.json();
      setAiReport(data.analysis);
    } catch (err) {
      setAiReport("Failed to connect to AI.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">

      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🛡️ Supervisor Command</h1>
          <p className="text-slate-500">Live feed of patrol activities</p>
        </div>
        

        <button 
          onClick={generateAiReport}
          disabled={aiLoading}
          className="bg-purple-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-purple-700 shadow-md flex items-center gap-2 transition-all"
        >
          {aiLoading ? (
            <>✨ Analyzing Data...</>
          ) : (
            <>✨ Generate AI Report</>
          )}
        </button>
      </div>

      {aiReport && (
        <div className="max-w-4xl mx-auto mb-6 bg-purple-50 border border-purple-200 p-6 rounded-xl animate-fade-in">
          <h3 className="text-purple-900 font-bold mb-2 flex items-center gap-2">
            🤖 AI Insight
          </h3>
          <p className="text-purple-800 whitespace-pre-line">{aiReport}</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 mb-8">
         <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-gray-500 text-sm">Total Patrols</div>
            <div className="text-2xl font-bold text-slate-800">{logs.length}</div>
         </div>
         <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-gray-500 text-sm">Active Guards</div>
            <div className="text-2xl font-bold text-slate-800">{new Set(logs.map(l => l.user.name)).size}</div>
         </div>
         <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-gray-500 text-sm">Locations Checked</div>
            <div className="text-2xl font-bold text-slate-800">{new Set(logs.map(l => l.checkpoint.name)).size}</div>
         </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-slate-600 uppercase text-sm font-semibold">
            <tr>
              <th className="p-4">Time</th>
              <th className="p-4">Guard</th>
              <th className="p-4">Location</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-600">
                  {new Date(log.checkInTime).toLocaleTimeString()}
                </td>
                <td className="p-4 font-medium text-slate-900">
                  {log.user.name}
                </td>
                <td className="p-4 text-blue-600 font-medium">
                  📍 {log.checkpoint.name}
                </td>
                <td className="p-4">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                    VERIFIED
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}