export type Role = "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE" | "CONTRACTOR";

export type MembershipStatus = "ACTIVE" | "REVOKED" | "PENDING";

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  status: MembershipStatus;
  createdAt: string;
  revokedAt?: string;
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: Role;
  invitedBy: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  createdAt: string;
  expiresAt: string;
}

export interface OrganizationContext {
  organizationId: string;
  role: Role;
  switchedAt: string;
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  EMPLOYEE: 2,
  CONTRACTOR: 1,
};

export const ALL_ROLES: Role[] = ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE", "CONTRACTOR"];
