import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Admin credentials
    const adminEmail = 'admin@smartbus.com';
    const adminPassword = 'admin123'; // Change this to your desired password
    const adminName = 'Admin User';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('❌ Admin user already exists with email:', adminEmail);
      console.log('Updating role to ADMIN...');
      
      const updatedUser = await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'ADMIN' }
      });
      
      console.log('✅ User role updated to ADMIN');
      console.log('📧 Email:', adminEmail);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash: passwordHash,
        role: 'ADMIN'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    console.log('');
    console.log('🌐 Login at: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
