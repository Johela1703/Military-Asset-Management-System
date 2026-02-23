import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';

export const getUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true,
        base: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, baseId } = req.body;
    if (!name || !email || !password || !role) {
      res.status(400).json({ message: 'name, email, password, and role are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, baseId: baseId || null },
      select: {
        id: true, name: true, email: true, role: true,
        base: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role, baseId, password } = req.body;

    const updateData: any = { name, email, role, baseId: baseId || null };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, email: true, role: true,
        base: { select: { id: true, name: true } },
      },
    });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (id === req.user?.id) {
      res.status(400).json({ message: 'Cannot delete yourself' });
      return;
    }
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
