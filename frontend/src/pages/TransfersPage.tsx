import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Plus, AlertCircle, ArrowRight } from 'lucide-react';
import { getTransfers, createTransfer, getBases, getEquipmentTypes } from '../services';
import FilterBar from '../components/FilterBar';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-950 text-green-400 border-green-900',
  PENDING: 'bg-yellow-950 text-yellow-400 border-yellow-900',
  CANCELLED: 'bg-red-950 text-red-400 border-red-900',
};

export default function TransfersPage() {
  const { user, isCommander } = useAuth();
  const qc = useQueryClient();
  const [filters, setFilters] = useState({
    startDate: '', endDate: '',
    baseId: isCommander ? user?.base?.id || '' : '',
    equipmentTypeId: '', page: 1, limit: 20,
  });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    sourceBaseId: isCommander ? user?.base?.id || '' : '',
    destBaseId: '', equipmentTypeId: '', quantity: '',
    transferDate: '', notes: '',
  });
  const [formError, setFormError] = useState('');

  const { data: bases } = useQuery({ queryKey: ['bases'], queryFn: () => getBases().then(r => r.data) });
  const { data: equipmentTypes } = useQuery({ queryKey: ['equipmentTypes'], queryFn: () => getEquipmentTypes().then(r => r.data) });
  const { data, isLoading } = useQuery({
    queryKey: ['transfers', filters],
    queryFn: () => getTransfers(filters).then(r => r.data),
    placeholderData: prev => prev,
  });

  const mutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setShowModal(false);
      setFormData({ sourceBaseId: isCommander ? user?.base?.id || '' : '', destBaseId: '', equipmentTypeId: '', quantity: '', transferDate: '', notes: '' });
      setFormError('');
    },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to create transfer'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.sourceBaseId || !formData.destBaseId || !formData.equipmentTypeId || !formData.quantity) {
      setFormError('Please fill all required fields');
      return;
    }
    if (formData.sourceBaseId === formData.destBaseId) {
      setFormError('Source and destination bases must be different');
      return;
    }
    mutation.mutate({ ...formData, quantity: parseInt(formData.quantity) } as any);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
            Asset Transfers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track asset movements between bases</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> New Transfer
        </button>
      </div>

      <FilterBar
        filters={filters}
        onChange={f => setFilters({ ...f, page: 1 })}
        bases={bases}
        equipmentTypes={equipmentTypes}
        hideBase={isCommander}
      />

      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-white">Transfer History</h2>
          <span className="text-xs text-gray-500">{data?.total || 0} total records</span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-800">
                <tr>
                  {['Date', 'Route', 'Equipment', 'Category', 'Quantity', 'Status', 'Notes'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {(data?.transfers || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-600 text-sm">No transfer records found</td>
                  </tr>
                ) : (data?.transfers || []).map(t => (
                  <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="table-cell text-gray-400 whitespace-nowrap">
                      {format(new Date(t.transferDate), 'dd MMM yyyy')}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-white">{t.sourceBase.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        <span className="font-medium text-cyan-400">{t.destBase.name}</span>
                      </div>
                    </td>
                    <td className="table-cell">{t.equipmentType.name}</td>
                    <td className="table-cell">
                      <span className="badge bg-gray-800 text-gray-300">{t.equipmentType.category}</span>
                    </td>
                    <td className="table-cell font-mono text-cyan-400">
                      {t.quantity.toLocaleString()} {t.equipmentType.unit}
                    </td>
                    <td className="table-cell">
                      <span className={`badge border ${statusColors[t.status]}`}>{t.status}</span>
                    </td>
                    <td className="table-cell text-gray-500 text-xs">{t.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > data.limit && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
            <span className="text-xs text-gray-500">
              Showing {((filters.page - 1) * filters.limit) + 1}–{Math.min(filters.page * filters.limit, data.total)} of {data.total}
            </span>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} className="btn-secondary text-xs disabled:opacity-40 py-1.5 px-3">Prev</button>
              <button disabled={filters.page * filters.limit >= data.total} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} className="btn-secondary text-xs disabled:opacity-40 py-1.5 px-3">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFormError(''); }} title="Create Asset Transfer">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 p-3 rounded-lg border border-red-900">
              <AlertCircle className="w-4 h-4" />{formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Source Base *</label>
              <select
                className="select"
                value={formData.sourceBaseId}
                onChange={e => setFormData(f => ({ ...f, sourceBaseId: e.target.value }))}
                required
                disabled={isCommander}
              >
                <option value="">Select source</option>
                {bases?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Destination Base *</label>
              <select
                className="select"
                value={formData.destBaseId}
                onChange={e => setFormData(f => ({ ...f, destBaseId: e.target.value }))}
                required
              >
                <option value="">Select destination</option>
                {bases?.filter(b => b.id !== formData.sourceBaseId).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Equipment Type *</label>
            <select className="select" value={formData.equipmentTypeId} onChange={e => setFormData(f => ({ ...f, equipmentTypeId: e.target.value }))} required>
              <option value="">Select equipment</option>
              {equipmentTypes?.map(et => <option key={et.id} value={et.id}>{et.name} ({et.category})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input type="number" min="1" className="input" value={formData.quantity} onChange={e => setFormData(f => ({ ...f, quantity: e.target.value }))} placeholder="0" required />
            </div>
            <div>
              <label className="label">Transfer Date</label>
              <input type="date" className="input" value={formData.transferDate} onChange={e => setFormData(f => ({ ...f, transferDate: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea rows={2} className="input" value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} placeholder="Transfer reason or notes..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? 'Processing...' : 'Create Transfer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
