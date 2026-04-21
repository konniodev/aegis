"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { UserOut } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserOut[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    api.get<UserOut[]>("/api/v1/users").then(setUsers).catch(() => {});
  }, []);

  async function handleDelete(u: UserOut) {
    if (!confirm(`Delete "${u.email}"? This removes all their memberships and cannot be undone.`)) return;
    const id = String(u.id);
    setDeleting(id);
    try {
      await api.del(`/api/v1/users/${id}`);
      setUsers((prev) => prev.filter((x) => String(x.id) !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleting(null);
    }
  }

  const meId = me ? String(me.id) : null;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">All Users</h1>
        <p className="text-sm text-muted-foreground">{users.length} registered</p>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const id = String(u.id);
              const isSelf = id === meId;
              return (
                <TableRow key={id}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell className="text-muted-foreground">{u.full_name}</TableCell>
                  <TableCell>
                    {u.is_superadmin ? <Badge>Superadmin</Badge> : <Badge variant="secondary">User</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? "success" : "secondary"}>
                      {u.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={isSelf || deleting === id}
                      title={isSelf ? "Cannot delete your own account" : "Delete user"}
                      className="text-xs text-destructive hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {deleting === id ? "Deleting…" : "Delete"}
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
