"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Shell } from "@/components/layout/shell";

const NAV = [
  { href: "/platform/organizations", label: "Organizations" },
  { href: "/platform/users", label: "All Users" },
];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    if (!user.is_superadmin) { router.replace("/"); }
  }, [user, loading, router]);

  if (loading || !user?.is_superadmin) return null;

  return (
    <Shell title="Cloud Console" subtitle="Superadmin" nav={NAV}>
      {children}
    </Shell>
  );
}
