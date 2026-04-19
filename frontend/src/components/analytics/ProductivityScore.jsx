import { motion } from 'framer-motion';

const getColor = (score) => {
  if (score >= 80) return { stroke: '#22c55e', label: 'Excellent', bg: 'text-green-500' };
  if (score >= 60) return { stroke: '#3b82f6', label: 'Good',      bg: 'text-blue-500' };
  if (score >= 40) return { stroke: '#eab308', label: 'Fair',      bg: 'text-yellow-500' };
  return                  { stroke: '#ef4444', label: 'Needs Work', bg: 'text-red-500' };
};

export default function ProductivityScore({ score = 0, stats = {} }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const { stroke, label, bg } = getColor(score);

  return (
    <div className="card flex flex-col items-center gap-4 py-6">
      <h3 className="font-semibold">Productivity Score</h3>
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100" />
          <motion.circle
            cx="60" cy="60" r={r} fill="none"
            stroke={stroke} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${bg}`}>{score}</span>
          <span className="text-xs text-gray-400">{label}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full text-center">
        {[
          { label: 'Completed', value: stats.completed || 0, color: 'text-green-500' },
          { label: 'On Time',   value: stats.on_time || 0,   color: 'text-blue-500' },
          { label: 'Overdue',   value: stats.overdue || 0,   color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
