import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, Package, Truck, Users, 
  AlertTriangle, ShoppingCart, ArrowLeftRight, ChevronRight, Info
} from 'lucide-react';
import { getDashboardMetrics, getNetMovementDetails, getBases, getEquipmentTypes } from '../services';
import FilterBar from '../components/FilterBar';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import type { FilterOptions } from '../types';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  subtitle?: string;
  onClick?: () => void;
  clickable?: boolean;
}

const MetricCard = ({ title, value, icon, color, bgColor, borderColor, subtitle, onClick, clickable }: MetricCardProps) => (
  <div
    className={`card border ${borderColor} transition-all duration-300 ${clickable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
        {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
      </div>
      <div className={`${bgColor} p-3 rounded-xl`}>
        {icon}
      </div>
    </div>
    {clickable && (
      <div className={`flex items-center gap-1 mt-3 text-xs ${color} opacity-70`}>
        <Info className="w-3 h-3" />
        Click to view breakdown
      </div>
    )}
  </div>
);

export default function DashboardPage() {
  const { user, isCommander } = useAuth();
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: '',
    endDate: '',
    baseId: isCommander ? user?.base?.id || '' : '',
    equipmentTypeId: '',
  });
  const [showNetModal, setShowNetModal] = useState(false);

  const { data: bases } = useQuery({
    queryKey: ['bases'],
    queryFn: () => getBases().then(r => r.data),
  });

  const { data: equipmentTypes } = useQuery({
    queryKey: ['equipmentTypes'],
    queryFn: () => getEquipmentTypes().then(r => r.data),
  });

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard', filters],
    queryFn: () => getDashboardMetrics(filters).then(r => r.data),
    placeholderData: prev => prev,
  });

  const { data: netDetails, isLoading: netLoading } = useQuery({
    queryKey: ['netMovement', filters],
    queryFn: () => getNetMovementDetails(filters).then(r => r.data),
    enabled: showNetModal,
  });

  const chartData = metrics ? [
    { name: 'Opening Bal.', value: metrics.openingBalance, fill: '#4B5563' },
    { name: 'Purchases', value: metrics.purchases, fill: '#3d6e3a' },
    { name: 'Transfers In', value: metrics.transfersIn, fill: '#2d7d4a' },
    { name: 'Transfers Out', value: -metrics.transfersOut, fill: '#7c2d2d' },
    { name: 'Expended', value: -metrics.expended, fill: '#7c4a1a' },
    { name: 'Closing Bal.', value: metrics.closingBalance, fill: '#1d4ed8' },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-military-400" />
          Operations Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isCommander ? `${user?.base?.name} — ` : ''}Asset inventory overview and movement tracking
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        bases={bases}
        equipmentTypes={equipmentTypes}
        hideBase={isCommander}
      />

      {/* Metric Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-24 mb-3" />
              <div className="h-7 bg-gray-800 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Opening Balance"
            value={metrics?.openingBalance || 0}
            icon={<Package className="w-5 h-5 text-gray-400" />}
            color="text-gray-300"
            bgColor="bg-gray-800"
            borderColor="border-gray-700"
            subtitle="Stock at period start"
          />
          <MetricCard
            title="Closing Balance"
            value={metrics?.closingBalance || 0}
            icon={<Package className="w-5 h-5 text-blue-400" />}
            color="text-blue-300"
            bgColor="bg-blue-950"
            borderColor="border-blue-900"
            subtitle="Current stock level"
          />
          <MetricCard
            title="Net Movement"
            value={metrics?.netMovement || 0}
            icon={<TrendingUp className="w-5 h-5 text-military-400" />}
            color="text-military-300"
            bgColor="bg-military-950"
            borderColor="border-military-800"
            subtitle="Purchases + In − Out"
            onClick={() => setShowNetModal(true)}
            clickable
          />
          <MetricCard
            title="Purchases"
            value={metrics?.purchases || 0}
            icon={<ShoppingCart className="w-5 h-5 text-green-400" />}
            color="text-green-300"
            bgColor="bg-green-950"
            borderColor="border-green-900"
            subtitle="New acquisitions"
          />
          <MetricCard
            title="Transfers In"
            value={metrics?.transfersIn || 0}
            icon={<Truck className="w-5 h-5 text-cyan-400" />}
            color="text-cyan-300"
            bgColor="bg-cyan-950"
            borderColor="border-cyan-900"
          />
          <MetricCard
            title="Transfers Out"
            value={metrics?.transfersOut || 0}
            icon={<ArrowLeftRight className="w-5 h-5 text-orange-400" />}
            color="text-orange-300"
            bgColor="bg-orange-950"
            borderColor="border-orange-900"
          />
          <MetricCard
            title="Assigned"
            value={metrics?.assigned || 0}
            icon={<Users className="w-5 h-5 text-purple-400" />}
            color="text-purple-300"
            bgColor="bg-purple-950"
            borderColor="border-purple-900"
            subtitle="Active assignments"
          />
          <MetricCard
            title="Expended"
            value={metrics?.expended || 0}
            icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
            color="text-red-300"
            bgColor="bg-red-950"
            borderColor="border-red-900"
            subtitle="Used / consumed"
          />
        </div>
      )}

      {/* Chart */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-military-400" />
            Asset Flow Summary
          </h2>
          <span className="text-xs text-gray-500">Quantity units</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
              labelStyle={{ color: '#d1d5db' }}
              itemStyle={{ color: '#9ca3af' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Net Movement Details Modal */}
      <Modal
        isOpen={showNetModal}
        onClose={() => setShowNetModal(false)}
        title="Net Movement Breakdown"
        size="xl"
      >
        {netLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-military-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Purchases', count: netDetails?.purchases.length || 0, color: 'text-green-400', bg: 'bg-green-950 border-green-900' },
                { label: 'Transfers In', count: netDetails?.transfersIn.length || 0, color: 'text-cyan-400', bg: 'bg-cyan-950 border-cyan-900' },
                { label: 'Transfers Out', count: netDetails?.transfersOut.length || 0, color: 'text-orange-400', bg: 'bg-orange-950 border-orange-900' },
              ].map(({ label, count, color, bg }) => (
                <div key={label} className={`rounded-xl p-4 border ${bg} text-center`}>
                  <p className={`text-2xl font-bold ${color}`}>{count}</p>
                  <p className="text-xs text-gray-400 mt-1">{label} records</p>
                </div>
              ))}
            </div>

            {/* Purchases Table */}
            <Section title="Purchases" icon={<ShoppingCart className="w-4 h-4 text-green-400" />} color="text-green-400">
              <Table
                headers={['Date', 'Base', 'Equipment', 'Qty', 'Supplier']}
                rows={(netDetails?.purchases || []).map(p => [
                  format(new Date(p.purchaseDate), 'dd MMM yyyy'),
                  p.base.name,
                  p.equipmentType.name,
                  p.quantity.toLocaleString(),
                  p.supplier || '—',
                ])}
              />
            </Section>

            {/* Transfers In */}
            <Section title="Transfers In" icon={<Truck className="w-4 h-4 text-cyan-400" />} color="text-cyan-400">
              <Table
                headers={['Date', 'From', 'To', 'Equipment', 'Qty']}
                rows={(netDetails?.transfersIn || []).map(t => [
                  format(new Date(t.transferDate), 'dd MMM yyyy'),
                  t.sourceBase.name,
                  t.destBase.name,
                  t.equipmentType.name,
                  t.quantity.toLocaleString(),
                ])}
              />
            </Section>

            {/* Transfers Out */}
            <Section title="Transfers Out" icon={<ChevronRight className="w-4 h-4 text-orange-400" />} color="text-orange-400">
              <Table
                headers={['Date', 'From', 'To', 'Equipment', 'Qty']}
                rows={(netDetails?.transfersOut || []).map(t => [
                  format(new Date(t.transferDate), 'dd MMM yyyy'),
                  t.sourceBase.name,
                  t.destBase.name,
                  t.equipmentType.name,
                  t.quantity.toLocaleString(),
                ])}
              />
            </Section>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Section({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className={`text-sm font-semibold ${color} flex items-center gap-2 mb-3`}>
        {icon}{title}
      </h3>
      {children}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-600 text-center py-4">No records found</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="min-w-full">
        <thead className="bg-gray-800">
          <tr>
            {headers.map(h => <th key={h} className="table-header">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-800/50 transition-colors">
              {row.map((cell, j) => <td key={j} className="table-cell">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
