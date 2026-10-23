export type Role = "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE" | "CONTRACTOR";

export type MembershipStatus = "ACTIVE" | "REVOKED" | "PENDING";

export type OrganizationStatus = "ACTIVE" | "SUSPENDED";

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  organizationId: string;
  userId: string;
  role: Role;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
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
