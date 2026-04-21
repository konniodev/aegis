"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { OrgOut } from "@/lib/types";
import { Shell } from "@/components/layout/shell";

const CRF_STEPS = [
  "Initiate", "Inventory", "Select", "Educate", "Implement", "Validate", "Communicate",
];

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [org, setOrg] = useState<OrgOut | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }

    const membership = user.org_memberships.find((m) => m.organization_slug === orgSlug);
    if (!membership && !user.is_superadmin) { router.replace("/"); return; }

    api.get<OrgOut>(`/api/v1/organizations/slug/${orgSlug}`)
      .then(setOrg)
      .catch(() => router.replace("/"));
  }, [user, loading, orgSlug, router]);

  if (loading || !org) return null;

  const membership = user?.org_memberships.find((m) => m.organization_slug === orgSlug);
  const isAdmin = user?.is_superadmin || membership?.role === "admin";

  const nav = [
    { href: `/${orgSlug}/dashboard`, label: "Dashboard" },
    ...CRF_STEPS.map((s) => ({ href: `/${orgSlug}/${s.toLowerCase()}`, label: s })),
    ...(isAdmin ? [
      { href: `/${orgSlug}/members`, label: "Members" },
      { href: `/${orgSlug}/settings`, label: "Settings" },
    ] : []),
  ];

  return (
    <Shell title={org.name} subtitle={isAdmin ? "Org Admin" : "Member"} nav={nav}>
      {children}
    </Shell>
  );
}
