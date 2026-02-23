import { Filter, X } from 'lucide-react';
import type { Base, EquipmentType } from '../types';

interface FilterBarProps {
  filters: {
    startDate?: string;
    endDate?: string;
    baseId?: string;
    equipmentTypeId?: string;
  };
  onChange: (filters: any) => void;
  bases?: Base[];
  equipmentTypes?: EquipmentType[];
  hideBase?: boolean;
}

export default function FilterBar({ filters, onChange, bases, equipmentTypes, hideBase }: FilterBarProps) {
  const hasFilters = Object.values(filters).some(Boolean);

  const handleClear = () => {
    onChange({ startDate: '', endDate: '', baseId: '', equipmentTypeId: '' });
  };

  return (
    <div className="card mb-5">
      <div className="flex flex-wrap items-end gap-3">
        <Filter className="w-4 h-4 text-gray-500 mt-6 flex-shrink-0" />

        <div className="flex-1 min-w-[140px]">
          <label className="label">Start Date</label>
          <input
            type="date"
            className="input"
            value={filters.startDate || ''}
            onChange={e => onChange({ ...filters, startDate: e.target.value })}
          />
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="label">End Date</label>
          <input
            type="date"
            className="input"
            value={filters.endDate || ''}
            onChange={e => onChange({ ...filters, endDate: e.target.value })}
          />
        </div>

        {!hideBase && bases && (
          <div className="flex-1 min-w-[160px]">
            <label className="label">Base</label>
            <select
              className="select"
              value={filters.baseId || ''}
              onChange={e => onChange({ ...filters, baseId: e.target.value })}
            >
              <option value="">All Bases</option>
              {bases.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {equipmentTypes && (
          <div className="flex-1 min-w-[180px]">
            <label className="label">Equipment Type</label>
            <select
              className="select"
              value={filters.equipmentTypeId || ''}
              onChange={e => onChange({ ...filters, equipmentTypeId: e.target.value })}
            >
              <option value="">All Equipment</option>
              {equipmentTypes.map(et => (
                <option key={et.id} value={et.id}>{et.name}</option>
              ))}
            </select>
          </div>
        )}

        {hasFilters && (
          <button onClick={handleClear} className="btn-secondary flex-shrink-0">
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
