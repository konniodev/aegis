"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { OrgOut, SoftwareOut } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUSES = ["Active", "Inactive", "Deprecated", "Under Review"];
const CRITICALITIES = ["Low", "Medium", "High", "Critical"];
const DATA_CLASSES = ["Public", "Internal", "Confidential", "Restricted"];

const EMPTY = {
  software_id: "", name: "", status: "", business_unit: "",
  recovery_point_objective: "", recovery_time_objective: "", criticality: "",
  description: "", application_owner: "", data_classification: "",
  compliance: "", vendor_name: "", version: "",
};

type FormState = typeof EMPTY;

export default function SoftwarePage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [org, setOrg] = useState<OrgOut | null>(null);
  const [items, setItems] = useState<SoftwareOut[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SoftwareOut | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<OrgOut>(`/api/v1/organizations/slug/${orgSlug}`).then((o) => {
      setOrg(o);
      return api.get<SoftwareOut[]>(`/api/v1/organizations/${o.id}/inventory/software`);
    }).then(setItems).catch(() => {});
  }, [orgSlug]);

  function openNew() { setEditing(null); setForm(EMPTY); setError(""); setShowForm(true); }
  function openEdit(s: SoftwareOut) {
    setEditing(s);
    setForm({
      software_id: s.software_id ?? "", name: s.name, status: s.status ?? "",
      business_unit: s.business_unit ?? "", recovery_point_objective: s.recovery_point_objective ?? "",
      recovery_time_objective: s.recovery_time_objective ?? "", criticality: s.criticality ?? "",
      description: s.description ?? "", application_owner: s.application_owner ?? "",
      data_classification: s.data_classification ?? "", compliance: s.compliance ?? "",
      vendor_name: s.vendor_name ?? "", version: s.version ?? "",
    });
    setError(""); setShowForm(true);
  }
  function set(k: keyof FormState, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  function toPayload() {
    return Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v || null])
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!org) return;
    setBusy(true); setError("");
    try {
      const payload = toPayload();
      if (editing) {
        const updated = await api.patch<SoftwareOut>(`/api/v1/organizations/${org.id}/inventory/software/${editing.id}`, payload);
        setItems((p) => p.map((x) => x.id === updated.id ? updated : x));
      } else {
        const created = await api.post<SoftwareOut>(`/api/v1/organizations/${org.id}/inventory/software`, payload);
        setItems((p) => [created, ...p]);
      }
      setShowForm(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setBusy(false); }
  }

  async function handleDelete(id: string) {
    if (!org) return;
    await api.del(`/api/v1/organizations/${org.id}/inventory/software/${id}`).catch(() => {});
    setItems((p) => p.filter((x) => x.id !== id));
  }

  const Select = ({ label, field, options }: { label: string; field: keyof FormState; options: string[] }) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form[field]} onChange={(e) => set(field, e.target.value)}>
        <option value="">— Select —</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} records</p>
        <Button size="sm" onClick={openNew}>+ Add Software</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border bg-card p-5 space-y-4">
          <h3 className="font-medium">{editing ? "Edit Software" : "New Software"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>ID</Label>
              <Input value={form.software_id} onChange={(e) => set("software_id", e.target.value)} placeholder="SW-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Application name" />
            </div>
            <Select label="Status" field="status" options={STATUSES} />
            <Select label="Criticality" field="criticality" options={CRITICALITIES} />
            <div className="space-y-1.5">
              <Label>Business Unit</Label>
              <Input value={form.business_unit} onChange={(e) => set("business_unit", e.target.value)} placeholder="e.g. Finance" />
            </div>
            <div className="space-y-1.5">
              <Label>Application Owner</Label>
              <Input value={form.application_owner} onChange={(e) => set("application_owner", e.target.value)} placeholder="Owner name or email" />
            </div>
            <div className="space-y-1.5">
              <Label>Vendor Name</Label>
              <Input value={form.vendor_name} onChange={(e) => set("vendor_name", e.target.value)} placeholder="e.g. Microsoft" />
            </div>
            <div className="space-y-1.5">
              <Label>Version</Label>
              <Input value={form.version} onChange={(e) => set("version", e.target.value)} placeholder="e.g. 2.1.4" />
            </div>
            <div className="space-y-1.5">
              <Label>RPO</Label>
              <Input value={form.recovery_point_objective} onChange={(e) => set("recovery_point_objective", e.target.value)} placeholder="e.g. 4 hours" />
            </div>
            <div className="space-y-1.5">
              <Label>RTO</Label>
              <Input value={form.recovery_time_objective} onChange={(e) => set("recovery_time_objective", e.target.value)} placeholder="e.g. 8 hours" />
            </div>
            <Select label="Data Classification" field="data_classification" options={DATA_CLASSES} />
            <div className="space-y-1.5">
              <Label>Compliance</Label>
              <Input value={form.compliance} onChange={(e) => set("compliance", e.target.value)} placeholder="e.g. SOC 2, ISO 27001" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Description</Label>
              <textarea rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the application…" />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criticality</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">No software recorded yet</TableCell></TableRow>
            ) : items.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.software_id ?? "—"}</TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.vendor_name ?? "—"}</TableCell>
                <TableCell>{s.version ?? "—"}</TableCell>
                <TableCell>{s.status ? <Badge variant="secondary">{s.status}</Badge> : "—"}</TableCell>
                <TableCell>{s.criticality ?? "—"}</TableCell>
                <TableCell>{s.application_owner ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(s)} className="text-xs text-primary hover:underline">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-xs text-destructive hover:underline">Delete</button>
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
