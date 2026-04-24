import { prisma, Prisma } from "./db";

interface AuditLogParams {
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  adminId?: string;
  storeUserId?: string;
}

export async function createAuditLog(params: AuditLogParams) {
  return prisma.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before as Prisma.InputJsonValue ?? Prisma.DbNull,
      after: params.after as Prisma.InputJsonValue ?? Prisma.DbNull,
      adminId: params.adminId,
      storeUserId: params.storeUserId,
    },
  });
}
