import type { Role } from "./types";
import { ROLE_HIERARCHY } from "./types";

export type Permission =
  | "org.view"
  | "org.edit"
  | "org.delete"
  | "org.transfer_ownership"
  | "org.invite"
  | "org.revoke"
  | "org.manage_roles"
  | "time.track"
  | "time.view_own"
  | "time.view_team"
  | "time.edit_own"
  | "time.edit_team"
  | "time.approve"
  | "attendance.view_own"
  | "attendance.view_team"
  | "projects.manage"
  | "clients.manage"
  | "billing.view"
  | "billing.manage"
  | "reports.view_own"
  | "reports.view_team"
  | "reports.view_org"
  | "settings.view"
  | "settings.manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    "org.view", "org.edit", "org.delete", "org.transfer_ownership",
    "org.invite", "org.revoke", "org.manage_roles",
    "time.track", "time.view_own", "time.view_team", "time.edit_own", "time.edit_team", "time.approve",
    "attendance.view_own", "attendance.view_team",
    "projects.manage", "clients.manage",
    "billing.view", "billing.manage",
    "reports.view_own", "reports.view_team", "reports.view_org",
    "settings.view", "settings.manage",
  ],
  ADMIN: [
    "org.view", "org.edit",
    "org.invite", "org.revoke", "org.manage_roles",
    "time.track", "time.view_own", "time.view_team", "time.edit_own", "time.edit_team", "time.approve",
    "attendance.view_own", "attendance.view_team",
    "projects.manage", "clients.manage",
    "billing.view", "billing.manage",
    "reports.view_own", "reports.view_team", "reports.view_org",
    "settings.view", "settings.manage",
  ],
  MANAGER: [
    "org.view",
    "org.invite",
    "time.track", "time.view_own", "time.view_team", "time.edit_own", "time.edit_team", "time.approve",
    "attendance.view_own", "attendance.view_team",
    "projects.manage", "clients.manage",
    "billing.view",
    "reports.view_own", "reports.view_team",
    "settings.view",
  ],
  EMPLOYEE: [
    "org.view",
    "time.track", "time.view_own", "time.edit_own",
    "attendance.view_own",
    "reports.view_own",
    "settings.view",
  ],
  CONTRACTOR: [
    "org.view",
    "time.track", "time.view_own", "time.edit_own",
    "attendance.view_own",
    "reports.view_own",
    "settings.view",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canManageRole(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === "OWNER") return true;
  if (actorRole === "ADMIN") return targetRole !== "OWNER";
  return false;
}

export function isAtLeast(role: Role, minRole: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];
}
