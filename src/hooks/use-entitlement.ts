import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyEntitlement } from "@/lib/billing/entitlement.functions";
import type { Entitlement } from "@/lib/billing/types";

/**
 * Client-side hook for the current user's billing entitlement.
 * While billing is disabled this always returns { hasFullAccess: true }.
 */
export function useEntitlement() {
  const fetchEntitlement = useServerFn(getMyEntitlement);
  return useQuery<Entitlement>({
    queryKey: ["entitlement", "me"],
    queryFn: () => fetchEntitlement(),
    staleTime: 60_000,
  });
}
