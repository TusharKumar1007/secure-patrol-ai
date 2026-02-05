'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Checkpoint {
  id: string;
  name: string;
}

export default function GuardDashboard() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();


  useEffect(() => {

    const storedId = localStorage.getItem('secure_user_id');
    

    if (!storedId) {
      router.push('/'); 
      return;
    }
    
    setUserId(storedId);


    fetch('/api/checkpoints')
      .then((res) => res.json())
      .then((data) => {
        setCheckpoints(data);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, [router]);


  const handleCheckIn = async (checkpointId: string) => {
    if (!userId) return; 

    setCheckingIn(checkpointId); 

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId, 
          checkpointId: checkpointId,
        }),
      });

      if (res.ok) {
        alert("✅ Success! Check-in recorded.");
      } else {
        alert("❌ Error: Could not check in.");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Network Error");
    } finally {
      setCheckingIn(null); 
    }
  };

  if (loading) return <div className="p-8 text-center">Verifying credentials...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">👮 Guard Patrol</h1>
        <button 
          onClick={() => {
            localStorage.clear();
            router.push('/');
          }}
          className="text-sm text-red-500 underline"
        >
          Logout
        </button>
      </div>
      
      <div className="space-y-4">
        {checkpoints.map((spot) => (
          <div key={spot.id} className="bg-white p-6 rounded-xl shadow-md flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{spot.name}</h2>
              <p className="text-gray-500 text-sm">Tap to scan</p>
            </div>
            
            <button 
              onClick={() => handleCheckIn(spot.id)}
              disabled={checkingIn === spot.id}
              className={`px-6 py-3 rounded-lg font-bold text-white transition-all ${
                checkingIn === spot.id ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {checkingIn === spot.id ? 'Saving...' : 'Check In'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}