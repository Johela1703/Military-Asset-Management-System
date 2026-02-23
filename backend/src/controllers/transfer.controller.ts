import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog } from '../utils/audit';

export const getTransfers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, baseId, equipmentTypeId, page = '1', limit = '20' } = req.query as Record<string, string>;

    let effectiveBaseId = baseId;
    if (req.user?.role === 'BASE_COMMANDER' && req.user.baseId) {
      effectiveBaseId = req.user.baseId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};

    if (effectiveBaseId) {
      where.OR = [{ sourceBaseId: effectiveBaseId }, { destBaseId: effectiveBaseId }];
    }
    if (equipmentTypeId) where.equipmentTypeId = equipmentTypeId;
    if (startDate || endDate) {
      where.transferDate = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) }),
      };
    }

    const [transfers, total] = await Promise.all([
      prisma.transfer.findMany({
        where,
        include: {
          sourceBase: { select: { id: true, name: true } },
          destBase: { select: { id: true, name: true } },
          equipmentType: { select: { id: true, name: true, category: true, unit: true } },
        },
        orderBy: { transferDate: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.transfer.count({ where }),
    ]);

    res.json({ transfers, total, page: parseInt(page), limit: parseInt(limit) });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTransfer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sourceBaseId, destBaseId, equipmentTypeId, quantity, transferDate, notes } = req.body;

    if (!sourceBaseId || !destBaseId || !equipmentTypeId || !quantity) {
      res.status(400).json({ message: 'sourceBaseId, destBaseId, equipmentTypeId, and quantity are required' });
      return;
    }

    if (sourceBaseId === destBaseId) {
      res.status(400).json({ message: 'Source and destination bases must be different' });
      return;
    }

    if (req.user?.role === 'BASE_COMMANDER' && req.user.baseId !== sourceBaseId) {
      res.status(403).json({ message: 'You can only initiate transfers from your base' });
      return;
    }

    const transfer = await prisma.transfer.create({
      data: {
        sourceBaseId,
        destBaseId,
        equipmentTypeId,
        quantity: parseInt(quantity),
        transferDate: transferDate ? new Date(transferDate) : new Date(),
        status: 'COMPLETED',
        notes,
      },
      include: {
        sourceBase: { select: { id: true, name: true } },
        destBase: { select: { id: true, name: true } },
        equipmentType: { select: { id: true, name: true, category: true } },
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'TRANSFER_CREATED',
      entityType: 'Transfer',
      entityId: transfer.id,
      description: `Transfer of ${quantity} ${transfer.equipmentType.name} from ${transfer.sourceBase.name} to ${transfer.destBase.name}`,
      transferId: transfer.id,
    });

    res.status(201).json(transfer);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTransferById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        sourceBase: true,
        destBase: true,
        equipmentType: true,
      },
    });
    if (!transfer) {
      res.status(404).json({ message: 'Transfer not found' });
      return;
    }
    res.json(transfer);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
