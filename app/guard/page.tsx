'use client';

import { useEffect, useState } from 'react';

// Define what a Checkpoint looks like
interface Checkpoint {
  id: string;
  name: string;
}

export default function GuardDashboard() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch data when the page loads
  useEffect(() => {
    fetch('/api/checkpoints')
      .then((res) => res.json())
      .then((data) => {
        setCheckpoints(data);
        setLoading(false);
      });
  }, []);

  // 2. Function to handle the click (We will make this work later)
  const handleCheckIn = (name: string) => {
    alert(`Checking in at: ${name}`);
  };

  if (loading) return <div className="p-8 text-center">Loading locations...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">👮 Guard Patrol</h1>
      
      <div className="space-y-4">
        {checkpoints.map((spot) => (
          <div key={spot.id} className="bg-white p-6 rounded-xl shadow-md flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{spot.name}</h2>
              <p className="text-gray-500 text-sm">Tap to scan</p>
            </div>
            
            <button 
              onClick={() => handleCheckIn(spot.name)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 active:scale-95 transition-all"
            >
              Check In
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}