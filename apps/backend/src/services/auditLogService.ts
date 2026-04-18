import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import type { AuditEventType, AdminLogItem, AdminLogsResponse } from '../types/admin';

type CreateAuditLogInput = {
  eventType: AuditEventType;
  message: string;
  actorUserId?: string;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
};

export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  let actorUserId: string | null = input.actorUserId ?? null;
  let targetUserId: string | null = input.targetUserId ?? null;

  if (actorUserId) {
    const actorExists = await prisma.user.findUnique({
      where: { id: actorUserId },
      select: { id: true },
    });
    if (!actorExists) {
      actorUserId = null;
    }
  }

  if (targetUserId) {
    const targetExists = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!targetExists) {
      targetUserId = null;
    }
  }

  await prisma.auditLog.create({
    data: {
      eventType: input.eventType,
      message: input.message,
      actorUserId,
      targetUserId,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });
}

export async function getRecentAuditLogs(limit = 50): Promise<AdminLogsResponse> {
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.auditLog.count(),
  ]);

  return {
    logs: logs as AdminLogItem[],
    total,
  };
}
