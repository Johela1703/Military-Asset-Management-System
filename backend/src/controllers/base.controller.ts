import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';

export const getBases = async (_req: Request, res: Response): Promise<void> => {
  try {
    const bases = await prisma.base.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(bases);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createBase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, location } = req.body;
    if (!name || !location) {
      res.status(400).json({ message: 'name and location are required' });
      return;
    }
    const base = await prisma.base.create({ data: { name, location } });
    res.status(201).json(base);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateBase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;
    const base = await prisma.base.update({ where: { id }, data: { name, location } });
    res.json(base);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteBase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.base.delete({ where: { id } });
    res.json({ message: 'Base deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
