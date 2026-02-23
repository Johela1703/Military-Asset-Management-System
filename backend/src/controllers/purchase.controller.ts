import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog } from '../utils/audit';

export const getPurchases = async (req: AuthRequest, res: Response): Promise<void> => {
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
      where.purchaseDate = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) }),
      };
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          base: { select: { id: true, name: true } },
          equipmentType: { select: { id: true, name: true, category: true, unit: true } },
        },
        orderBy: { purchaseDate: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.purchase.count({ where }),
    ]);

    res.json({ purchases, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createPurchase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { baseId, equipmentTypeId, quantity, unitCost, supplier, purchaseDate, notes } = req.body;

    if (!baseId || !equipmentTypeId || !quantity) {
      res.status(400).json({ message: 'baseId, equipmentTypeId, and quantity are required' });
      return;
    }

    // Logistics officers and admins can create purchases; base commanders restricted to their base
    if (req.user?.role === 'BASE_COMMANDER' && req.user.baseId !== baseId) {
      res.status(403).json({ message: 'You can only create purchases for your base' });
      return;
    }

    const totalCost = (unitCost || 0) * quantity;

    const purchase = await prisma.purchase.create({
      data: {
        baseId,
        equipmentTypeId,
        quantity: parseInt(quantity),
        unitCost: parseFloat(unitCost) || 0,
        totalCost,
        supplier,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        notes,
      },
      include: {
        base: { select: { id: true, name: true } },
        equipmentType: { select: { id: true, name: true, category: true } },
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'PURCHASE_CREATED',
      entityType: 'Purchase',
      entityId: purchase.id,
      description: `Purchase of ${quantity} ${purchase.equipmentType.name} for ${purchase.base.name}`,
      purchaseId: purchase.id,
    });

    res.status(201).json(purchase);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPurchaseById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        base: true,
        equipmentType: true,
      },
    });
    if (!purchase) {
      res.status(404).json({ message: 'Purchase not found' });
      return;
    }
    res.json(purchase);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
