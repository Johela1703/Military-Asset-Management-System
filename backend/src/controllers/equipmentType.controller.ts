import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';

export const getEquipmentTypes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const types = await prisma.equipmentType.findMany({ orderBy: { name: 'asc' } });
    res.json(types);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createEquipmentType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, category, unit } = req.body;
    if (!name || !category) {
      res.status(400).json({ message: 'name and category are required' });
      return;
    }
    const type = await prisma.equipmentType.create({ data: { name, category, unit: unit || 'unit' } });
    res.status(201).json(type);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEquipmentType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, category, unit } = req.body;
    const type = await prisma.equipmentType.update({ where: { id }, data: { name, category, unit } });
    res.json(type);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEquipmentType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.equipmentType.delete({ where: { id } });
    res.json({ message: 'Equipment type deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
