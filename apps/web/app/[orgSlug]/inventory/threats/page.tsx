"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { OrgOut, ThreatOut } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const LEVEL_VARIANT: Record<string, "default" | "secondary" | "destructive" | "success"> = {
  "Very High": "destructive",
  High: "default",
  Moderate: "secondary",
  Low: "success",
};

function ratingToLevel(rating: number): string {
  if (rating >= 0 && rating < 1) return "Low";
  if (rating >= 1 && rating < 2) return "Moderate";
  if (rating >= 2 && rating < 3) return "High";
  if (rating >= 3 && rating <= 4) return "Very High";
  return "";
}

const EMPTY = {
  threat_id: "", category: "", name: "", description: "",
  aggregate_rating: "", aggregate_level: "", source: "",
};

export default function ThreatsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [org, setOrg] = useState<OrgOut | null>(null);
  const [items, setItems] = useState<ThreatOut[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ThreatOut | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<OrgOut>(`/api/v1/organizations/slug/${orgSlug}`).then((o) => {
      setOrg(o);
      return api.get<ThreatOut[]>(`/api/v1/organizations/${o.id}/inventory/threats`);
    }).then(setItems).catch(() => {});
  }, [orgSlug]);

  function openNew() { setEditing(null); setForm(EMPTY); setError(""); setShowForm(true); }
  function openEdit(t: ThreatOut) {
    setEditing(t);
    setForm({
      threat_id: t.threat_id ?? "", category: t.category ?? "", name: t.name,
      description: t.description ?? "", aggregate_rating: t.aggregate_rating?.toString() ?? "",
      aggregate_level: t.aggregate_rating != null ? ratingToLevel(t.aggregate_rating) : "",
      source: t.source ?? "",
    });
    setError(""); setShowForm(true);
  }
  function set(k: keyof typeof EMPTY, v: string) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "aggregate_rating") {
        const n = parseFloat(v);
        next.aggregate_level = isNaN(n) ? "" : ratingToLevel(n);
      }
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!org) return;
    setBusy(true); setError("");
    const payload = {
      threat_id: form.threat_id || null,
      category: form.category || null,
      name: form.name,
      description: form.description || null,
      aggregate_rating: form.aggregate_rating ? parseFloat(form.aggregate_rating) : null,
      source: form.source || null,
    };
    try {
      if (editing) {
        const updated = await api.patch<ThreatOut>(`/api/v1/organizations/${org.id}/inventory/threats/${editing.id}`, payload);
        setItems((p) => p.map((x) => x.id === updated.id ? updated : x));
      } else {
        const created = await api.post<ThreatOut>(`/api/v1/organizations/${org.id}/inventory/threats`, payload);
        setItems((p) => [created, ...p]);
      }
      setShowForm(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setBusy(false); }
  }

  async function handleDelete(id: string) {
    if (!org) return;
    await api.del(`/api/v1/organizations/${org.id}/inventory/threats/${id}`).catch(() => {});
    setItems((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} records</p>
        <Button size="sm" onClick={openNew}>+ Add Threat</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border bg-card p-5 space-y-4">
          <h3 className="font-medium">{editing ? "Edit Threat" : "New Threat"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>ID</Label>
              <Input value={form.threat_id} onChange={(e) => set("threat_id", e.target.value)} placeholder="T-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Malware" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Threat name" />
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Input value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="e.g. MITRE ATT&CK" />
            </div>
            <div className="space-y-1.5">
              <Label>Aggregate Rating (0–4)</Label>
              <Input type="number" min="0" max="4" step="any" value={form.aggregate_rating} onChange={(e) => set("aggregate_rating", e.target.value)} placeholder="2.75" />
            </div>
            <div className="space-y-1.5">
              <Label>Aggregate Level</Label>
              <div className="flex h-10 items-center">
                {form.aggregate_level
                  ? <Badge variant={LEVEL_VARIANT[form.aggregate_level] ?? "secondary"}>{form.aggregate_level}</Badge>
                  : <span className="text-sm text-muted-foreground">— computed from rating —</span>}
              </div>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Description</Label>
              <textarea rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the threat…" />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Level</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No threats recorded yet</TableCell></TableRow>
            ) : items.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.threat_id ?? "—"}</TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>{t.category ?? "—"}</TableCell>
                <TableCell>{t.source ?? "—"}</TableCell>
                <TableCell>{t.aggregate_rating != null ? t.aggregate_rating.toFixed(2) : "—"}</TableCell>
                <TableCell>
                  {t.aggregate_level
                    ? <Badge variant={LEVEL_VARIANT[t.aggregate_level] ?? "secondary"}>{t.aggregate_level}</Badge>
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(t)} className="text-xs text-primary hover:underline">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="text-xs text-destructive hover:underline">Delete</button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
