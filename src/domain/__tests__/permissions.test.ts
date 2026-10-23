import { describe, it, expect } from "vitest";
import { hasPermission, canManageRole, isAtLeast } from "../permissions";
import type { Role } from "../types";

describe("Role permission rules", () => {
  describe("hasPermission", () => {
    it("OWNER has all permissions", () => {
      expect(hasPermission("OWNER", "org.delete")).toBe(true);
      expect(hasPermission("OWNER", "org.transfer_ownership")).toBe(true);
      expect(hasPermission("OWNER", "billing.manage")).toBe(true);
      expect(hasPermission("OWNER", "settings.manage")).toBe(true);
    });

    it("ADMIN cannot delete org or transfer ownership", () => {
      expect(hasPermission("ADMIN", "org.delete")).toBe(false);
      expect(hasPermission("ADMIN", "org.transfer_ownership")).toBe(false);
      expect(hasPermission("ADMIN", "org.edit")).toBe(true);
      expect(hasPermission("ADMIN", "billing.manage")).toBe(true);
    });

    it("MANAGER cannot manage billing or manage roles", () => {
      expect(hasPermission("MANAGER", "billing.manage")).toBe(false);
      expect(hasPermission("MANAGER", "org.manage_roles")).toBe(false);
      expect(hasPermission("MANAGER", "time.approve")).toBe(true);
      expect(hasPermission("MANAGER", "projects.manage")).toBe(true);
    });

    it("EMPLOYEE can only track and view own data", () => {
      expect(hasPermission("EMPLOYEE", "time.track")).toBe(true);
      expect(hasPermission("EMPLOYEE", "time.view_own")).toBe(true);
      expect(hasPermission("EMPLOYEE", "time.view_team")).toBe(false);
      expect(hasPermission("EMPLOYEE", "time.edit_team")).toBe(false);
      expect(hasPermission("EMPLOYEE", "time.approve")).toBe(false);
      expect(hasPermission("EMPLOYEE", "projects.manage")).toBe(false);
      expect(hasPermission("EMPLOYEE", "billing.view")).toBe(false);
    });

    it("CONTRACTOR has same permissions as EMPLOYEE for tracking", () => {
      expect(hasPermission("CONTRACTOR", "time.track")).toBe(true);
      expect(hasPermission("CONTRACTOR", "time.view_own")).toBe(true);
      expect(hasPermission("CONTRACTOR", "time.view_team")).toBe(false);
      expect(hasPermission("CONTRACTOR", "reports.view_own")).toBe(true);
      expect(hasPermission("CONTRACTOR", "reports.view_team")).toBe(false);
    });
  });

  describe("canManageRole", () => {
    it("OWNER can manage all roles", () => {
      const allRoles: Role[] = ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE", "CONTRACTOR"];
      allRoles.forEach((role) => {
        expect(canManageRole("OWNER", role)).toBe(true);
      });
    });

    it("ADMIN can manage all except OWNER", () => {
      expect(canManageRole("ADMIN", "OWNER")).toBe(false);
      expect(canManageRole("ADMIN", "ADMIN")).toBe(true);
      expect(canManageRole("ADMIN", "MANAGER")).toBe(true);
      expect(canManageRole("ADMIN", "EMPLOYEE")).toBe(true);
    });

    it("MANAGER cannot manage any role", () => {
      expect(canManageRole("MANAGER", "OWNER")).toBe(false);
      expect(canManageRole("MANAGER", "ADMIN")).toBe(false);
      expect(canManageRole("MANAGER", "MANAGER")).toBe(false);
    });

    it("EMPLOYEE cannot manage any role", () => {
      expect(canManageRole("EMPLOYEE", "CONTRACTOR")).toBe(false);
    });
  });

  describe("isAtLeast", () => {
    it("returns true when role meets minimum", () => {
      expect(isAtLeast("OWNER", "ADMIN")).toBe(true);
      expect(isAtLeast("ADMIN", "ADMIN")).toBe(true);
      expect(isAtLeast("MANAGER", "EMPLOYEE")).toBe(true);
    });

    it("returns false when role does not meet minimum", () => {
      expect(isAtLeast("EMPLOYEE", "MANAGER")).toBe(false);
      expect(isAtLeast("CONTRACTOR", "EMPLOYEE")).toBe(false);
    });
  });

  describe("Unauthorized role escalation", () => {
    it("EMPLOYEE cannot access ADMIN permissions", () => {
      expect(hasPermission("EMPLOYEE", "org.invite")).toBe(false);
      expect(hasPermission("EMPLOYEE", "org.revoke")).toBe(false);
      expect(hasPermission("EMPLOYEE", "org.manage_roles")).toBe(false);
    });

    it("CONTRACTOR cannot escalate to MANAGER permissions", () => {
      expect(hasPermission("CONTRACTOR", "projects.manage")).toBe(false);
      expect(hasPermission("CONTRACTOR", "time.approve")).toBe(false);
      expect(hasPermission("CONTRACTOR", "attendance.view_team")).toBe(false);
    });

    it("MANAGER cannot escalate to ADMIN permissions", () => {
      expect(hasPermission("MANAGER", "billing.manage")).toBe(false);
      expect(hasPermission("MANAGER", "settings.manage")).toBe(false);
      expect(hasPermission("MANAGER", "org.manage_roles")).toBe(false);
    });
  });
});
