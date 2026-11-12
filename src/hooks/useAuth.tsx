import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "seller" | "customer";
type AuthCtx = {
  session: Session | null;
  user: User | null;
  roles: Role[];
  loading: boolean;
  hasRole: (r: Role) => boolean;
  refreshRoles: () => Promise<Role[]>;
};

const Ctx = createContext<AuthCtx | null>(null);

export async function fetchRoles(userId: string): Promise<Role[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role as Role);
}

export function homeForRoles(roles: Role[]) {
  if (roles.includes("admin")) return "/admin" as const;
  if (roles.includes("seller")) return "/seller" as const;
  return "/" as const;
}

export function AuthProvider({ children, onChange }: { children: ReactNode; onChange?: (event: string) => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => fetchRoles(s.user.id).then(setRoles), 0);
      } else {
        setRoles([]);
      }
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") onChange?.(event);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) setRoles(await fetchRoles(data.session.user.id));
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthCtx = {
    session,
    user: session?.user ?? null,
    roles,
    loading,
    hasRole: (r) => roles.includes(r),
    refreshRoles: async () => {
      if (!session?.user) return [];
      const r = await fetchRoles(session.user.id);
      setRoles(r);
      return r;
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
