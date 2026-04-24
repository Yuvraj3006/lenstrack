"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
  admin?: { name: string; email: string } | null;
  storeUser?: { name: string; email: string } | null;
}

function actionVariant(action: string): "success" | "destructive" | "info" | "warning" | "brand" {
  if (action === "CREATE") return "success";
  if (action === "DELETE") return "destructive";
  if (action === "UPDATE") return "info";
  return "brand";
}

export default function AdminAuditLogPage() {
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading } = useQuery<{ data: { logs: AuditLog[]; total: number; pages: number } }>({
    queryKey: ["audit-logs", page],
    queryFn: () => fetch(`/api/admin/audit-log?page=${page}`).then((r) => r.json()) as Promise<{ data: { logs: AuditLog[]; total: number; pages: number } }>,
  });

  const logs = data?.data?.logs || [];
  const totalPages = data?.data?.pages || 1;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Audit Log</h1>
        <p className="text-muted-foreground">Track all system changes and actions</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No audit logs yet</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionVariant(log.action)}>{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{log.entityType}</p>
                        <p className="text-xs text-muted-foreground font-mono">{log.entityId.slice(0, 12)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.admin ? (
                        <div>
                          <p className="text-sm">{log.admin.name}</p>
                          <Badge variant="brand" className="text-xs">Admin</Badge>
                        </div>
                      ) : log.storeUser ? (
                        <div>
                          <p className="text-sm">{log.storeUser.name}</p>
                          <Badge variant="info" className="text-xs">Store User</Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(log.before || log.after) && (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)} className="text-xs">
                          View Changes
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center px-4 text-sm">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      <Dialog open={!!selectedLog} onOpenChange={(o) => !o && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change Details — {selectedLog?.action} {selectedLog?.entityType}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Before</h3>
              <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-64 border">
                {selectedLog?.before ? JSON.stringify(selectedLog.before, null, 2) : "—"}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">After</h3>
              <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-64 border">
                {selectedLog?.after ? JSON.stringify(selectedLog.after, null, 2) : "—"}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
