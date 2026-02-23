import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Bases
  const bases = await Promise.all([
    prisma.base.upsert({
      where: { name: 'Alpha Base' },
      update: {},
      create: { name: 'Alpha Base', location: 'Northern Region' },
    }),
    prisma.base.upsert({
      where: { name: 'Bravo Base' },
      update: {},
      create: { name: 'Bravo Base', location: 'Eastern Region' },
    }),
    prisma.base.upsert({
      where: { name: 'Charlie Base' },
      update: {},
      create: { name: 'Charlie Base', location: 'Southern Region' },
    }),
  ]);

  console.log('✅ Bases created:', bases.map((b: { name: string }) => b.name));

  // Create Equipment Types
  const equipmentTypes = await Promise.all([
    prisma.equipmentType.upsert({
      where: { name: 'M4 Carbine' },
      update: {},
      create: { name: 'M4 Carbine', category: 'Weapons', unit: 'unit' },
    }),
    prisma.equipmentType.upsert({
      where: { name: '5.56mm Ammunition' },
      update: {},
      create: { name: '5.56mm Ammunition', category: 'Ammunition', unit: 'rounds' },
    }),
    prisma.equipmentType.upsert({
      where: { name: 'HMMWV (Humvee)' },
      update: {},
      create: { name: 'HMMWV (Humvee)', category: 'Vehicles', unit: 'unit' },
    }),
    prisma.equipmentType.upsert({
      where: { name: 'Body Armor Vest' },
      update: {},
      create: { name: 'Body Armor Vest', category: 'Equipment', unit: 'unit' },
    }),
    prisma.equipmentType.upsert({
      where: { name: 'Night Vision Goggles' },
      update: {},
      create: { name: 'Night Vision Goggles', category: 'Equipment', unit: 'unit' },
    }),
    prisma.equipmentType.upsert({
      where: { name: 'M9 Pistol' },
      update: {},
      create: { name: 'M9 Pistol', category: 'Weapons', unit: 'unit' },
    }),
    prisma.equipmentType.upsert({
      where: { name: '9mm Ammunition' },
      update: {},
      create: { name: '9mm Ammunition', category: 'Ammunition', unit: 'rounds' },
    }),
    prisma.equipmentType.upsert({
      where: { name: 'M1A2 Abrams Tank' },
      update: {},
      create: { name: 'M1A2 Abrams Tank', category: 'Vehicles', unit: 'unit' },
    }),
  ]);

  console.log('✅ Equipment types created');

  // Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const commanderPassword = await bcrypt.hash('commander123', 10);
  const officerPassword = await bcrypt.hash('officer123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@military.gov' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@military.gov',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const commander1 = await prisma.user.upsert({
    where: { email: 'commander.alpha@military.gov' },
    update: {},
    create: {
      name: 'Col. James Mitchell',
      email: 'commander.alpha@military.gov',
      password: commanderPassword,
      role: 'BASE_COMMANDER',
      baseId: bases[0].id,
    },
  });

  const commander2 = await prisma.user.upsert({
    where: { email: 'commander.bravo@military.gov' },
    update: {},
    create: {
      name: 'Col. Sarah Johnson',
      email: 'commander.bravo@military.gov',
      password: commanderPassword,
      role: 'BASE_COMMANDER',
      baseId: bases[1].id,
    },
  });

  const officer1 = await prisma.user.upsert({
    where: { email: 'logistics1@military.gov' },
    update: {},
    create: {
      name: 'Lt. David Chen',
      email: 'logistics1@military.gov',
      password: officerPassword,
      role: 'LOGISTICS_OFFICER',
    },
  });

  console.log('✅ Users created');

  // Seed Purchases
  const today = new Date();
  const daysAgo = (n: number) => new Date(today.getTime() - n * 24 * 60 * 60 * 1000);

  const purchaseData = [
    { baseId: bases[0].id, equipmentTypeId: equipmentTypes[0].id, quantity: 50, unitCost: 1200, supplier: 'Defense Corp', purchaseDate: daysAgo(60) },
    { baseId: bases[0].id, equipmentTypeId: equipmentTypes[1].id, quantity: 10000, unitCost: 0.5, supplier: 'Ammo Supply Co', purchaseDate: daysAgo(55) },
    { baseId: bases[0].id, equipmentTypeId: equipmentTypes[2].id, quantity: 10, unitCost: 220000, supplier: 'Vehicle Depot', purchaseDate: daysAgo(50) },
    { baseId: bases[1].id, equipmentTypeId: equipmentTypes[0].id, quantity: 30, unitCost: 1200, supplier: 'Defense Corp', purchaseDate: daysAgo(45) },
    { baseId: bases[1].id, equipmentTypeId: equipmentTypes[3].id, quantity: 100, unitCost: 800, supplier: 'Armor Systems', purchaseDate: daysAgo(40) },
    { baseId: bases[2].id, equipmentTypeId: equipmentTypes[4].id, quantity: 20, unitCost: 3500, supplier: 'OptiTech', purchaseDate: daysAgo(35) },
    { baseId: bases[2].id, equipmentTypeId: equipmentTypes[1].id, quantity: 5000, unitCost: 0.5, supplier: 'Ammo Supply Co', purchaseDate: daysAgo(30) },
    { baseId: bases[0].id, equipmentTypeId: equipmentTypes[5].id, quantity: 25, unitCost: 600, supplier: 'Defense Corp', purchaseDate: daysAgo(20) },
    { baseId: bases[1].id, equipmentTypeId: equipmentTypes[7].id, quantity: 5, unitCost: 8500000, supplier: 'Heavy Armor Inc', purchaseDate: daysAgo(15) },
    { baseId: bases[2].id, equipmentTypeId: equipmentTypes[3].id, quantity: 80, unitCost: 800, supplier: 'Armor Systems', purchaseDate: daysAgo(10) },
  ];

  for (const p of purchaseData) {
    await prisma.purchase.create({
      data: { ...p, totalCost: p.unitCost * p.quantity },
    });
  }

  console.log('✅ Purchases seeded');

  // Seed Transfers
  const transferData = [
    { sourceBaseId: bases[0].id, destBaseId: bases[1].id, equipmentTypeId: equipmentTypes[0].id, quantity: 10, transferDate: daysAgo(25), status: 'COMPLETED' },
    { sourceBaseId: bases[1].id, destBaseId: bases[2].id, equipmentTypeId: equipmentTypes[3].id, quantity: 20, transferDate: daysAgo(20), status: 'COMPLETED' },
    { sourceBaseId: bases[0].id, destBaseId: bases[2].id, equipmentTypeId: equipmentTypes[1].id, quantity: 2000, transferDate: daysAgo(15), status: 'COMPLETED' },
    { sourceBaseId: bases[2].id, destBaseId: bases[0].id, equipmentTypeId: equipmentTypes[4].id, quantity: 5, transferDate: daysAgo(10), status: 'COMPLETED' },
    { sourceBaseId: bases[1].id, destBaseId: bases[0].id, equipmentTypeId: equipmentTypes[7].id, quantity: 2, transferDate: daysAgo(5), status: 'COMPLETED' },
  ];

  for (const t of transferData) {
    await prisma.transfer.create({ data: t });
  }

  console.log('✅ Transfers seeded');

  // Seed Assignments
  const assignmentData = [
    { baseId: bases[0].id, equipmentTypeId: equipmentTypes[0].id, assignedToId: commander1.id, personnelName: 'Sgt. Mike Rodriguez', quantity: 1, assignedDate: daysAgo(20), status: 'ACTIVE' },
    { baseId: bases[0].id, equipmentTypeId: equipmentTypes[3].id, assignedToId: commander1.id, personnelName: 'Pvt. Anna Williams', quantity: 1, assignedDate: daysAgo(18), status: 'ACTIVE' },
    { baseId: bases[1].id, equipmentTypeId: equipmentTypes[0].id, assignedToId: commander2.id, personnelName: 'Cpl. Tom Baker', quantity: 2, assignedDate: daysAgo(15), status: 'ACTIVE' },
    { baseId: bases[1].id, equipmentTypeId: equipmentTypes[4].id, assignedToId: commander2.id, personnelName: 'Sgt. Lisa Park', quantity: 1, assignedDate: daysAgo(12), status: 'RETURNED', returnDate: daysAgo(5) },
    { baseId: bases[2].id, equipmentTypeId: equipmentTypes[3].id, assignedToId: officer1.id, personnelName: 'PFC James Hill', quantity: 3, assignedDate: daysAgo(8), status: 'ACTIVE' },
  ];

  for (const a of assignmentData) {
    await prisma.assignment.create({ data: a });
  }

  console.log('✅ Assignments seeded');

  // Seed Expenditures
  const expenditureData = [
    { baseId: bases[0].id, equipmentTypeId: equipmentTypes[1].id, quantity: 500, reason: 'Training exercise', expendedDate: daysAgo(30) },
    { baseId: bases[1].id, equipmentTypeId: equipmentTypes[1].id, quantity: 1000, reason: 'Range qualification', expendedDate: daysAgo(22) },
    { baseId: bases[2].id, equipmentTypeId: equipmentTypes[6].id, quantity: 200, reason: 'Weapons qualification', expendedDate: daysAgo(15) },
    { baseId: bases[0].id, equipmentTypeId: equipmentTypes[1].id, quantity: 300, reason: 'Combat simulation', expendedDate: daysAgo(8) },
  ];

  for (const e of expenditureData) {
    await prisma.expenditure.create({ data: e });
  }

  console.log('✅ Expenditures seeded');

  // Create audit logs for admin
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_SEEDED',
      entityType: 'System',
      entityId: 'seed',
      description: 'Database seeded with initial data',
    },
  });

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('  Admin:              admin@military.gov       / admin123');
  console.log('  Base Commander (Alpha): commander.alpha@military.gov / commander123');
  console.log('  Base Commander (Bravo): commander.bravo@military.gov / commander123');
  console.log('  Logistics Officer:  logistics1@military.gov  / officer123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
