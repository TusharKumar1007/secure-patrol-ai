"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

interface Checkpoint {
  id: string;
  name: string;
  instruction: string;
  videoUrl: string;
}

export default function ManageCheckpoints() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem("secure_user_role");
    if (!storedRole || storedRole !== "SUPERVISOR") {
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    fetch("/api/checkpoints")
      .then((res) => res.json())
      .then((data) => {
        setCheckpoints(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async (
    id: string,
    instruction: string,
    videoUrl: string,
  ) => {
    try {
      await fetch("/api/checkpoints", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, instruction, videoUrl }),
      });
      toast.success("Protocol Updated!");
    } catch (e) {
      toast.error("Failed to save.");
    }
  };

  if (loading) return <div className="p-8">Loading Settings...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <Toaster />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            ⚙️ Protocol Manager
          </h1>
          <Link
            href="/dashboard"
            className="text-purple-600 font-bold hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="space-y-6">
          {checkpoints.map((spot) => (
            <div
              key={spot.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                {spot.name}
              </h3>

              <div className="grid gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Text Instruction
                  </label>
                  <input
                    type="text"
                    defaultValue={spot.instruction || ""}
                    onChange={(e) => {
                      spot.instruction = e.target.value;
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    YouTube Embed URL
                  </label>
                  <input
                    type="text"
                    defaultValue={spot.videoUrl || ""}
                    onChange={(e) => {
                      spot.videoUrl = e.target.value;
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-600"
                  />
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    onClick={() =>
                      handleSave(spot.id, spot.instruction, spot.videoUrl)
                    }
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
