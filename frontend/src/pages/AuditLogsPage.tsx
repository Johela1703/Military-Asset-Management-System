import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Search } from 'lucide-react';
import { getAuditLogs } from '../services';
import { format } from 'date-fns';

const actionColors: Record<string, string> = {
  PURCHASE_CREATED: 'bg-green-950 text-green-400 border-green-900',
  TRANSFER_CREATED: 'bg-cyan-950 text-cyan-400 border-cyan-900',
  ASSIGNMENT_CREATED: 'bg-purple-950 text-purple-400 border-purple-900',
  ASSIGNMENT_RETURNED: 'bg-yellow-950 text-yellow-400 border-yellow-900',
  EXPENDITURE_CREATED: 'bg-red-950 text-red-400 border-red-900',
  SYSTEM_SEEDED: 'bg-gray-800 text-gray-400 border-gray-700',
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, entityType],
    queryFn: () => getAuditLogs({ page, limit, entityType: entityType || undefined }).then(r => r.data),
    placeholderData: prev => prev,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-gray-400" />
          Audit Logs
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Complete transaction history for compliance and security review</p>
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <div className="flex items-center gap-4">
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div className="flex-1">
            <label className="label">Entity Type</label>
            <select className="select" value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              {['Purchase', 'Transfer', 'Assignment', 'Expenditure', 'System'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-white">Transaction Log</h2>
          <span className="text-xs text-gray-500">{data?.total || 0} total entries</span>
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 bg-gray-800 rounded animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-800">
                <tr>{['Timestamp', 'User', 'Role', 'Action', 'Entity', 'Description'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {(data?.logs || []).length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-600 text-sm">No audit records found</td></tr>
                ) : (data?.logs || []).map(log => (
                  <tr key={log.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="table-cell text-gray-400 text-xs whitespace-nowrap font-mono">
                      {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="table-cell">
                      <p className="text-sm font-medium text-white">{log.user.name}</p>
                      <p className="text-xs text-gray-500">{log.user.email}</p>
                    </td>
                    <td className="table-cell">
                      <span className="badge bg-gray-800 text-gray-400 text-xs">{log.user.role.replace('_', ' ')}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge border text-xs ${actionColors[log.action] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="table-cell text-gray-400">{log.entityType}</td>
                    <td className="table-cell text-gray-300 text-xs max-w-xs truncate">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > limit && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
            <span className="text-xs text-gray-500">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, data.total)} of {data.total}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs disabled:opacity-40 py-1.5 px-3">Prev</button>
              <button disabled={page * limit >= data.total} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs disabled:opacity-40 py-1.5 px-3">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
