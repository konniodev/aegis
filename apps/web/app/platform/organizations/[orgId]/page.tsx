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

export default function OrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [org, setOrg] = useState<OrgOut | null>(null);
  const [members, setMembers] = useState<MemberOut[]>([]);

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("admin");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      api.get<OrgOut>(`/api/v1/organizations/${orgId}`),
      api.get<MemberOut[]>(`/api/v1/organizations/${orgId}/members`),
    ]).then(([o, m]) => { setOrg(o); setMembers(m); }).catch(() => {});
  }, [orgId]);

  async function inviteAdmin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post(`/api/v1/organizations/${orgId}/members`, { email: memberEmail, full_name: memberName, role: memberRole });
      const m = await api.get<MemberOut[]>(`/api/v1/organizations/${orgId}/members`);
      setMembers(m);
      setShowMemberForm(false);
      setMemberEmail(""); setMemberName("");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setBusy(false); }
  }

  if (!org) return <div className="p-8 text-muted-foreground">Loading…</div>;

  return (
    <div className="p-8 space-y-10 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">{org.name}</h1>
        <p className="text-sm text-muted-foreground"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">{org.slug}</code></p>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Organization Members</h2>
          <Button size="sm" variant="outline" onClick={() => setShowMemberForm((v) => !v)}>
            {showMemberForm ? "Cancel" : "+ Add Member"}
          </Button>
        </div>
        {showMemberForm && (
          <form onSubmit={inviteAdmin} className="mb-4 rounded-lg border bg-card p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required placeholder="jane@acme.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="sm" disabled={busy}>{busy ? "Adding…" : "Add Member"}</Button>
          </form>
        )}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No members yet</TableCell></TableRow>
              ) : members.map((m) => (
                <TableRow key={m.user_id}>
                  <TableCell>{m.email}</TableCell>
                  <TableCell className="text-muted-foreground">{m.full_name}</TableCell>
                  <TableCell><Badge variant={m.role === "admin" ? "default" : "secondary"}>{m.role}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
