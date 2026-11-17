import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function Workspace({ title, children, admin = false }: { title: string; children: ReactNode; admin?: boolean }) {
  const { hasRole } = useAuth();
  if (admin && !hasRole("admin")) return <div className="mx-auto max-w-xl px-4 py-20"><h1 className="text-4xl font-bold">Access restricted</h1><Button asChild className="mt-6"><Link to="/account">My account</Link></Button></div>;
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-7">
      <nav className="mb-8 flex flex-wrap gap-5 border-b pb-4 text-sm font-semibold">
        <Link to="/account">My account</Link>
        {hasRole("admin") && <Link to="/seller">Store Management</Link>}
        {hasRole("admin") && <Link to="/admin">Admin</Link>}
      </nav>
      <h1 className="mb-8 text-5xl font-bold uppercase">{title}</h1>
      {children}
    </div>
  );
}