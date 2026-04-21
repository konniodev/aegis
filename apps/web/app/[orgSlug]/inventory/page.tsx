"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { HardwareOut, OrgOut, SoftwareOut, ThreatOut } from "@/lib/types";

const LEVEL_COLOR: Record<string, string> = {
  "Very High": "text-red-600",
  High: "text-orange-500",
  Moderate: "text-yellow-600",
  Low: "text-green-600",
};

export default function InventoryOverview() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [org, setOrg] = useState<OrgOut | null>(null);
  const [threats, setThreats] = useState<ThreatOut[]>([]);
  const [software, setSoftware] = useState<SoftwareOut[]>([]);
  const [hardware, setHardware] = useState<HardwareOut[]>([]);

  useEffect(() => {
    api.get<OrgOut>(`/api/v1/organizations/slug/${orgSlug}`).then((o) => {
      setOrg(o);
      const id = o.id;
      Promise.all([
        api.get<ThreatOut[]>(`/api/v1/organizations/${id}/inventory/threats`),
        api.get<SoftwareOut[]>(`/api/v1/organizations/${id}/inventory/software`),
        api.get<HardwareOut[]>(`/api/v1/organizations/${id}/inventory/hardware`),
      ]).then(([t, s, h]) => { setThreats(t); setSoftware(s); setHardware(h); }).catch(() => {});
    }).catch(() => {});
  }, [orgSlug]);

  const criticalThreats = threats.filter((t) => t.aggregate_level === "Very High").length;
  const activeApps = software.filter((s) => s.status === "Active").length;
  const activeHardware = hardware.filter((h) => h.status === "Active").length;

  const CARDS = [
    { label: "Threat Records", value: threats.length, sub: `${criticalThreats} very high`, href: "threats", color: "border-red-200 bg-red-50" },
    { label: "Software Records", value: software.length, sub: `${activeApps} active`, href: "software", color: "border-blue-200 bg-blue-50" },
    { label: "Hardware Records", value: hardware.length, sub: `${activeHardware} active`, href: "hardware", color: "border-green-200 bg-green-50" },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CARDS.map(({ label, value, sub, href, color }) => (
          <Link key={href} href={`/${orgSlug}/inventory/${href}`} className={`rounded-lg border p-5 hover:shadow-md transition-shadow ${color}`}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </Link>
        ))}
      </div>

      {threats.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Recent Threats</h2>
            <Link href={`/${orgSlug}/inventory/threats`} className="text-sm text-primary hover:underline">View all →</Link>
          </div>
          <div className="rounded-lg border bg-card divide-y">
            {threats.slice(0, 5).map((t) => (
              <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.category ?? "—"} · {t.source ?? "—"}</p>
                </div>
                <span className={`text-xs font-semibold ${LEVEL_COLOR[t.aggregate_level ?? ""] ?? "text-muted-foreground"}`}>
                  {t.aggregate_level ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {software.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Recent Software</h2>
            <Link href={`/${orgSlug}/inventory/software`} className="text-sm text-primary hover:underline">View all →</Link>
          </div>
          <div className="rounded-lg border bg-card divide-y">
            {software.slice(0, 5).map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.vendor_name ?? "—"} · {s.business_unit ?? "—"}</p>
                </div>
                <span className="text-xs text-muted-foreground">{s.status ?? "—"}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
