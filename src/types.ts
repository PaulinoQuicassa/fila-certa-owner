export type StaffRole = 'agent' | 'manager';
export type BillingStatus = 'active' | 'trial' | 'suspended';
export type ProfileScope = 'global' | 'institution';

export interface OwnerProfile {
  uid: string;
  name: string;
}

export interface Institution {
  id: string;
  name: string;
}

export interface InstitutionOverview {
  id: string;
  name: string;
  nif: string | null;
  type: string | null;
  billingStatus: BillingStatus;
  pricePerCounterKz: number;
  branchCount: number;
  counterCount: number;
  mrrKz: number;
}

export interface Branch {
  id: string;
  institutionId: string;
  name: string;
}

export interface Counter {
  id: string;
  institutionId: string;
  branchId: string;
  label: string;
  status: 'available' | 'serving' | 'paused';
  services: string[] | null;
}

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  institutionId: string;
  branchId: string;
  counterId: string | null;
  accessProfileId: string | null;
  accessProfileName: string | null;
}

export interface Owner {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  accessProfileId: string | null;
  accessProfileName: string | null;
}

export interface AccessProfile {
  id: string;
  name: string;
  scope: ProfileScope;
  permissions: string[];
  userCount: number;
}

export const INSTITUTION_TYPES = ['Pública', 'Banco', 'Saúde', 'Telecom', 'Privada'] as const;

export const ACCESS_PERMISSIONS = [
  'Gerir instituições',
  'Gerir facturação',
  'Gerir perfis de acesso',
  'Gerir colaboradores',
  'Gerir balcões',
  'Ver auditoria',
] as const;
