import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog } from '../utils/audit';

export const getAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, baseId, equipmentTypeId, status, page = '1', limit = '20' } = req.query as Record<string, string>;

    let effectiveBaseId = baseId;
    if (req.user?.role === 'BASE_COMMANDER' && req.user.baseId) {
      effectiveBaseId = req.user.baseId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};

    if (effectiveBaseId) where.baseId = effectiveBaseId;
    if (equipmentTypeId) where.equipmentTypeId = equipmentTypeId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.assignedDate = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) }),
      };
    }

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        include: {
          base: { select: { id: true, name: true } },
          equipmentType: { select: { id: true, name: true, category: true, unit: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
        orderBy: { assignedDate: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.assignment.count({ where }),
    ]);

    res.json({ assignments, total, page: parseInt(page), limit: parseInt(limit) });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { baseId, equipmentTypeId, personnelName, quantity, assignedDate, notes } = req.body;

    if (!baseId || !equipmentTypeId || !personnelName || !quantity) {
      res.status(400).json({ message: 'baseId, equipmentTypeId, personnelName, and quantity are required' });
      return;
    }

    if (req.user?.role === 'BASE_COMMANDER' && req.user.baseId !== baseId) {
      res.status(403).json({ message: 'You can only create assignments for your base' });
      return;
    }

    const assignment = await prisma.assignment.create({
      data: {
        baseId,
        equipmentTypeId,
        assignedToId: req.user!.id,
        personnelName,
        quantity: parseInt(quantity),
        assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
        status: 'ACTIVE',
        notes,
      },
      include: {
        base: { select: { id: true, name: true } },
        equipmentType: { select: { id: true, name: true, category: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'ASSIGNMENT_CREATED',
      entityType: 'Assignment',
      entityId: assignment.id,
      description: `Assignment of ${quantity} ${assignment.equipmentType.name} to ${personnelName} at ${assignment.base.name}`,
      assignmentId: assignment.id,
    });

    res.status(201).json(assignment);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const returnAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment) {
      res.status(404).json({ message: 'Assignment not found' });
      return;
    }

    const updated = await prisma.assignment.update({
      where: { id },
      data: { status: 'RETURNED', returnDate: new Date() },
      include: {
        base: { select: { name: true } },
        equipmentType: { select: { name: true } },
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'ASSIGNMENT_RETURNED',
      entityType: 'Assignment',
      entityId: id,
      description: `Assignment of ${assignment.quantity} ${updated.equipmentType.name} returned at ${updated.base.name}`,
      assignmentId: id,
    });

    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
