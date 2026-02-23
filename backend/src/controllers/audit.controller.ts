import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '50', entityType, action } = req.query as Record<string, string>;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
