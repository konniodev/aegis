"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Overview" },
  { href: "/threats", label: "Threats" },
  { href: "/software", label: "Software" },
  { href: "/hardware", label: "Hardware" },
];

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const pathname = usePathname();
  const base = `/${orgSlug}/inventory`;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-8 pt-6">
        <h1 className="text-xl font-semibold mb-4">Inventory</h1>
        <nav className="flex gap-1">
          {TABS.map(({ href, label }) => {
            const full = `${base}${href}`;
            const active = href === "" ? pathname === base : pathname.startsWith(full);
            return (
              <Link
                key={href}
                href={full}
                className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
