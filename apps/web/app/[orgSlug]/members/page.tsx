"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { MemberOut, OrgOut } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function OrgMembersPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [org, setOrg] = useState<OrgOut | null>(null);
  const [members, setMembers] = useState<MemberOut[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<OrgOut>(`/api/v1/organizations/slug/${orgSlug}`)
      .then((o) => {
        setOrg(o);
        return api.get<MemberOut[]>(`/api/v1/organizations/${o.id}/members`);
      })
      .then(setMembers)
      .catch(() => {});
  }, [orgSlug]);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!org) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/api/v1/organizations/${org.id}/members`, { email, full_name: fullName, role });
      const m = await api.get<MemberOut[]>(`/api/v1/organizations/${org.id}/members`);
      setMembers(m);
      setShowForm(false);
      setEmail(""); setFullName("");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setBusy(false); }
  }

  async function removeMember(userId: string) {
    if (!org) return;
    await api.del(`/api/v1/organizations/${org.id}/members/${userId}`).catch(() => {});
    setMembers((p) => p.filter((m) => m.user_id !== userId));
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Members</h1>
          <p className="text-sm text-muted-foreground">{members.length} total</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Invite Member"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleInvite} className="mb-6 rounded-lg border bg-card p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jane@company.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy}>{busy ? "Inviting…" : "Invite"}</Button>
        </form>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.user_id}>
                <TableCell>{m.email}</TableCell>
                <TableCell className="text-muted-foreground">{m.full_name}</TableCell>
                <TableCell><Badge variant={m.role === "admin" ? "default" : "secondary"}>{m.role}</Badge></TableCell>
                <TableCell>
                  <button onClick={() => removeMember(m.user_id)} className="text-xs text-destructive hover:underline">Remove</button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
