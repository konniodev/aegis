"use client";

import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { OrgOut } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function TagInput({
  label,
  values,
  onChange,
  placeholder,
  suggestions,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");
  const listId = `suggestions-${label.replace(/\s+/g, "-").toLowerCase()}`;

  function add(value: string) {
    const trimmed = value.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setDraft("");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {suggestions && <datalist id={listId}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>}
      <div className="flex flex-wrap gap-1.5 min-h-10 rounded-md border border-input bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-sm">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="text-muted-foreground hover:text-foreground leading-none">×</button>
          </span>
        ))}
        <input
          className="flex-1 min-w-32 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => { if (draft.trim()) add(draft); }}
          placeholder={values.length === 0 ? placeholder : ""}
          list={listId}
        />
      </div>
      <p className="text-xs text-muted-foreground">Press Enter or comma to add</p>
    </div>
  );
}

const COUNTRY_SUGGESTIONS = [
  "United States", "United Kingdom", "Germany", "France", "Canada", "Australia",
  "Brazil", "India", "Japan", "Singapore", "Netherlands", "Sweden", "Spain",
  "Italy", "South Korea", "Mexico", "Argentina", "South Africa", "Nigeria",
  "United Arab Emirates", "Saudi Arabia", "Switzerland", "Belgium", "Portugal",
];

const INDUSTRY_SUGGESTIONS = [
  "Financial Services", "Healthcare", "Technology", "Retail", "Manufacturing",
  "Government", "Defense", "Education", "Energy & Utilities", "Telecommunications",
  "Insurance", "Pharmaceuticals", "Legal", "Media & Entertainment",
  "Transportation & Logistics", "Real Estate", "Agriculture", "Non-Profit",
];

export default function OrgSettingsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [org, setOrg] = useState<OrgOut | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<OrgOut>(`/api/v1/organizations/slug/${orgSlug}`)
      .then((o) => {
        setOrg(o);
        setName(o.name);
        setAddress(o.address ?? "");
        setCountries(o.countries ?? []);
        setIndustries(o.industries ?? []);
      })
      .catch(() => {});
  }, [orgSlug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const updated = await api.patch<OrgOut>(`/api/v1/organizations/slug/${orgSlug}/settings`, {
        name: name.trim() || undefined,
        address: address.trim() || null,
        countries,
        industries,
      });
      setOrg(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  if (!org) return null;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Organization Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your organization profile</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="org-name">Organization Name</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Acme Corp"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="org-address">Headquarter Mailing Address</Label>
          <textarea
            id="org-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            placeholder={"123 Main St\nSuite 100\nNew York, NY 10001"}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>

        <TagInput
          label="Countries of Operation"
          values={countries}
          onChange={setCountries}
          placeholder="Type a country and press Enter…"
          suggestions={COUNTRY_SUGGESTIONS}
        />

        <TagInput
          label="Industries"
          values={industries}
          onChange={setIndustries}
          placeholder="Type an industry and press Enter…"
          suggestions={INDUSTRY_SUGGESTIONS}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-green-600">Changes saved.</p>}

        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
