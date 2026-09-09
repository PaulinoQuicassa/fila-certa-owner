import { supabase } from '../supabase';
import type { Branch, Counter, Institution, Owner, StaffMember, StaffRole } from '../types';

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

// institutions/branches/counters têm SELECT aberto a qualquer
// autenticado (mesma política já usada por fila-certa-staff) -- só as
// mutações (create/delete) precisam de RPC restrita a is_owner().

export async function listInstitutions(): Promise<Institution[]> {
  const { data, error } = await supabase.from('institutions').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ id: r.id, name: r.name }));
}

export async function createInstitution(id: string, name: string) {
  await rpc('owner_create_institution', { p_id: id, p_name: name });
}

export async function deleteInstitution(id: string) {
  await rpc('owner_delete_institution', { p_id: id });
}

export async function listBranches(institutionId: string): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('id, institution_id, name')
    .eq('institution_id', institutionId)
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ id: r.id, institutionId: r.institution_id, name: r.name }));
}

export async function createBranch(institutionId: string, id: string, name: string) {
  await rpc('owner_create_branch', { p_institution_id: institutionId, p_id: id, p_name: name });
}

export async function deleteBranch(institutionId: string, id: string) {
  await rpc('owner_delete_branch', { p_institution_id: institutionId, p_id: id });
}

export async function listCounters(institutionId: string, branchId: string): Promise<Counter[]> {
  const { data, error } = await supabase
    .from('counters')
    .select('id, institution_id, branch_id, label, status, services')
    .eq('institution_id', institutionId)
    .eq('branch_id', branchId)
    .order('label');
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    institutionId: r.institution_id,
    branchId: r.branch_id,
    label: r.label,
    status: r.status,
    services: r.services,
  }));
}

export async function createCounter(institutionId: string, branchId: string, id: string, label: string) {
  await rpc('owner_create_counter', { p_institution_id: institutionId, p_branch_id: branchId, p_id: id, p_label: label });
}

export async function deleteCounter(institutionId: string, branchId: string, id: string) {
  await rpc('owner_delete_counter', { p_institution_id: institutionId, p_branch_id: branchId, p_id: id });
}

type StaffRow = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  institution_id: string;
  branch_id: string;
  counter_id: string | null;
};

export async function listAllStaff(): Promise<StaffMember[]> {
  const rows = await rpc<StaffRow[]>('owner_list_staff', {});
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    institutionId: r.institution_id,
    branchId: r.branch_id,
    counterId: r.counter_id,
  }));
}

export async function assignStaff(
  email: string,
  name: string,
  role: StaffRole,
  institutionId: string,
  branchId: string,
) {
  await rpc('owner_assign_staff', {
    p_email: email,
    p_name: name,
    p_role: role,
    p_institution_id: institutionId,
    p_branch_id: branchId,
  });
}

export async function removeStaff(userId: string) {
  await rpc('owner_remove_staff', { p_user_id: userId });
}

type OwnerRow = { id: string; email: string; name: string; created_at: string };

export async function listOwners(): Promise<Owner[]> {
  const rows = await rpc<OwnerRow[]>('owner_list_owners', {});
  return rows.map((r) => ({ id: r.id, email: r.email, name: r.name, createdAt: new Date(r.created_at).getTime() }));
}

export async function addOwner(email: string, name: string) {
  await rpc('owner_add_owner', { p_email: email, p_name: name });
}

export async function removeOwner(userId: string) {
  await rpc('owner_remove_owner', { p_user_id: userId });
}
