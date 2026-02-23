import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, AlertTriangle, Plus, AlertCircle, RotateCcw } from 'lucide-react';
import {
  getAssignments, createAssignment, returnAssignment,
  getExpenditures, createExpenditure,
  getBases, getEquipmentTypes
} from '../services';
import FilterBar from '../components/FilterBar';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

type Tab = 'assignments' | 'expenditures';

export default function AssignmentsPage() {
  const { user, isCommander } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('assignments');
  const [filters, setFilters] = useState({
    startDate: '', endDate: '',
    baseId: isCommander ? user?.base?.id || '' : '',
    equipmentTypeId: '', page: 1, limit: 20,
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [formError, setFormError] = useState('');

  const [assignForm, setAssignForm] = useState({
    baseId: isCommander ? user?.base?.id || '' : '',
    equipmentTypeId: '', personnelName: '', quantity: '', assignedDate: '', notes: '',
  });
  const [expForm, setExpForm] = useState({
    baseId: isCommander ? user?.base?.id || '' : '',
    equipmentTypeId: '', quantity: '', reason: '', expendedDate: '', notes: '',
  });

  const { data: bases } = useQuery({ queryKey: ['bases'], queryFn: () => getBases().then(r => r.data) });
  const { data: equipmentTypes } = useQuery({ queryKey: ['equipmentTypes'], queryFn: () => getEquipmentTypes().then(r => r.data) });

  const { data: assignData, isLoading: assignLoading } = useQuery({
    queryKey: ['assignments', filters],
    queryFn: () => getAssignments(filters).then(r => r.data),
    placeholderData: prev => prev,
    enabled: activeTab === 'assignments',
  });

  const { data: expData, isLoading: expLoading } = useQuery({
    queryKey: ['expenditures', filters],
    queryFn: () => getExpenditures(filters).then(r => r.data),
    placeholderData: prev => prev,
    enabled: activeTab === 'expenditures',
  });

  const assignMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setShowAssignModal(false);
      setAssignForm({ baseId: isCommander ? user?.base?.id || '' : '', equipmentTypeId: '', personnelName: '', quantity: '', assignedDate: '', notes: '' });
      setFormError('');
    },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to create assignment'),
  });

  const returnMutation = useMutation({
    mutationFn: returnAssignment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  });

  const expMutation = useMutation({
    mutationFn: createExpenditure,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenditures'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setShowExpModal(false);
      setExpForm({ baseId: isCommander ? user?.base?.id || '' : '', equipmentTypeId: '', quantity: '', reason: '', expendedDate: '', notes: '' });
      setFormError('');
    },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to record expenditure'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Assignments & Expenditures
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track personnel assignments and asset expenditures</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary bg-purple-800 hover:bg-purple-700" onClick={() => { setShowAssignModal(true); setFormError(''); }}>
            <Plus className="w-4 h-4" /> New Assignment
          </button>
          <button className="btn-primary bg-red-900 hover:bg-red-800" onClick={() => { setShowExpModal(true); setFormError(''); }}>
            <AlertTriangle className="w-4 h-4" /> Record Expenditure
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {(['assignments', 'expenditures'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <FilterBar
        filters={filters}
        onChange={f => setFilters({ ...f, page: 1 })}
        bases={bases}
        equipmentTypes={equipmentTypes}
        hideBase={isCommander}
      />

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-white">Assignment Records</h2>
            <span className="text-xs text-gray-500">{assignData?.total || 0} total</span>
          </div>
          {assignLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-800">
                  <tr>{['Assigned Date', 'Personnel', 'Base', 'Equipment', 'Qty', 'Status', 'Return Date', 'Actions'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {(assignData?.assignments || []).length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-600 text-sm">No assignment records found</td></tr>
                  ) : (assignData?.assignments || []).map(a => (
                    <tr key={a.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="table-cell text-gray-400 whitespace-nowrap">{format(new Date(a.assignedDate), 'dd MMM yyyy')}</td>
                      <td className="table-cell font-medium text-white">{a.personnelName}</td>
                      <td className="table-cell">{a.base.name}</td>
                      <td className="table-cell">{a.equipmentType.name}</td>
                      <td className="table-cell font-mono text-purple-400">{a.quantity.toLocaleString()} {a.equipmentType.unit}</td>
                      <td className="table-cell">
                        <span className={`badge border ${a.status === 'ACTIVE' ? 'bg-green-950 text-green-400 border-green-900' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="table-cell text-gray-400 text-xs">
                        {a.returnDate ? format(new Date(a.returnDate), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="table-cell">
                        {a.status === 'ACTIVE' && (
                          <button
                            onClick={() => returnMutation.mutate(a.id)}
                            disabled={returnMutation.isPending}
                            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-40"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination data={assignData} filters={filters} setFilters={setFilters} />
        </div>
      )}

      {/* Expenditures Tab */}
      {activeTab === 'expenditures' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-white">Expenditure Records</h2>
            <span className="text-xs text-gray-500">{expData?.total || 0} total</span>
          </div>
          {expLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-800">
                  <tr>{['Date', 'Base', 'Equipment', 'Category', 'Quantity', 'Reason', 'Notes'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {(expData?.expenditures || []).length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-600 text-sm">No expenditure records found</td></tr>
                  ) : (expData?.expenditures || []).map(e => (
                    <tr key={e.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="table-cell text-gray-400 whitespace-nowrap">{format(new Date(e.expendedDate), 'dd MMM yyyy')}</td>
                      <td className="table-cell font-medium text-white">{e.base.name}</td>
                      <td className="table-cell">{e.equipmentType.name}</td>
                      <td className="table-cell"><span className="badge bg-gray-800 text-gray-300">{e.equipmentType.category}</span></td>
                      <td className="table-cell font-mono text-red-400">{e.quantity.toLocaleString()} {e.equipmentType.unit}</td>
                      <td className="table-cell text-gray-300">{e.reason}</td>
                      <td className="table-cell text-gray-500 text-xs">{e.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination data={expData} filters={filters} setFilters={setFilters} />
        </div>
      )}

      {/* Assignment Modal */}
      <Modal isOpen={showAssignModal} onClose={() => { setShowAssignModal(false); setFormError(''); }} title="New Asset Assignment">
        <form onSubmit={e => { e.preventDefault(); setFormError(''); if (!assignForm.baseId || !assignForm.equipmentTypeId || !assignForm.personnelName || !assignForm.quantity) { setFormError('All required fields must be filled'); return; } assignMutation.mutate({ ...assignForm, quantity: parseInt(assignForm.quantity) } as any); }} className="space-y-4">
          {formError && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 p-3 rounded-lg border border-red-900"><AlertCircle className="w-4 h-4" />{formError}</div>}

          {!isCommander && (
            <div>
              <label className="label">Base *</label>
              <select className="select" value={assignForm.baseId} onChange={e => setAssignForm(f => ({ ...f, baseId: e.target.value }))} required>
                <option value="">Select base</option>
                {bases?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label">Equipment Type *</label>
            <select className="select" value={assignForm.equipmentTypeId} onChange={e => setAssignForm(f => ({ ...f, equipmentTypeId: e.target.value }))} required>
              <option value="">Select equipment</option>
              {equipmentTypes?.map(et => <option key={et.id} value={et.id}>{et.name} ({et.category})</option>)}
            </select>
          </div>

          <div>
            <label className="label">Personnel Name *</label>
            <input type="text" className="input" value={assignForm.personnelName} onChange={e => setAssignForm(f => ({ ...f, personnelName: e.target.value }))} placeholder="Rank and full name" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input type="number" min="1" className="input" value={assignForm.quantity} onChange={e => setAssignForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" required />
            </div>
            <div>
              <label className="label">Assignment Date</label>
              <input type="date" className="input" value={assignForm.assignedDate} onChange={e => setAssignForm(f => ({ ...f, assignedDate: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea rows={2} className="input" value={assignForm.notes} onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))} placeholder="Assignment purpose..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAssignModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={assignMutation.isPending} className="btn-primary flex-1 justify-center bg-purple-800 hover:bg-purple-700">
              {assignMutation.isPending ? 'Saving...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Expenditure Modal */}
      <Modal isOpen={showExpModal} onClose={() => { setShowExpModal(false); setFormError(''); }} title="Record Asset Expenditure">
        <form onSubmit={e => { e.preventDefault(); setFormError(''); if (!expForm.baseId || !expForm.equipmentTypeId || !expForm.quantity || !expForm.reason) { setFormError('All required fields must be filled'); return; } expMutation.mutate({ ...expForm, quantity: parseInt(expForm.quantity) } as any); }} className="space-y-4">
          {formError && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 p-3 rounded-lg border border-red-900"><AlertCircle className="w-4 h-4" />{formError}</div>}

          {!isCommander && (
            <div>
              <label className="label">Base *</label>
              <select className="select" value={expForm.baseId} onChange={e => setExpForm(f => ({ ...f, baseId: e.target.value }))} required>
                <option value="">Select base</option>
                {bases?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label">Equipment Type *</label>
            <select className="select" value={expForm.equipmentTypeId} onChange={e => setExpForm(f => ({ ...f, equipmentTypeId: e.target.value }))} required>
              <option value="">Select equipment</option>
              {equipmentTypes?.map(et => <option key={et.id} value={et.id}>{et.name} ({et.category})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input type="number" min="1" className="input" value={expForm.quantity} onChange={e => setExpForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" required />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={expForm.expendedDate} onChange={e => setExpForm(f => ({ ...f, expendedDate: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">Reason *</label>
            <input type="text" className="input" value={expForm.reason} onChange={e => setExpForm(f => ({ ...f, reason: e.target.value }))} placeholder="Training, combat, maintenance..." required />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea rows={2} className="input" value={expForm.notes} onChange={e => setExpForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional details..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowExpModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={expMutation.isPending} className="btn-primary flex-1 justify-center bg-red-900 hover:bg-red-800">
              {expMutation.isPending ? 'Recording...' : 'Record Expenditure'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Pagination({ data, filters, setFilters }: { data: any; filters: any; setFilters: any }) {
  if (!data || data.total <= data.limit) return null;
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
      <span className="text-xs text-gray-500">
        Showing {((filters.page - 1) * filters.limit) + 1}–{Math.min(filters.page * filters.limit, data.total)} of {data.total}
      </span>
      <div className="flex gap-2">
        <button disabled={filters.page <= 1} onClick={() => setFilters((f: any) => ({ ...f, page: f.page - 1 }))} className="btn-secondary text-xs disabled:opacity-40 py-1.5 px-3">Prev</button>
        <button disabled={filters.page * filters.limit >= data.total} onClick={() => setFilters((f: any) => ({ ...f, page: f.page + 1 }))} className="btn-secondary text-xs disabled:opacity-40 py-1.5 px-3">Next</button>
      </div>
    </div>
  );
}
