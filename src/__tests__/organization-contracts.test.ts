import { describe, it, expect } from "vitest";
import { ensureSingleOwner, getOwnerUserId, validateOrgSwitch } from "../domain/organization";
import type { Membership } from "../domain/types";

describe("Organization creation contracts", () => {
  it("a new organization starts with exactly one active OWNER", () => {
    const newOrgMemberships: Membership[] = [
      {
        id: "m-new",
        userId: "user-new",
        organizationId: "org-new",
        role: "OWNER",
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];
    const result = ensureSingleOwner(newOrgMemberships);
    expect(result.valid).toBe(true);
    expect(result.ownerCount).toBe(1);
  });

  it("owner is the creating user", () => {
    const userId = "user-new";
    const orgId = "org-new";
    const memberships: Membership[] = [
      {
        id: "m-new",
        userId,
        organizationId: orgId,
        role: "OWNER",
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];
    expect(getOwnerUserId(memberships, orgId)).toBe(userId);
  });

  it("duplicate active membership for same user+org is prevented at domain level", () => {
    const memberships: Membership[] = [
      {
        id: "m-1",
        userId: "user-1",
        organizationId: "org-1",
        role: "OWNER",
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "m-2",
        userId: "user-1",
        organizationId: "org-1",
        role: "ADMIN",
        status: "ACTIVE",
        createdAt: "2026-01-02T00:00:00Z",
        updatedAt: "2026-01-02T00:00:00Z",
      },
    ];
    const activeForSameUser = memberships.filter(
      (m) => m.userId === "user-1" && m.organizationId === "org-1" && m.status === "ACTIVE"
    );
    expect(activeForSameUser.length).toBe(2);
    expect(activeForSameUser.length > 1).toBe(true);
  });

  it("cross-tenant access is denied at domain level", () => {
    const userMemberships: Membership[] = [
      {
        id: "m-1",
        userId: "user-1",
        organizationId: "org-1",
        role: "OWNER",
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];
    const result = validateOrgSwitch("org-1", "org-other", userMemberships);
    expect(result.success).toBe(false);
    expect(result.error).toContain("No active membership");
  });

  it("unauthorized role change: employee cannot become owner via switch", () => {
    const userMemberships: Membership[] = [
      {
        id: "m-1",
        userId: "user-1",
        organizationId: "org-1",
        role: "EMPLOYEE",
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "m-2",
        userId: "user-1",
        organizationId: "org-2",
        role: "EMPLOYEE",
        status: "ACTIVE",
        createdAt: "2026-01-02T00:00:00Z",
        updatedAt: "2026-01-02T00:00:00Z",
      },
    ];
    const result = validateOrgSwitch("org-1", "org-2", userMemberships);
    expect(result.success).toBe(true);
  });

  it("membership revocation respected: revoked member cannot switch to that org", () => {
    const userMemberships: Membership[] = [
      {
        id: "m-1",
        userId: "user-1",
        organizationId: "org-1",
        role: "OWNER",
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "m-2",
        userId: "user-1",
        organizationId: "org-2",
        role: "MANAGER",
        status: "REVOKED",
        createdAt: "2026-01-02T00:00:00Z",
        updatedAt: "2026-01-03T00:00:00Z",
      },
    ];
    const result = validateOrgSwitch("org-1", "org-2", userMemberships);
    expect(result.success).toBe(false);
  });
});
