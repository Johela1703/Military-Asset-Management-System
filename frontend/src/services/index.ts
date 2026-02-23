import api from './api';
import type {
  DashboardMetrics, NetMovementDetails,
  Purchase, Transfer, Assignment, Expenditure,
  Base, EquipmentType, AuditLog, User, FilterOptions
} from '../types';

// ─── Auth ──────────────────────────────────────────────────────────────────

export const login = (email: string, password: string) =>
  api.post<{ token: string; user: User }>('/auth/login', { email, password });

export const getMe = () => api.get<User>('/auth/me');

// ─── Dashboard ─────────────────────────────────────────────────────────────

export const getDashboardMetrics = (filters: FilterOptions) =>
  api.get<DashboardMetrics>('/dashboard/metrics', { params: filters });

export const getNetMovementDetails = (filters: FilterOptions) =>
  api.get<NetMovementDetails>('/dashboard/net-movement-details', { params: filters });

// ─── Purchases ─────────────────────────────────────────────────────────────

export const getPurchases = (filters: FilterOptions & { page?: number; limit?: number }) =>
  api.get<{ purchases: Purchase[]; total: number; page: number; limit: number }>(
    '/purchases', { params: filters }
  );

export const createPurchase = (data: Partial<Purchase> & { quantity: number }) =>
  api.post<Purchase>('/purchases', data);

// ─── Transfers ─────────────────────────────────────────────────────────────

export const getTransfers = (filters: FilterOptions & { page?: number; limit?: number }) =>
  api.get<{ transfers: Transfer[]; total: number; page: number; limit: number }>(
    '/transfers', { params: filters }
  );

export const createTransfer = (data: Partial<Transfer> & { quantity: number }) =>
  api.post<Transfer>('/transfers', data);

// ─── Assignments ───────────────────────────────────────────────────────────

export const getAssignments = (filters: FilterOptions & { page?: number; limit?: number; status?: string }) =>
  api.get<{ assignments: Assignment[]; total: number; page: number; limit: number }>(
    '/assignments', { params: filters }
  );

export const createAssignment = (data: Partial<Assignment> & { quantity: number }) =>
  api.post<Assignment>('/assignments', data);

export const returnAssignment = (id: string) =>
  api.patch<Assignment>(`/assignments/${id}/return`);

// ─── Expenditures ──────────────────────────────────────────────────────────

export const getExpenditures = (filters: FilterOptions & { page?: number; limit?: number }) =>
  api.get<{ expenditures: Expenditure[]; total: number; page: number; limit: number }>(
    '/expenditures', { params: filters }
  );

export const createExpenditure = (data: Partial<Expenditure> & { quantity: number }) =>
  api.post<Expenditure>('/expenditures', data);

// ─── Bases ─────────────────────────────────────────────────────────────────

export const getBases = () => api.get<Base[]>('/bases');

export const createBase = (data: { name: string; location: string }) =>
  api.post<Base>('/bases', data);

export const updateBase = (id: string, data: { name: string; location: string }) =>
  api.put<Base>(`/bases/${id}`, data);

export const deleteBase = (id: string) => api.delete(`/bases/${id}`);

// ─── Equipment Types ────────────────────────────────────────────────────────

export const getEquipmentTypes = () => api.get<EquipmentType[]>('/equipment-types');

export const createEquipmentType = (data: { name: string; category: string; unit: string }) =>
  api.post<EquipmentType>('/equipment-types', data);

export const updateEquipmentType = (id: string, data: Partial<EquipmentType>) =>
  api.put<EquipmentType>(`/equipment-types/${id}`, data);

export const deleteEquipmentType = (id: string) => api.delete(`/equipment-types/${id}`);

// ─── Users ─────────────────────────────────────────────────────────────────

export const getUsers = () => api.get<User[]>('/users');

export const createUser = (data: Partial<User> & { password: string }) =>
  api.post<User>('/users', data);

export const updateUser = (id: string, data: Partial<User> & { password?: string }) =>
  api.put<User>(`/users/${id}`, data);

export const deleteUser = (id: string) => api.delete(`/users/${id}`);

// ─── Audit Logs ────────────────────────────────────────────────────────────

export const getAuditLogs = (params?: { page?: number; limit?: number; entityType?: string; action?: string }) =>
  api.get<{ logs: AuditLog[]; total: number; page: number; limit: number }>(
    '/audit-logs', { params }
  );
