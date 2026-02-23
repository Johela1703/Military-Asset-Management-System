import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Plus, AlertCircle } from 'lucide-react';
import { getPurchases, createPurchase, getBases, getEquipmentTypes } from '../services';
import FilterBar from '../components/FilterBar';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function PurchasesPage() {
  const { user, isCommander, isLogistics } = useAuth();
  const qc = useQueryClient();
  const [filters, setFilters] = useState({
    startDate: '', endDate: '',
    baseId: isCommander ? user?.base?.id || '' : '',
    equipmentTypeId: '', page: 1, limit: 20,
  });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    baseId: isCommander ? user?.base?.id || '' : '',
    equipmentTypeId: '', quantity: '', unitCost: '',
    supplier: '', purchaseDate: '', notes: '',
  });
  const [formError, setFormError] = useState('');

  const { data: bases } = useQuery({ queryKey: ['bases'], queryFn: () => getBases().then(r => r.data) });
  const { data: equipmentTypes } = useQuery({ queryKey: ['equipmentTypes'], queryFn: () => getEquipmentTypes().then(r => r.data) });
  const { data, isLoading } = useQuery({
    queryKey: ['purchases', filters],
    queryFn: () => getPurchases(filters).then(r => r.data),
    placeholderData: prev => prev,
  });

  const mutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setShowModal(false);
      setFormData({ baseId: isCommander ? user?.base?.id || '' : '', equipmentTypeId: '', quantity: '', unitCost: '', supplier: '', purchaseDate: '', notes: '' });
      setFormError('');
    },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to create purchase'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.baseId || !formData.equipmentTypeId || !formData.quantity) {
      setFormError('Please fill all required fields');
      return;
    }
    mutation.mutate({ ...formData, quantity: parseInt(formData.quantity) } as any);
  };

  const canCreate = !isLogistics || user?.role === 'LOGISTICS_OFFICER';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-400" />
            Purchases
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Record and track asset acquisitions per base</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> New Purchase
        </button>
      </div>

      <FilterBar
        filters={filters}
        onChange={f => setFilters({ ...f, page: 1 })}
        bases={bases}
        equipmentTypes={equipmentTypes}
        hideBase={isCommander}
      />

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-white">Purchase Records</h2>
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
                  {['Date', 'Base', 'Equipment', 'Category', 'Quantity', 'Unit Cost', 'Total Cost', 'Supplier'].map(h => (
                    <th key={h} className="table-header text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {(data?.purchases || []).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-600 text-sm">No purchase records found</td>
                  </tr>
                ) : (data?.purchases || []).map(p => (
                  <tr key={p.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="table-cell text-gray-400 whitespace-nowrap">
                      {format(new Date(p.purchaseDate), 'dd MMM yyyy')}
                    </td>
                    <td className="table-cell font-medium text-white">{p.base.name}</td>
                    <td className="table-cell">{p.equipmentType.name}</td>
                    <td className="table-cell">
                      <span className="badge bg-gray-800 text-gray-300">{p.equipmentType.category}</span>
                    </td>
                    <td className="table-cell font-mono text-green-400">{p.quantity.toLocaleString()} {p.equipmentType.unit}</td>
                    <td className="table-cell font-mono text-gray-400">
                      {p.unitCost ? `$${p.unitCost.toLocaleString()}` : '—'}
                    </td>
                    <td className="table-cell font-mono font-semibold text-white">
                      {p.totalCost ? `$${p.totalCost.toLocaleString()}` : '—'}
                    </td>
                    <td className="table-cell text-gray-400">{p.supplier || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > data.limit && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
            <span className="text-xs text-gray-500">
              Showing {((filters.page - 1) * filters.limit) + 1}–{Math.min(filters.page * filters.limit, data.total)} of {data.total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={filters.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="btn-secondary text-xs disabled:opacity-40 py-1.5 px-3"
              >Prev</button>
              <button
                disabled={filters.page * filters.limit >= data.total}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="btn-secondary text-xs disabled:opacity-40 py-1.5 px-3"
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFormError(''); }} title="Record New Purchase">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 p-3 rounded-lg border border-red-900">
              <AlertCircle className="w-4 h-4" />{formError}
            </div>
          )}

          {!isCommander && (
            <div>
              <label className="label">Base *</label>
              <select className="select" value={formData.baseId} onChange={e => setFormData(f => ({ ...f, baseId: e.target.value }))} required>
                <option value="">Select base</option>
                {bases?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

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
              <label className="label">Unit Cost ($)</label>
              <input type="number" min="0" step="0.01" className="input" value={formData.unitCost} onChange={e => setFormData(f => ({ ...f, unitCost: e.target.value }))} placeholder="0.00" />
            </div>
          </div>

          <div>
            <label className="label">Supplier</label>
            <input type="text" className="input" value={formData.supplier} onChange={e => setFormData(f => ({ ...f, supplier: e.target.value }))} placeholder="Supplier name" />
          </div>

          <div>
            <label className="label">Purchase Date</label>
            <input type="date" className="input" value={formData.purchaseDate} onChange={e => setFormData(f => ({ ...f, purchaseDate: e.target.value }))} />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea rows={2} className="input" value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? 'Saving...' : 'Record Purchase'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
