import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function BurndownChart({ data = [] }) {
  if (!data.length) return null;

  const total = data[0]?.remaining || 0;
  const chartData = data.map((d, i) => ({
    ...d,
    date: format(parseISO(d.date), 'MMM d'),
    ideal: Math.round(total - (total / (data.length - 1)) * i),
  }));

  return (
    <div className="card">
      <h3 className="font-semibold mb-4">Burndown Chart</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <Tooltip
            contentStyle={{ background: 'rgba(17,24,39,0.9)', border: 'none', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#e5e7eb' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="ideal" stroke="#9ca3af" strokeDasharray="5 5" dot={false} name="Ideal" />
          <Line type="monotone" dataKey="remaining" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Remaining" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
