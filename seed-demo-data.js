import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  // Seed cities
  const cities = [
    { name: 'Delhi', stateId: 1 },
    { name: 'Mumbai', stateId: 2 },
    { name: 'Bangalore', stateId: 3 },
    { name: 'Chennai', stateId: 4 },
    { name: 'Kolkata', stateId: 5 }
  ];
  for (const city of cities) {
    await prisma.city.upsert({
      where: { name_stateId: { name: city.name, stateId: city.stateId } },
      update: {},
      create: city
    });
  }

  // Seed operator
  const operator = await prisma.operator.upsert({
    where: { name: 'SuperBus' },
    update: {},
    create: {
      name: 'SuperBus',
      rating: 4.5,
      contactInfo: '9999999999',
      logoUrl: '',
      imagePublicId: '',
      user: {
        create: {
          email: 'operator@superbus.com',
          password: 'operator123',
          role: 'OPERATOR',
        }
      }
    }
  });

  // Seed buses
  const buses = [
    { busNumber: 'DL01A1234', busModel: 'Volvo AC', busType: 'AC', totalSeats: 48, operatorId: operator.id },
    { busNumber: 'MH02B5678', busModel: 'Tata Non-AC', busType: 'NON_AC', totalSeats: 40, operatorId: operator.id }
  ];
  for (const bus of buses) {
    await prisma.bus.upsert({
      where: { busNumber: bus.busNumber },
      update: {},
      create: bus
    });
  }

  // Seed admin user
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@smartbus.com' },
    update: {},
    create: {
      email: 'admin@smartbus.com',
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Root Admin'
    }
  });

  console.log('Demo data seeded successfully!');
  await prisma.$disconnect();
}

seed();
