const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // Create default admin if not exists
  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@auragold.com' },
  });

  if (!adminExists) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        passwordHash,
        fullName: 'Store Admin',
        email: 'admin@auragold.com',
        phoneNumber: '9876543210',
        role: 'ADMIN',
      },
    });
    console.log('Created default admin user: admin / admin123');
  } else {
    console.log('Admin user already exists.');
  }

  // Create default system settings if not exists
  const settingsCount = await prisma.systemSettings.count();
  if (settingsCount === 0) {
    await prisma.systemSettings.create({
      data: {
        gstPercentage: 3.0,
      }
    });
    console.log('Created default system settings with 3% GST.');
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export {};
