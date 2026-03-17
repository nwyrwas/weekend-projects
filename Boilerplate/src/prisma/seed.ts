import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from '../config/constants.js';

const prisma = new PrismaClient();

interface SeedUser {
  email: string;
  password: string;
  role: Role;
}

const seedUsers: SeedUser[] = [
  {
    email: 'admin@example.com',
    password: 'Admin123!@#',
    role: 'ADMIN',
  },
  {
    email: 'user1@example.com',
    password: 'User123!@#',
    role: 'USER',
  },
  {
    email: 'user2@example.com',
    password: 'User123!@#',
    role: 'USER',
  },
  {
    email: 'user3@example.com',
    password: 'User123!@#',
    role: 'USER',
  },
  {
    email: 'user4@example.com',
    password: 'User123!@#',
    role: 'USER',
  },
  {
    email: 'user5@example.com',
    password: 'User123!@#',
    role: 'USER',
  },
];

async function main(): Promise<void> {
  console.log('Seeding database...');

  for (const userData of seedUsers) {
    const passwordHash = await bcrypt.hash(userData.password, BCRYPT_ROUNDS);

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        passwordHash,
        role: userData.role,
      },
    });

    console.log(`Created user: ${user.email} (${user.role})`);
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
