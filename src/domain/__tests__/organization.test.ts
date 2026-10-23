import { describe, it, expect } from "vitest";
import {
  validateOwnershipTransfer,
  validateMembershipRevocation,
  validateOrgSwitch,
  ensureSingleOwner,
} from "../organization";
import type { Membership, Organization } from "../types";

const org: Organization = {
  id: "org-1",
  name: "Acme Studios",
  slug: "acme-studios",
  ownerId: "user-1",
  createdAt: "2026-01-01T00:00:00Z",
};

const memberships: Membership[] = [
  { id: "m-1", userId: "user-1", organizationId: "org-1", role: "OWNER", status: "ACTIVE", createdAt: "2026-01-01T00:00:00Z" },
  { id: "m-2", userId: "user-2", organizationId: "org-1", role: "ADMIN", status: "ACTIVE", createdAt: "2026-01-02T00:00:00Z" },
  { id: "m-3", userId: "user-3", organizationId: "org-1", role: "EMPLOYEE", status: "ACTIVE", createdAt: "2026-01-03T00:00:00Z" },
  { id: "m-4", userId: "user-4", organizationId: "org-1", role: "CONTRACTOR", status: "REVOKED", createdAt: "2026-01-04T00:00:00Z" },
];

describe("Organization ownership invariants", () => {
  describe("validateOwnershipTransfer", () => {
    it("allows owner to transfer to an active admin member", () => {
      const result = validateOwnershipTransfer(org, memberships, "user-2", "user-1", "OWNER");
      expect(result.success).toBe(true);
      expect(result.newOwnerId).toBe("user-2");
    });

    it("rejects transfer by non-owner", () => {
      const result = validateOwnershipTransfer(org, memberships, "user-2", "user-2", "ADMIN");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Only the current owner");
    });

    it("rejects transfer to self", () => {
      const result = validateOwnershipTransfer(org, memberships, "user-1", "user-1", "OWNER");
      expect(result.success).toBe(false);
    });

    it("rejects transfer to non-member", () => {
      const result = validateOwnershipTransfer(org, memberships, "user-999", "user-1", "OWNER");
      expect(result.success).toBe(false);
      expect(result.error).toContain("active member");
    });

    it("rejects transfer to revoked member", () => {
      const result = validateOwnershipTransfer(org, memberships, "user-4", "user-1", "OWNER");
      expect(result.success).toBe(false);
    });
  });

  describe("ensureSingleOwner", () => {
    it("valid when exactly one active owner", () => {
      const result = ensureSingleOwner(memberships);
      expect(result.valid).toBe(true);
      expect(result.ownerCount).toBe(1);
    });

    it("invalid when zero owners", () => {
      const noOwner = memberships.filter((m) => m.role !== "OWNER");
      const result = ensureSingleOwner(noOwner);
      expect(result.valid).toBe(false);
      expect(result.ownerCount).toBe(0);
    });

    it("invalid when two owners", () => {
      const twoOwners: Membership[] = [...memberships, {
        id: "m-5", userId: "user-5", organizationId: "org-1", role: "OWNER", status: "ACTIVE", createdAt: "2026-01-05T00:00:00Z",
      }];
      const result = ensureSingleOwner(twoOwners);
      expect(result.valid).toBe(false);
      expect(result.ownerCount).toBe(2);
    });
  });
});

describe("Membership revocation", () => {
  it("allows admin to revoke employee", () => {
    const target = memberships[2];
    const result = validateMembershipRevocation(target, "ADMIN", "user-2");
    expect(result.success).toBe(true);
  });

  it("prevents self-revocation", () => {
    const target = memberships[0];
    const result = validateMembershipRevocation(target, "OWNER", "user-1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Cannot revoke your own");
  });

  it("prevents revoking owner", () => {
    const target = memberships[0];
    const result = validateMembershipRevocation(target, "ADMIN", "user-2");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Cannot revoke the owner");
  });

  it("prevents revoking already revoked membership", () => {
    const target = memberships[3];
    const result = validateMembershipRevocation(target, "ADMIN", "user-2");
    expect(result.success).toBe(false);
    expect(result.error).toContain("not active");
  });

  it("prevents manager from revoking admin", () => {
    const target = memberships[1];
    const result = validateMembershipRevocation(target, "MANAGER", "user-3");
    expect(result.success).toBe(false);
  });
});

describe("Organization switching boundaries", () => {
  it("allows switching to an org with active membership", () => {
    const userMemberships = [
      ...memberships,
      { id: "m-10", userId: "user-1", organizationId: "org-2", role: "MANAGER" as const, status: "ACTIVE" as const, createdAt: "2026-01-06T00:00:00Z" },
    ];
    const result = validateOrgSwitch("org-1", "org-2", userMemberships);
    expect(result.success).toBe(true);
  });

  it("prevents switching to same org", () => {
    const result = validateOrgSwitch("org-1", "org-1", memberships);
    expect(result.success).toBe(false);
  });

  it("prevents switching to org without membership", () => {
    const result = validateOrgSwitch("org-1", "org-999", memberships);
    expect(result.success).toBe(false);
    expect(result.error).toContain("No active membership");
  });

  it("prevents switching to org with revoked membership", () => {
    const userMemberships = [
      ...memberships,
      { id: "m-11", userId: "user-1", organizationId: "org-2", role: "MANAGER" as const, status: "REVOKED" as const, createdAt: "2026-01-07T00:00:00Z" },
    ];
    const result = validateOrgSwitch("org-1", "org-2", userMemberships);
    expect(result.success).toBe(false);
  });
});
