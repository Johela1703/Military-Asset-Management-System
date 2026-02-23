import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Plus, Trash2, Edit, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { getBases, createBase, deleteBase, getEquipmentTypes, createEquipmentType, deleteEquipmentType, getUsers, createUser, deleteUser } from '../services';
import Modal from '../components/Modal';
import type { Base, EquipmentType, User } from '../types';

type AdminTab = 'bases' | 'equipment' | 'users';

export default function AdminPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('bases');

  // Bases
  const { data: bases } = useQuery({ queryKey: ['bases'], queryFn: () => getBases().then(r => r.data) });
  const [showBaseModal, setShowBaseModal] = useState(false);
  const [baseForm, setBaseForm] = useState({ name: '', location: '' });
  const [baseError, setBaseError] = useState('');

  const createBaseMutation = useMutation({
    mutationFn: createBase,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bases'] }); setShowBaseModal(false); setBaseForm({ name: '', location: '' }); setBaseError(''); },
    onError: (err: any) => setBaseError(err.response?.data?.message || 'Failed'),
  });

  const deleteBaseMutation = useMutation({
    mutationFn: deleteBase,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bases'] }),
  });

  // Equipment Types
  const { data: equipmentTypes } = useQuery({ queryKey: ['equipmentTypes'], queryFn: () => getEquipmentTypes().then(r => r.data) });
  const [showEqModal, setShowEqModal] = useState(false);
  const [eqForm, setEqForm] = useState({ name: '', category: '', unit: 'unit' });
  const [eqError, setEqError] = useState('');

  const createEqMutation = useMutation({
    mutationFn: createEquipmentType,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipmentTypes'] }); setShowEqModal(false); setEqForm({ name: '', category: '', unit: 'unit' }); setEqError(''); },
    onError: (err: any) => setEqError(err.response?.data?.message || 'Failed'),
  });

  const deleteEqMutation = useMutation({
    mutationFn: deleteEquipmentType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipmentTypes'] }),
  });

  // Users
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => getUsers().then(r => r.data) });
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'LOGISTICS_OFFICER', baseId: '' });
  const [userError, setUserError] = useState('');

  const createUserMutation = useMutation({
    mutationFn: (data: any) => createUser(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowUserModal(false); setUserForm({ name: '', email: '', password: '', role: 'LOGISTICS_OFFICER', baseId: '' }); setUserError(''); },
    onError: (err: any) => setUserError(err.response?.data?.message || 'Failed'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-950 text-red-400 border-red-900',
    BASE_COMMANDER: 'bg-military-950 text-military-400 border-military-900',
    LOGISTICS_OFFICER: 'bg-olive-950 text-olive-400 border-olive-900',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-400" />
          System Administration
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage bases, equipment types, and user accounts</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {(['bases', 'equipment', 'users'] as AdminTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab === 'equipment' ? 'Equipment Types' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Bases Tab */}
      {activeTab === 'bases' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-white">Military Bases</h2>
            <button className="btn-primary" onClick={() => setShowBaseModal(true)}><Plus className="w-4 h-4" /> Add Base</button>
          </div>
          <div className="space-y-2">
            {(bases || []).map((b: Base) => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div>
                  <p className="text-sm font-medium text-white">{b.name}</p>
                  <p className="text-xs text-gray-500">{b.location}</p>
                </div>
                <button onClick={() => { if (window.confirm(`Delete ${b.name}?`)) deleteBaseMutation.mutate(b.id); }} className="text-red-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-950">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {!bases?.length && <p className="text-sm text-gray-600 text-center py-6">No bases configured</p>}
          </div>
        </div>
      )}

      {/* Equipment Types Tab */}
      {activeTab === 'equipment' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-white">Equipment Types</h2>
            <button className="btn-primary" onClick={() => setShowEqModal(true)}><Plus className="w-4 h-4" /> Add Type</button>
          </div>
          <div className="space-y-2">
            {(equipmentTypes || []).map((et: EquipmentType) => (
              <div key={et.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div>
                  <p className="text-sm font-medium text-white">{et.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge bg-gray-700 text-gray-300">{et.category}</span>
                    <span className="text-xs text-gray-500">Unit: {et.unit}</span>
                  </div>
                </div>
                <button onClick={() => { if (window.confirm(`Delete ${et.name}?`)) deleteEqMutation.mutate(et.id); }} className="text-red-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-950">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {!equipmentTypes?.length && <p className="text-sm text-gray-600 text-center py-6">No equipment types configured</p>}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-white">User Accounts</h2>
            <button className="btn-primary" onClick={() => setShowUserModal(true)}><Plus className="w-4 h-4" /> Add User</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-800">
                <tr>{['Name', 'Email', 'Role', 'Base', 'Actions'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {(users || []).map((u: User) => (
                  <tr key={u.id} className="hover:bg-gray-800/40">
                    <td className="table-cell font-medium text-white">{u.name}</td>
                    <td className="table-cell text-gray-400">{u.email}</td>
                    <td className="table-cell">
                      <span className={`badge border text-xs ${roleColors[u.role]}`}>{u.role.replace('_', ' ')}</span>
                    </td>
                    <td className="table-cell text-gray-400">{u.base?.name || '—'}</td>
                    <td className="table-cell">
                      <button onClick={() => { if (window.confirm(`Delete ${u.name}?`)) deleteUserMutation.mutate(u.id); }} className="text-red-500 hover:text-red-400 text-xs flex items-center gap-1 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Base Modal */}
      <Modal isOpen={showBaseModal} onClose={() => setShowBaseModal(false)} title="Add Military Base">
        <form onSubmit={e => { e.preventDefault(); setBaseError(''); createBaseMutation.mutate(baseForm); }} className="space-y-4">
          {baseError && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 p-3 rounded-lg border border-red-900"><AlertCircle className="w-4 h-4" />{baseError}</div>}
          <div><label className="label">Base Name *</label><input type="text" className="input" value={baseForm.name} onChange={e => setBaseForm(f => ({ ...f, name: e.target.value }))} placeholder="Alpha Base" required /></div>
          <div><label className="label">Location *</label><input type="text" className="input" value={baseForm.location} onChange={e => setBaseForm(f => ({ ...f, location: e.target.value }))} placeholder="Northern Region" required /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowBaseModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createBaseMutation.isPending} className="btn-primary flex-1 justify-center">{createBaseMutation.isPending ? 'Creating...' : 'Create Base'}</button>
          </div>
        </form>
      </Modal>

      {/* Equipment Type Modal */}
      <Modal isOpen={showEqModal} onClose={() => setShowEqModal(false)} title="Add Equipment Type">
        <form onSubmit={e => { e.preventDefault(); setEqError(''); createEqMutation.mutate(eqForm); }} className="space-y-4">
          {eqError && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 p-3 rounded-lg border border-red-900"><AlertCircle className="w-4 h-4" />{eqError}</div>}
          <div><label className="label">Name *</label><input type="text" className="input" value={eqForm.name} onChange={e => setEqForm(f => ({ ...f, name: e.target.value }))} placeholder="M4 Carbine" required /></div>
          <div>
            <label className="label">Category *</label>
            <select className="select" value={eqForm.category} onChange={e => setEqForm(f => ({ ...f, category: e.target.value }))} required>
              <option value="">Select category</option>
              {['Weapons', 'Ammunition', 'Vehicles', 'Equipment', 'Supplies'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="label">Unit of Measure</label><input type="text" className="input" value={eqForm.unit} onChange={e => setEqForm(f => ({ ...f, unit: e.target.value }))} placeholder="unit, rounds, kg..." /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowEqModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createEqMutation.isPending} className="btn-primary flex-1 justify-center">{createEqMutation.isPending ? 'Creating...' : 'Create Type'}</button>
          </div>
        </form>
      </Modal>

      {/* User Modal */}
      <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title="Add User Account">
        <form onSubmit={e => { e.preventDefault(); setUserError(''); createUserMutation.mutate(userForm); }} className="space-y-4">
          {userError && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 p-3 rounded-lg border border-red-900"><AlertCircle className="w-4 h-4" />{userError}</div>}
          <div><label className="label">Full Name *</label><input type="text" className="input" value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} placeholder="Col. John Smith" required /></div>
          <div><label className="label">Email *</label><input type="email" className="input" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="name@military.gov" required /></div>
          <div><label className="label">Password *</label><input type="password" className="input" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required /></div>
          <div>
            <label className="label">Role *</label>
            <select className="select" value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))} required>
              <option value="LOGISTICS_OFFICER">Logistics Officer</option>
              <option value="BASE_COMMANDER">Base Commander</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {userForm.role === 'BASE_COMMANDER' && (
            <div>
              <label className="label">Assigned Base *</label>
              <select className="select" value={userForm.baseId} onChange={e => setUserForm(f => ({ ...f, baseId: e.target.value }))}>
                <option value="">Select base</option>
                {bases?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createUserMutation.isPending} className="btn-primary flex-1 justify-center">{createUserMutation.isPending ? 'Creating...' : 'Create User'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
