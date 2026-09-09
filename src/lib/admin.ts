import { supabase } from '../supabase';
import type {
  AccessProfile,
  Branch,
  BillingStatus,
  Counter,
  Institution,
  InstitutionOverview,
  Owner,
  ProfileScope,
  StaffMember,
  StaffRole,
} from '../types';

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

// --- Instituições / facturação ------------------------------------------------

type InstitutionOverviewRow = {
  id: string; name: string; nif: string | null; type: string | null;
  billing_status: BillingStatus; price_per_counter_kz: number;
  branch_count: number; counter_count: number; mrr_kz: number;
};

export async function listInstitutionsOverview(): Promise<InstitutionOverview[]> {
  const rows = await rpc<InstitutionOverviewRow[]>('owner_list_institutions_overview', {});
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    nif: r.nif,
    type: r.type,
    billingStatus: r.billing_status,
    pricePerCounterKz: Number(r.price_per_counter_kz),
    branchCount: Number(r.branch_count),
    counterCount: Number(r.counter_count),
    mrrKz: Number(r.mrr_kz),
  }));
}

export async function createInstitution(
  id: string, name: string, nif: string, type: string, pricePerCounterKz: number,
) {
  await rpc('owner_create_institution', {
    p_id: id, p_name: name, p_nif: nif || null, p_type: type || null, p_price_per_counter_kz: pricePerCounterKz,
  });
}

export async function updateInstitution(
  id: string, name: string, nif: string, type: string, pricePerCounterKz: number, billingStatus: BillingStatus,
) {
  await rpc('owner_update_institution', {
    p_id: id, p_name: name, p_nif: nif || null, p_type: type || null,
    p_price_per_counter_kz: pricePerCounterKz, p_billing_status: billingStatus,
  });
}

export async function deleteInstitution(id: string) {
  await rpc('owner_delete_institution', { p_id: id });
}

export async function listInstitutions(): Promise<Institution[]> {
  const { data, error } = await supabase.from('institutions').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ id: r.id, name: r.name }));
}

/** Todas as filiais, de todas as instituições -- só para resolver
 * institutionId/branchId a nomes nas tabelas de Colaboradores/Donos
 * (essas RPCs devolvem os ids em bruto, não os nomes). */
export async function listAllBranches(): Promise<Branch[]> {
  const { data, error } = await supabase.from('branches').select('id, institution_id, name');
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ id: r.id, institutionId: r.institution_id, name: r.name }));
}

// --- Filiais / balcões (painel "Gerir balcões") -------------------------------

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
    id: r.id, institutionId: r.institution_id, branchId: r.branch_id, label: r.label, status: r.status, services: r.services,
  }));
}

export async function createCounter(institutionId: string, branchId: string, id: string, label: string) {
  await rpc('owner_create_counter', { p_institution_id: institutionId, p_branch_id: branchId, p_id: id, p_label: label });
}

export async function deleteCounter(institutionId: string, branchId: string, id: string) {
  await rpc('owner_delete_counter', { p_institution_id: institutionId, p_branch_id: branchId, p_id: id });
}

// --- Colaboradores -------------------------------------------------------------

type StaffRow = {
  id: string; email: string; name: string; role: StaffRole;
  institution_id: string; branch_id: string; counter_id: string | null;
  access_profile_id: string | null; access_profile_name: string | null;
};

export async function listAllStaff(): Promise<StaffMember[]> {
  const rows = await rpc<StaffRow[]>('owner_list_staff', {});
  return rows.map((r) => ({
    id: r.id, email: r.email, name: r.name, role: r.role,
    institutionId: r.institution_id, branchId: r.branch_id, counterId: r.counter_id,
    accessProfileId: r.access_profile_id, accessProfileName: r.access_profile_name,
  }));
}

export async function assignStaff(
  email: string, name: string, role: StaffRole, institutionId: string, branchId: string,
) {
  await rpc('owner_assign_staff', {
    p_email: email, p_name: name, p_role: role, p_institution_id: institutionId, p_branch_id: branchId,
  });
}

export async function removeStaff(userId: string) {
  await rpc('owner_remove_staff', { p_user_id: userId });
}

export async function setStaffProfile(userId: string, profileId: string | null) {
  await rpc('owner_set_staff_profile', { p_user_id: userId, p_profile_id: profileId });
}

// --- Donos -----------------------------------------------------------------

type OwnerRow = {
  id: string; email: string; name: string; created_at: string;
  access_profile_id: string | null; access_profile_name: string | null;
};

export async function listOwners(): Promise<Owner[]> {
  const rows = await rpc<OwnerRow[]>('owner_list_owners', {});
  return rows.map((r) => ({
    id: r.id, email: r.email, name: r.name, createdAt: new Date(r.created_at).getTime(),
    accessProfileId: r.access_profile_id, accessProfileName: r.access_profile_name,
  }));
}

export async function addOwner(email: string, name: string) {
  await rpc('owner_add_owner', { p_email: email, p_name: name });
}

export async function removeOwner(userId: string) {
  await rpc('owner_remove_owner', { p_user_id: userId });
}

export async function setOwnerProfile(userId: string, profileId: string | null) {
  await rpc('owner_set_owner_profile', { p_user_id: userId, p_profile_id: profileId });
}

// --- Perfis de acesso --------------------------------------------------------

type AccessProfileRow = { id: string; name: string; scope: ProfileScope; permissions: string[]; user_count: number };

export async function listAccessProfiles(): Promise<AccessProfile[]> {
  const rows = await rpc<AccessProfileRow[]>('owner_list_access_profiles', {});
  return rows.map((r) => ({ id: r.id, name: r.name, scope: r.scope, permissions: r.permissions, userCount: Number(r.user_count) }));
}

export async function createAccessProfile(name: string, scope: ProfileScope, permissions: string[]) {
  await rpc('owner_create_access_profile', { p_name: name, p_scope: scope, p_permissions: permissions });
}

export async function deleteAccessProfile(id: string) {
  await rpc('owner_delete_access_profile', { p_id: id });
}
