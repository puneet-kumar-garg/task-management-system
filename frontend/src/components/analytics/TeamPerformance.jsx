import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TeamPerformance({ data = [] }) {
  if (!data.length) return (
    <div className="card flex items-center justify-center h-48 text-gray-400 text-sm">No team data</div>
  );

  return (
    <div className="card">
      <h3 className="font-semibold mb-4">Team Performance</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <Tooltip
            contentStyle={{ background: 'rgba(17,24,39,0.9)', border: 'none', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#e5e7eb' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="completed"   fill="#22c55e" name="Completed"   radius={[4,4,0,0]} />
          <Bar dataKey="in_progress" fill="#3b82f6" name="In Progress" radius={[4,4,0,0]} />
          <Bar dataKey="overdue"     fill="#ef4444" name="Overdue"     radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
