/**
 * Seed script
 *
 * Usage:
 * 1) Create only admin (recommended): npm run seed
 * 2) Create admin + sample demo data: SEED_DEMO=true npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Request = require('./models/Request');
const Resource = require('./models/Resource');

const adminName = process.env.SEED_ADMIN_NAME || 'Platform Admin';
const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
const shouldSeedDemo = String(process.env.SEED_DEMO || 'false').toLowerCase() === 'true';

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in server/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected for seeding');
};

const ensureAdmin = async () => {
  let admin = await User.findOne({ email: adminEmail.toLowerCase() }).select('+password');

  if (!admin) {
    admin = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: 'admin',
    });
    console.log(`Admin created: ${admin.email}`);
  } else if (admin.role !== 'admin') {
    admin.role = 'admin';
    await admin.save();
    console.log(`User promoted to admin: ${admin.email}`);
  } else {
    console.log(`Admin already exists: ${admin.email}`);
  }

  return admin;
};

const seedDemoData = async (adminId) => {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 1) {
    console.log('Demo seed skipped because users already exist.');
    return;
  }

  const volunteer = await User.create({
    name: 'Volunteer One',
    email: 'volunteer@example.com',
    password: 'Volunteer123!',
    role: 'volunteer',
    phone: '+91-9000000002',
    isAvailable: true,
    location: { type: 'Point', coordinates: [77.209, 28.6139] },
  });

  const normalUser = await User.create({
    name: 'Regular User',
    email: 'user@example.com',
    password: 'User12345!',
    role: 'user',
    phone: '+91-9000000003',
  });

  const request = await Request.create({
    submittedBy: normalUser._id,
    type: 'medical',
    urgency: 'high',
    description: 'Need emergency medical support for elderly person.',
    location: {
      type: 'Point',
      coordinates: [72.8777, 19.076],
      address: 'Mumbai',
    },
    status: 'pending',
    numberOfPeople: 1,
  });

  await Resource.create({
    name: 'First Aid Kits',
    type: 'medical',
    quantity: 80,
    unit: 'units',
    lowStockThreshold: 10,
    location: {
      type: 'Point',
      coordinates: [77.209, 28.6139],
      campName: 'Camp Alpha',
    },
    managedBy: adminId,
  });

  console.log('Demo users and sample records created.');
  console.log(`Volunteer login: ${volunteer.email} / Volunteer123!`);
  console.log(`User login: ${normalUser.email} / User12345!`);
  console.log(`Sample request id: ${request._id}`);
};

const run = async () => {
  try {
    await connectDB();
    const admin = await ensureAdmin();

    if (shouldSeedDemo) {
      await seedDemoData(admin._id);
    }

    console.log('Seed completed successfully.');
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();