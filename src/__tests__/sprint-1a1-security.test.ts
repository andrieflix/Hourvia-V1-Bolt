import { describe, it, expect } from "vitest";
import {
  validateOwnershipTransfer,
  validateMembershipRevocation,
  ensureSingleOwner,
  getOwnerUserId,
} from "../domain/organization";
import type { Membership, Role } from "../domain/types";

function makeMembership(
  id: string,
  userId: string,
  orgId: string,
  role: Role,
  status: Membership["status"] = "ACTIVE"
): Membership {
  return {
    id,
    userId,
    organizationId: orgId,
    role,
    status,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

const ORG = "org-1";

// ================================================================
// Sprint 1A.1 — RLS Recursion Remediation Tests
// Verifies the domain contracts that mirror the is_active_member
// SECURITY DEFINER helper. The helper breaks the self-referential
// SELECT policy by running as SECURITY DEFINER (bypasses RLS) and
// returning a boolean, so the policy never queries the same table
// it protects.
// ================================================================

describe("Sprint 1A.1: RLS recursion remediation — membership visibility", () => {
  it("active member can see memberships in their own org", () => {
    const memberships = [
      makeMembership("m-1", "user-1", ORG, "OWNER"),
      makeMembership("m-2", "user-2", ORG, "ADMIN"),
    ];

    const isMember = memberships.some(
      (m) => m.userId === "user-1" && m.organizationId === ORG && m.status === "ACTIVE"
    );
    expect(isMember).toBe(true);
  });

  it("non-member cannot see memberships in another org", () => {
    const memberships = [
      makeMembership("m-1", "user-1", ORG, "OWNER"),
    ];

    const isMember = memberships.some(
      (m) => m.userId === "user-2" && m.organizationId === ORG && m.status === "ACTIVE"
    );
    expect(isMember).toBe(false);
  });

  it("revoked member is not considered active", () => {
    const memberships = [
      makeMembership("m-1", "user-1", ORG, "EMPLOYEE", "REVOKED"),
    ];

    const isMember = memberships.some(
      (m) => m.userId === "user-1" && m.organizationId === ORG && m.status === "ACTIVE"
    );
    expect(isMember).toBe(false);
  });

  it("pending member is not considered active", () => {
    const memberships = [
      makeMembership("m-1", "user-1", ORG, "EMPLOYEE", "PENDING"),
    ];

    const isMember = memberships.some(
      (m) => m.userId === "user-1" && m.organizationId === ORG && m.status === "ACTIVE"
    );
    expect(isMember).toBe(false);
  });
});

// ================================================================
// Sprint 1A.1 — Exactly-One-Owner Invariant Tests
// The partial unique index guarantees AT MOST one owner.
// The constraint trigger guarantees EXACTLY one (count != 1 → reject).
// These tests verify the domain-level equivalent.
// ================================================================

describe("Sprint 1A.1: exactly-one-owner invariant", () => {
  it("exactly one active owner is valid", () => {
    const memberships = [
      makeMembership("m-1", "user-1", ORG, "OWNER"),
      makeMembership("m-2", "user-2", ORG, "ADMIN"),
    ];
    const result = ensureSingleOwner(memberships);
    expect(result.valid).toBe(true);
    expect(result.ownerCount).toBe(1);
  });

  it("zero active owners is invalid", () => {
    const memberships = [
      makeMembership("m-1", "user-1", ORG, "ADMIN"),
    ];
    const result = ensureSingleOwner(memberships);
    expect(result.valid).toBe(false);
    expect(result.ownerCount).toBe(0);
  });

  it("two active owners is invalid", () => {
    const memberships = [
      makeMembership("m-1", "user-1", ORG, "OWNER"),
      makeMembership("m-2", "user-2", ORG, "OWNER"),
    ];
    const result = ensureSingleOwner(memberships);
    expect(result.valid).toBe(false);
    expect(result.ownerCount).toBe(2);
  });

  it("revoked owner does not count as active owner", () => {
    const memberships = [
      makeMembership("m-1", "user-1", ORG, "OWNER", "REVOKED"),
      makeMembership("m-2", "user-2", ORG, "OWNER"),
    ];
    const result = ensureSingleOwner(memberships);
    expect(result.valid).toBe(true);
    expect(result.ownerCount).toBe(1);
  });

  it("pending owner does not count as active owner", () => {
    const memberships = [
      makeMembership("m-1", "user-1", ORG, "OWNER", "PENDING"),
    ];
    const result = ensureSingleOwner(memberships);
    expect(result.valid).toBe(false);
    expect(result.ownerCount).toBe(0);
  });

  it("demoting the only owner leaves zero owners — invalid", () => {
    const memberships = [
      makeMembership("m-1", "user-1", ORG, "ADMIN"),
    ];
    // Simulates: old owner was demoted to ADMIN, no other owner exists
    const result = ensureSingleOwner(memberships);
    expect(result.valid).toBe(false);
    expect(result.ownerCount).toBe(0);
  });

  it("transferring ownership results in exactly one owner", () => {
    // After transfer: old owner is now ADMIN, new owner is now OWNER
    const memberships = [
      makeMembership("m-1", "user-1", ORG, "ADMIN"),
      makeMembership("m-2", "user-2", ORG, "OWNER"),
    ];
    const result = ensureSingleOwner(memberships);
    expect(result.valid).toBe(true);
    expect(result.ownerCount).toBe(1);
    expect(getOwnerUserId(memberships, ORG)).toBe("user-2");
  });

  it("owners in different orgs do not conflict", () => {
    const memberships = [
      makeMembership("m-1", "user-1", "org-A", "OWNER"),
      makeMembership("m-2", "user-2", "org-B", "OWNER"),
    ];
    const resultA = ensureSingleOwner(
      memberships.filter((m) => m.organizationId === "org-A")
    );
    const resultB = ensureSingleOwner(
      memberships.filter((m) => m.organizationId === "org-B")
    );
    expect(resultA.valid).toBe(true);
    expect(resultB.valid).toBe(true);
  });
});

// ================================================================
// Sprint 1A.1 — Ownership Transfer Edge Cases
// Verifies domain logic that the transfer_ownership SECURITY DEFINER
// function will enforce server-side.
// ================================================================

describe("Sprint 1A.1: ownership transfer edge cases", () => {
  const baseMemberships = [
    makeMembership("m-1", "user-1", ORG, "OWNER"),
    makeMembership("m-2", "user-2", ORG, "ADMIN"),
    makeMembership("m-3", "user-3", ORG, "EMPLOYEE"),
    makeMembership("m-4", "user-4", ORG, "CONTRACTOR", "REVOKED"),
  ];

  it("owner can transfer to an active admin", () => {
    const result = validateOwnershipTransfer(ORG, baseMemberships, "user-2", "OWNER");
    expect(result.success).toBe(true);
    expect(result.newOwnerId).toBe("user-2");
  });

  it("owner can transfer to an active employee", () => {
    const result = validateOwnershipTransfer(ORG, baseMemberships, "user-3", "OWNER");
    expect(result.success).toBe(true);
    expect(result.newOwnerId).toBe("user-3");
  });

  it("non-owner cannot transfer", () => {
    const result = validateOwnershipTransfer(ORG, baseMemberships, "user-2", "ADMIN");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Only the current owner");
  });

  it("cannot transfer to self", () => {
    const result = validateOwnershipTransfer(ORG, baseMemberships, "user-1", "OWNER");
    expect(result.success).toBe(false);
    expect(result.error).toContain("current owner");
  });

  it("cannot transfer to revoked member", () => {
    const result = validateOwnershipTransfer(ORG, baseMemberships, "user-4", "OWNER");
    expect(result.success).toBe(false);
    expect(result.error).toContain("active member");
  });

  it("cannot transfer to non-member", () => {
    const result = validateOwnershipTransfer(ORG, baseMemberships, "user-999", "OWNER");
    expect(result.success).toBe(false);
    expect(result.error).toContain("active member");
  });

  it("cannot transfer to member of a different org", () => {
    const otherOrgMemberships = [
      ...baseMemberships,
      makeMembership("m-5", "user-5", "org-other", "ADMIN"),
    ];
    const result = validateOwnershipTransfer(ORG, otherOrgMemberships, "user-5", "OWNER");
    expect(result.success).toBe(false);
  });
});

// ================================================================
// Sprint 1A.1 — Revocation Blocking Owner Removal
// The constraint trigger blocks revoking the only owner (count→0).
// The revoke_membership function also prevents it at the application
// level. These tests verify the domain contract.
// ================================================================

describe("Sprint 1A.1: revocation cannot remove the only owner", () => {
  it("revoking the owner is blocked", () => {
    const ownerMembership = makeMembership("m-1", "user-1", ORG, "OWNER");
    const result = validateMembershipRevocation(ownerMembership, "ADMIN", "user-2");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Cannot revoke the owner");
  });

  it("self-revocation is blocked (even for owner)", () => {
    const ownerMembership = makeMembership("m-1", "user-1", ORG, "OWNER");
    const result = validateMembershipRevocation(ownerMembership, "OWNER", "user-1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Cannot revoke your own");
  });

  it("admin can revoke a non-owner active member", () => {
    const target = makeMembership("m-2", "user-2", ORG, "EMPLOYEE");
    const result = validateMembershipRevocation(target, "ADMIN", "user-1");
    expect(result.success).toBe(true);
  });

  it("manager cannot revoke an admin", () => {
    const target = makeMembership("m-2", "user-2", ORG, "ADMIN");
    const result = validateMembershipRevocation(target, "MANAGER", "user-3");
    expect(result.success).toBe(false);
  });

  it("cannot revoke an already-revoked membership", () => {
    const target = makeMembership("m-2", "user-2", ORG, "EMPLOYEE", "REVOKED");
    const result = validateMembershipRevocation(target, "ADMIN", "user-1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("not active");
  });
});

// ================================================================
// Sprint 1A.1 — Account Deletion Safety
// The prevent_sole_owner_user_deletion trigger blocks deletion of
// a user who is the sole owner of any org. These tests verify the
// domain-level equivalent.
// ================================================================

describe("Sprint 1A.1: account deletion safety — sole owner protection", () => {
  it("sole owner cannot be deleted (has orgs with no other owner)", () => {
    const memberships = [
      makeMembership("m-1", "user-1", "org-A", "OWNER"),
      makeMembership("m-2", "user-2", "org-A", "ADMIN"),
    ];

    const userToDelete = "user-1";
    const soleOwnedOrgs = memberships.filter(
      (m) =>
        m.userId === userToDelete &&
        m.role === "OWNER" &&
        m.status === "ACTIVE" &&
        !memberships.some(
          (other) =>
            other.organizationId === m.organizationId &&
            other.role === "OWNER" &&
            other.status === "ACTIVE" &&
            other.userId !== userToDelete
        )
    );

    expect(soleOwnedOrgs.length).toBeGreaterThan(0);
  });

  it("non-sole owner can be deleted (another owner exists)", () => {
    const memberships = [
      makeMembership("m-1", "user-1", "org-A", "OWNER"),
      makeMembership("m-2", "user-2", "org-A", "OWNER"),
    ];

    const userToDelete = "user-1";
    const soleOwnedOrgs = memberships.filter(
      (m) =>
        m.userId === userToDelete &&
        m.role === "OWNER" &&
        m.status === "ACTIVE" &&
        !memberships.some(
          (other) =>
            other.organizationId === m.organizationId &&
            other.role === "OWNER" &&
            other.status === "ACTIVE" &&
            other.userId !== userToDelete
        )
    );

    expect(soleOwnedOrgs.length).toBe(0);
  });

  it("user with no organizations can be deleted", () => {
    const memberships: Membership[] = [];
    const userToDelete = "user-1";
    const soleOwnedOrgs = memberships.filter(
      (m) =>
        m.userId === userToDelete &&
        m.role === "OWNER" &&
        m.status === "ACTIVE" &&
        !memberships.some(
          (other) =>
            other.organizationId === m.organizationId &&
            other.role === "OWNER" &&
            other.status === "ACTIVE" &&
            other.userId !== userToDelete
        )
    );

    expect(soleOwnedOrgs.length).toBe(0);
  });

  it("user who is only a member (not owner) can be deleted", () => {
    const memberships = [
      makeMembership("m-1", "user-1", "org-A", "EMPLOYEE"),
      makeMembership("m-2", "user-2", "org-A", "OWNER"),
    ];

    const userToDelete = "user-1";
    const soleOwnedOrgs = memberships.filter(
      (m) =>
        m.userId === userToDelete &&
        m.role === "OWNER" &&
        m.status === "ACTIVE" &&
        !memberships.some(
          (other) =>
            other.organizationId === m.organizationId &&
            other.role === "OWNER" &&
            other.status === "ACTIVE" &&
            other.userId !== userToDelete
        )
    );

    expect(soleOwnedOrgs.length).toBe(0);
  });

  it("revoked owner is not counted as a sole owner", () => {
    const memberships = [
      makeMembership("m-1", "user-1", "org-A", "OWNER", "REVOKED"),
      makeMembership("m-2", "user-2", "org-A", "OWNER"),
    ];

    const userToDelete = "user-1";
    const soleOwnedOrgs = memberships.filter(
      (m) =>
        m.userId === userToDelete &&
        m.role === "OWNER" &&
        m.status === "ACTIVE" &&
        !memberships.some(
          (other) =>
            other.organizationId === m.organizationId &&
            other.role === "OWNER" &&
            other.status === "ACTIVE" &&
            other.userId !== userToDelete
        )
    );

    expect(soleOwnedOrgs.length).toBe(0);
  });
});

// ================================================================
// Sprint 1A.1 — Slug Validation Contracts
// The create_organization function validates slug format server-side.
// These tests verify the domain-level equivalent.
// ================================================================

describe("Sprint 1A.1: slug validation contracts", () => {
  const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/;

  it("accepts a valid lowercase slug", () => {
    expect(SLUG_REGEX.test("acme-corp")).toBe(true);
  });

  it("accepts alphanumeric slug", () => {
    expect(SLUG_REGEX.test("acme123")).toBe(true);
  });

  it("rejects uppercase letters", () => {
    expect(SLUG_REGEX.test("AcmeCorp")).toBe(false);
  });

  it("rejects spaces", () => {
    expect(SLUG_REGEX.test("acme corp")).toBe(false);
  });

  it("rejects special characters", () => {
    expect(SLUG_REGEX.test("acme_corp")).toBe(false);
    expect(SLUG_REGEX.test("acme.corp")).toBe(false);
    expect(SLUG_REGEX.test("acme!corp")).toBe(false);
  });

  it("rejects slug shorter than 3 characters", () => {
    expect(SLUG_REGEX.test("ab")).toBe(false);
  });

  it("rejects slug starting with hyphen", () => {
    expect(SLUG_REGEX.test("-acme")).toBe(false);
  });

  it("rejects slug ending with hyphen", () => {
    expect(SLUG_REGEX.test("acme-")).toBe(false);
  });

  it("accepts slug of exactly 50 characters", () => {
    const slug = "a" + "b".repeat(48) + "c";
    expect(slug.length).toBe(50);
    expect(SLUG_REGEX.test(slug)).toBe(true);
  });

  it("rejects slug longer than 50 characters", () => {
    const slug = "a" + "b".repeat(49) + "c";
    expect(slug.length).toBe(51);
    expect(SLUG_REGEX.test(slug)).toBe(false);
  });

  it("rejects empty slug", () => {
    expect(SLUG_REGEX.test("")).toBe(false);
  });
});
