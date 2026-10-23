import type { Membership, Role } from "./types";
import { canManageRole } from "./permissions";

export interface OwnershipTransferResult {
  success: boolean;
  error?: string;
  newOwnerId?: string;
}

export function validateOwnershipTransfer(
  organizationId: string,
  memberships: Membership[],
  newOwnerId: string,
  actorRole: Role
): OwnershipTransferResult {
  if (actorRole !== "OWNER") {
    return { success: false, error: "Only the current owner can transfer ownership" };
  }

  const currentOwner = memberships.find(
    (m) => m.organizationId === organizationId && m.role === "OWNER" && m.status === "ACTIVE"
  );
  if (!currentOwner) {
    return { success: false, error: "No active owner found for this organization" };
  }

  if (newOwnerId === currentOwner.userId) {
    return { success: false, error: "Cannot transfer ownership to the current owner" };
  }

  const targetMembership = memberships.find(
    (m) => m.userId === newOwnerId && m.organizationId === organizationId && m.status === "ACTIVE"
  );
  if (!targetMembership) {
    return { success: false, error: "Target user must be an active member of this organization" };
  }

  return { success: true, newOwnerId };
}

export function validateMembershipRevocation(
  membership: Membership,
  actorRole: Role,
  actorId: string
): { success: boolean; error?: string } {
  if (membership.userId === actorId) {
    return { success: false, error: "Cannot revoke your own membership" };
  }

  if (membership.status !== "ACTIVE") {
    return { success: false, error: "Membership is not active" };
  }

  if (membership.role === "OWNER") {
    return { success: false, error: "Cannot revoke the owner's membership" };
  }

  if (!canManageRole(actorRole, membership.role)) {
    return { success: false, error: "Insufficient permissions to revoke this member" };
  }

  return { success: true };
}

export function validateOrgSwitch(
  currentOrgId: string,
  targetOrgId: string,
  userMemberships: Membership[]
): { success: boolean; error?: string } {
  if (currentOrgId === targetOrgId) {
    return { success: false, error: "Already in this organization" };
  }

  const targetMembership = userMemberships.find(
    (m) => m.organizationId === targetOrgId && m.status === "ACTIVE"
  );
  if (!targetMembership) {
    return { success: false, error: "No active membership in target organization" };
  }

  return { success: true };
}

export function ensureSingleOwner(memberships: Membership[]): { valid: boolean; ownerCount: number } {
  const activeOwners = memberships.filter((m) => m.role === "OWNER" && m.status === "ACTIVE");
  return { valid: activeOwners.length === 1, ownerCount: activeOwners.length };
}

export function getOwnerUserId(memberships: Membership[], organizationId: string): string | null {
  const owner = memberships.find(
    (m) => m.organizationId === organizationId && m.role === "OWNER" && m.status === "ACTIVE"
  );
  return owner?.userId ?? null;
}
