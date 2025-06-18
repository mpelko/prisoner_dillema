import { useState, useEffect } from 'react';

interface AdminStats {
  active_games: number;
  waiting_players: number;
  connected_players: number;
}

export default function Admin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/admin/stats');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh stats every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button 
            onClick={fetchStats}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        {loading && !stats ? (
          <div className="text-center p-4">
            <p>Loading statistics...</p>
          </div>
        ) : stats ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Active Games</h3>
                <p className="text-3xl font-bold">{stats.active_games}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Waiting Players</h3>
                <p className="text-3xl font-bold">{stats.waiting_players}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Connected Players</h3>
                <p className="text-3xl font-bold">{stats.connected_players}</p>
              </div>
            </div>

            {lastUpdated && (
              <p className="text-sm text-gray-500 text-right">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        ) : null}
        
        {/* Placeholder for future statistics */}
        <div className="mt-8 p-4 border border-dashed border-gray-300 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Future Statistics</h2>
          <p className="text-gray-600">This area will contain additional statistics such as:</p>
          <ul className="list-disc list-inside text-gray-600 mt-2">
            <li>Total games played</li>
            <li>Average game duration</li>
            <li>Most common player choices</li>
            <li>Win/loss ratios</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 