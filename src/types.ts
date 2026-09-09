export type StaffRole = 'agent' | 'manager';

export interface OwnerProfile {
  uid: string;
  name: string;
}

export interface Institution {
  id: string;
  name: string;
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
}

export interface Owner {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}
