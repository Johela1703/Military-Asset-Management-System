import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';

const buildDateFilter = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return undefined;
  return {
    ...(startDate && { gte: new Date(startDate) }),
    ...(endDate && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) }),
  };
};

export const getDashboardMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, baseId, equipmentTypeId } = req.query as Record<string, string>;

    // Restrict base commanders to their base
    let effectiveBaseId = baseId;
    if (req.user?.role === 'BASE_COMMANDER' && req.user.baseId) {
      effectiveBaseId = req.user.baseId;
    }

    const dateFilter = buildDateFilter(startDate, endDate);

    const baseFilter = effectiveBaseId ? { baseId: effectiveBaseId } : {};
    const eqFilter = equipmentTypeId ? { equipmentTypeId } : {};

    // Purchases (transfers in from outside as new stock)
    const purchases = await prisma.purchase.aggregate({
      where: {
        ...baseFilter,
        ...eqFilter,
        ...(dateFilter && { purchaseDate: dateFilter }),
      },
      _sum: { quantity: true },
    });

    // Transfers In
    const transfersIn = await prisma.transfer.aggregate({
      where: {
        ...(effectiveBaseId ? { destBaseId: effectiveBaseId } : {}),
        ...eqFilter,
        status: 'COMPLETED',
        ...(dateFilter && { transferDate: dateFilter }),
      },
      _sum: { quantity: true },
    });

    // Transfers Out
    const transfersOut = await prisma.transfer.aggregate({
      where: {
        ...(effectiveBaseId ? { sourceBaseId: effectiveBaseId } : {}),
        ...eqFilter,
        status: 'COMPLETED',
        ...(dateFilter && { transferDate: dateFilter }),
      },
      _sum: { quantity: true },
    });

    // Assigned
    const assigned = await prisma.assignment.aggregate({
      where: {
        ...baseFilter,
        ...eqFilter,
        status: 'ACTIVE',
        ...(dateFilter && { assignedDate: dateFilter }),
      },
      _sum: { quantity: true },
    });

    // Expended
    const expended = await prisma.expenditure.aggregate({
      where: {
        ...baseFilter,
        ...eqFilter,
        ...(dateFilter && { expendedDate: dateFilter }),
      },
      _sum: { quantity: true },
    });

    const purchasedQty = purchases._sum.quantity || 0;
    const transferInQty = transfersIn._sum.quantity || 0;
    const transferOutQty = transfersOut._sum.quantity || 0;
    const assignedQty = assigned._sum.quantity || 0;
    const expendedQty = expended._sum.quantity || 0;

    const netMovement = purchasedQty + transferInQty - transferOutQty;

    // Opening balance = all stock before startDate
    let openingBalance = 0;
    if (startDate) {
      const beforeDate = new Date(startDate);
      const openPurchases = await prisma.purchase.aggregate({
        where: { ...baseFilter, ...eqFilter, purchaseDate: { lt: beforeDate } },
        _sum: { quantity: true },
      });
      const openTransfersIn = await prisma.transfer.aggregate({
        where: { ...(effectiveBaseId ? { destBaseId: effectiveBaseId } : {}), ...eqFilter, status: 'COMPLETED', transferDate: { lt: beforeDate } },
        _sum: { quantity: true },
      });
      const openTransfersOut = await prisma.transfer.aggregate({
        where: { ...(effectiveBaseId ? { sourceBaseId: effectiveBaseId } : {}), ...eqFilter, status: 'COMPLETED', transferDate: { lt: beforeDate } },
        _sum: { quantity: true },
      });
      const openExpended = await prisma.expenditure.aggregate({
        where: { ...baseFilter, ...eqFilter, expendedDate: { lt: beforeDate } },
        _sum: { quantity: true },
      });
      openingBalance =
        (openPurchases._sum.quantity || 0) +
        (openTransfersIn._sum.quantity || 0) -
        (openTransfersOut._sum.quantity || 0) -
        (openExpended._sum.quantity || 0);
    }

    const closingBalance = openingBalance + netMovement - expendedQty;

    res.json({
      openingBalance,
      closingBalance,
      netMovement,
      purchases: purchasedQty,
      transfersIn: transferInQty,
      transfersOut: transferOutQty,
      assigned: assignedQty,
      expended: expendedQty,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getNetMovementDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, baseId, equipmentTypeId } = req.query as Record<string, string>;

    let effectiveBaseId = baseId;
    if (req.user?.role === 'BASE_COMMANDER' && req.user.baseId) {
      effectiveBaseId = req.user.baseId;
    }

    const dateFilter = buildDateFilter(startDate, endDate);
    const baseFilter = effectiveBaseId ? { baseId: effectiveBaseId } : {};
    const eqFilter = equipmentTypeId ? { equipmentTypeId } : {};

    const [purchases, transfersIn, transfersOut] = await Promise.all([
      prisma.purchase.findMany({
        where: {
          ...baseFilter,
          ...eqFilter,
          ...(dateFilter && { purchaseDate: dateFilter }),
        },
        include: {
          base: { select: { name: true } },
          equipmentType: { select: { name: true, category: true } },
        },
        orderBy: { purchaseDate: 'desc' },
      }),
      prisma.transfer.findMany({
        where: {
          ...(effectiveBaseId ? { destBaseId: effectiveBaseId } : {}),
          ...eqFilter,
          status: 'COMPLETED',
          ...(dateFilter && { transferDate: dateFilter }),
        },
        include: {
          sourceBase: { select: { name: true } },
          destBase: { select: { name: true } },
          equipmentType: { select: { name: true, category: true } },
        },
        orderBy: { transferDate: 'desc' },
      }),
      prisma.transfer.findMany({
        where: {
          ...(effectiveBaseId ? { sourceBaseId: effectiveBaseId } : {}),
          ...eqFilter,
          status: 'COMPLETED',
          ...(dateFilter && { transferDate: dateFilter }),
        },
        include: {
          sourceBase: { select: { name: true } },
          destBase: { select: { name: true } },
          equipmentType: { select: { name: true, category: true } },
        },
        orderBy: { transferDate: 'desc' },
      }),
    ]);

    res.json({ purchases, transfersIn, transfersOut });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
