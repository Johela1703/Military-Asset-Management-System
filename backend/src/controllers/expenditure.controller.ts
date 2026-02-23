import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog } from '../utils/audit';

export const getExpenditures = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, baseId, equipmentTypeId, page = '1', limit = '20' } = req.query as Record<string, string>;

    let effectiveBaseId = baseId;
    if (req.user?.role === 'BASE_COMMANDER' && req.user.baseId) {
      effectiveBaseId = req.user.baseId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};

    if (effectiveBaseId) where.baseId = effectiveBaseId;
    if (equipmentTypeId) where.equipmentTypeId = equipmentTypeId;
    if (startDate || endDate) {
      where.expendedDate = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) }),
      };
    }

    const [expenditures, total] = await Promise.all([
      prisma.expenditure.findMany({
        where,
        include: {
          base: { select: { id: true, name: true } },
          equipmentType: { select: { id: true, name: true, category: true, unit: true } },
        },
        orderBy: { expendedDate: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.expenditure.count({ where }),
    ]);

    res.json({ expenditures, total, page: parseInt(page), limit: parseInt(limit) });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createExpenditure = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { baseId, equipmentTypeId, quantity, reason, expendedDate, notes } = req.body;

    if (!baseId || !equipmentTypeId || !quantity || !reason) {
      res.status(400).json({ message: 'baseId, equipmentTypeId, quantity, and reason are required' });
      return;
    }

    if (req.user?.role === 'BASE_COMMANDER' && req.user.baseId !== baseId) {
      res.status(403).json({ message: 'You can only record expenditures for your base' });
      return;
    }

    const expenditure = await prisma.expenditure.create({
      data: {
        baseId,
        equipmentTypeId,
        quantity: parseInt(quantity),
        reason,
        expendedDate: expendedDate ? new Date(expendedDate) : new Date(),
        notes,
      },
      include: {
        base: { select: { id: true, name: true } },
        equipmentType: { select: { id: true, name: true, category: true } },
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'EXPENDITURE_CREATED',
      entityType: 'Expenditure',
      entityId: expenditure.id,
      description: `Expenditure of ${quantity} ${expenditure.equipmentType.name} at ${expenditure.base.name}: ${reason}`,
      expenditureId: expenditure.id,
    });

    res.status(201).json(expenditure);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
