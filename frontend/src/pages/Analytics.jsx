import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import api from '../utils/api';
import ProductivityScore from '../components/analytics/ProductivityScore';
import BurndownChart from '../components/analytics/BurndownChart';
import TeamPerformance from '../components/analytics/TeamPerformance';
import { SkeletonStat } from '../components/ui/SkeletonLoader';

export default function Analytics() {
  const [period, setPeriod] = useState('weekly');
  const [trends, setTrends] = useState([]);
  const [productivity, setProductivity] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamPerf, setTeamPerf] = useState([]);
  const [burndown, setBurndown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [trendsRes, prodRes, teamsRes] = await Promise.all([
          api.get(`/analytics/trends?period=${period}`),
          api.get('/analytics/productivity'),
          api.get('/teams'),
        ]);
        setTrends(trendsRes.data.map((d) => ({ ...d, date: format(parseISO(d.date), 'MMM d') })));
        setProductivity(prodRes.data);
        setTeams(teamsRes.data);
        if (teamsRes.data.length && !selectedTeam) setSelectedTeam(teamsRes.data[0].id);
      } catch {}
      setLoading(false);
    };
    load();
  }, [period]);

  useEffect(() => {
    if (!selectedTeam) return;
    Promise.all([
      api.get(`/analytics/team/${selectedTeam}`),
      api.get(`/analytics/burndown/${selectedTeam}`),
    ]).then(([perfRes, burnRes]) => {
      setTeamPerf(perfRes.data);
      setBurndown(burnRes.data);
    }).catch(() => {});
  }, [selectedTeam]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          {['weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                period === p ? 'bg-blue-600 text-white' : 'btn-secondary'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trends chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold mb-4">Task Completion Trends</h3>
          {loading ? <div className="skeleton h-48 rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.9)', border: 'none', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#e5e7eb' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="total"     stroke="#3b82f6" fill="url(#gTotal)" name="Total" />
                <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="url(#gDone)"  name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Productivity score */}
        {loading
          ? <SkeletonStat />
          : <ProductivityScore score={productivity?.score || 0} stats={productivity || {}} />
        }
      </div>

      {/* Team selector */}
      {teams.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium">Team:</span>
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTeam(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedTeam === t.id ? 'bg-blue-600 text-white' : 'btn-secondary'}`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TeamPerformance data={teamPerf} />
        <BurndownChart data={burndown} />
      </div>
    </div>
  );
}
