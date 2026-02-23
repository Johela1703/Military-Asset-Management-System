export type Role = 'ADMIN' | 'BASE_COMMANDER' | 'LOGISTICS_OFFICER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  base?: { id: string; name: string; location?: string } | null;
}

export interface Base {
  id: string;
  name: string;
  location: string;
  createdAt: string;
}

export interface EquipmentType {
  id: string;
  name: string;
  category: string;
  unit: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  baseId: string;
  equipmentTypeId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier?: string;
  purchaseDate: string;
  notes?: string;
  base: { id: string; name: string };
  equipmentType: { id: string; name: string; category: string; unit: string };
  createdAt: string;
}

export interface Transfer {
  id: string;
  sourceBaseId: string;
  destBaseId: string;
  equipmentTypeId: string;
  quantity: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  transferDate: string;
  notes?: string;
  sourceBase: { id: string; name: string };
  destBase: { id: string; name: string };
  equipmentType: { id: string; name: string; category: string; unit: string };
  createdAt: string;
}

export interface Assignment {
  id: string;
  baseId: string;
  equipmentTypeId: string;
  assignedToId: string;
  personnelName: string;
  quantity: number;
  status: 'ACTIVE' | 'RETURNED';
  assignedDate: string;
  returnDate?: string;
  notes?: string;
  base: { id: string; name: string };
  equipmentType: { id: string; name: string; category: string; unit: string };
  assignedTo: { id: string; name: string; email: string };
  createdAt: string;
}

export interface Expenditure {
  id: string;
  baseId: string;
  equipmentTypeId: string;
  quantity: number;
  reason: string;
  expendedDate: string;
  notes?: string;
  base: { id: string; name: string };
  equipmentType: { id: string; name: string; category: string; unit: string };
  createdAt: string;
}

export interface DashboardMetrics {
  openingBalance: number;
  closingBalance: number;
  netMovement: number;
  purchases: number;
  transfersIn: number;
  transfersOut: number;
  assigned: number;
  expended: number;
}

export interface NetMovementDetails {
  purchases: Purchase[];
  transfersIn: Transfer[];
  transfersOut: Transfer[];
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: string;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string };
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  data?: T[];
}

export interface FilterOptions {
  startDate?: string;
  endDate?: string;
  baseId?: string;
  equipmentTypeId?: string;
  page?: number;
  limit?: number;
}
