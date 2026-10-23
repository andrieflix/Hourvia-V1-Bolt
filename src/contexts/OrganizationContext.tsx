import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import type { Role, MembershipStatus } from "../domain/types";

export interface UserOrganization {
  id: string;
  name: string;
  slug: string;
  status: string;
  role: Role;
  membershipStatus: MembershipStatus;
}

interface OrganizationContextValue {
  organizations: UserOrganization[];
  activeOrganization: UserOrganization | null;
  loading: boolean;
  error: string | null;
  switchOrganization: (orgId: string) => void;
  refresh: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

const STORAGE_KEY = "hourvia-active-org-id";

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<UserOrganization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setActiveOrganization(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from("organization_memberships")
        .select(
          `
          role,
          status,
          organization:organizations (
            id,
            name,
            slug,
            status
          )
        `
        )
        .eq("user_id", user.id)
        .eq("status", "ACTIVE");

      if (queryError) {
        if (queryError.code === "42P01" || queryError.message.includes("does not exist")) {
          setOrganizations([]);
          setActiveOrganization(null);
        } else {
          setError(queryError.message);
          setOrganizations([]);
        }
        setLoading(false);
        return;
      }

      const orgs: UserOrganization[] = (data || [])
        .filter((row) => row.organization)
        .map((row) => {
          const org = row.organization as unknown as {
            id: string;
            name: string;
            slug: string;
            status: string;
          };
          return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            status: org.status,
            role: row.role as Role,
            membershipStatus: row.status as MembershipStatus,
          };
        });

      setOrganizations(orgs);

      const storedId = localStorage.getItem(STORAGE_KEY);
      const stored = storedId ? orgs.find((o) => o.id === storedId) : null;
      const nextActive = stored ?? orgs[0] ?? null;

      if (nextActive) {
        localStorage.setItem(STORAGE_KEY, nextActive.id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      setActiveOrganization(nextActive);
    } catch {
      setOrganizations([]);
      setActiveOrganization(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const switchOrganization = useCallback(
    (orgId: string) => {
      const target = organizations.find((o) => o.id === orgId);
      if (target && target.membershipStatus === "ACTIVE") {
        localStorage.setItem(STORAGE_KEY, orgId);
        setActiveOrganization(target);
      }
    },
    [organizations]
  );

  const refresh = useCallback(async () => {
    await loadOrganizations();
  }, [loadOrganizations]);

  return (
    <OrganizationContext.Provider
      value={{ organizations, activeOrganization, loading, error, switchOrganization, refresh }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrganizationContextValue {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error("useOrganization must be used within OrganizationProvider");
  return ctx;
}
