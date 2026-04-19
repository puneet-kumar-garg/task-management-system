import { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';

const entityIcon = { task: '📋', team: '👥', user: '👤' };

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/activity')
      .then((r) => setLogs(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold dark:text-white">Activity Log</h1>

      {logs.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <BellIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No activity yet</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-700">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span className="text-xl mt-0.5">{entityIcon[log.entity_type]}</span>
              <div className="flex-1">
                <p className="text-sm dark:text-gray-200">{log.action}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
