"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { HardwareOut, OrgOut } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUSES = ["Active", "Inactive", "Decommissioned", "Under Maintenance"];

const EMPTY = { hardware_id: "", vendor: "", model: "", description: "", status: "" };
type FormState = typeof EMPTY;

export default function HardwarePage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [org, setOrg] = useState<OrgOut | null>(null);
  const [items, setItems] = useState<HardwareOut[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HardwareOut | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<OrgOut>(`/api/v1/organizations/slug/${orgSlug}`).then((o) => {
      setOrg(o);
      return api.get<HardwareOut[]>(`/api/v1/organizations/${o.id}/inventory/hardware`);
    }).then(setItems).catch(() => {});
  }, [orgSlug]);

  function openNew() { setEditing(null); setForm(EMPTY); setError(""); setShowForm(true); }
  function openEdit(h: HardwareOut) {
    setEditing(h);
    setForm({
      hardware_id: h.hardware_id ?? "", vendor: h.vendor ?? "",
      model: h.model ?? "", description: h.description ?? "", status: h.status ?? "",
    });
    setError(""); setShowForm(true);
  }
  function set(k: keyof FormState, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!org) return;
    setBusy(true); setError("");
    const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || null]));
    try {
      if (editing) {
        const updated = await api.patch<HardwareOut>(`/api/v1/organizations/${org.id}/inventory/hardware/${editing.id}`, payload);
        setItems((p) => p.map((x) => x.id === updated.id ? updated : x));
      } else {
        const created = await api.post<HardwareOut>(`/api/v1/organizations/${org.id}/inventory/hardware`, payload);
        setItems((p) => [created, ...p]);
      }
      setShowForm(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setBusy(false); }
  }

  async function handleDelete(id: string) {
    if (!org) return;
    await api.del(`/api/v1/organizations/${org.id}/inventory/hardware/${id}`).catch(() => {});
    setItems((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} records</p>
        <Button size="sm" onClick={openNew}>+ Add Hardware</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border bg-card p-5 space-y-4">
          <h3 className="font-medium">{editing ? "Edit Hardware" : "New Hardware"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>ID</Label>
              <Input value={form.hardware_id} onChange={(e) => set("hardware_id", e.target.value)} placeholder="HW-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="">— Select —</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Vendor</Label>
              <Input value={form.vendor} onChange={(e) => set("vendor", e.target.value)} placeholder="e.g. Dell" />
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. PowerEdge R740" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Description</Label>
              <textarea rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the hardware asset…" />
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
              <TableHead>Vendor</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No hardware recorded yet</TableCell></TableRow>
            ) : items.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="font-mono text-xs">{h.hardware_id ?? "—"}</TableCell>
                <TableCell>{h.vendor ?? "—"}</TableCell>
                <TableCell className="font-medium">{h.model ?? "—"}</TableCell>
                <TableCell>{h.status ? <Badge variant="secondary">{h.status}</Badge> : "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{h.description ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(h)} className="text-xs text-primary hover:underline">Edit</button>
                    <button onClick={() => handleDelete(h.id)} className="text-xs text-destructive hover:underline">Delete</button>
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
