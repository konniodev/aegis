"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RootPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    const firstOrg = user.org_memberships[0];
    if (firstOrg) { router.replace(`/${firstOrg.organization_slug}/dashboard`); return; }
    if (user.is_superadmin) { router.replace("/platform/organizations"); return; }
  }, [user, loading, router]);

  if (loading || !user || user.org_memberships.length > 0 || user.is_superadmin) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="text-center space-y-3">
        <h1 className="text-xl font-semibold">Access Pending</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your account <strong>{user.email}</strong> has been created. A platform admin
          needs to add you to an organization before you can access the platform.
        </p>
        <button onClick={logout} className="text-sm text-primary hover:underline">
          Sign out
        </button>
      </div>
    </div>
  );
}
