import { prisma } from '../index';

interface AuditLogInput {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
  purchaseId?: string;
  transferId?: string;
  assignmentId?: string;
  expenditureId?: string;
}

export const createAuditLog = async (input: AuditLogInput): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description,
        metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
        purchaseId: input.purchaseId,
        transferId: input.transferId,
        assignmentId: input.assignmentId,
        expenditureId: input.expenditureId,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};
