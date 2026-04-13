/**
 * Seed Script — run once to populate demo data
 * Usage: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Request = require('./models/Request');
const Resource = require('./models/Resource');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Request.deleteMany({});
  await Resource.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // Create users
  const salt = await bcrypt.genSalt(10);

  const admin = await User.create({
    name: 'Admin Coordinator',
    email: 'admin@demo.com',
    password: 'admin123',
    role: 'admin',
    phone: '+91-9000000001',
  });

  const volunteer1 = await User.create({
    name: 'Ravi Kumar',
    email: 'vol@demo.com',
    password: 'vol123',
    role: 'volunteer',
    phone: '+91-9000000002',
    isAvailable: true,
    location: { type: 'Point', coordinates: [77.209, 28.6139] }, // Delhi
  });

  const volunteer2 = await User.create({
    name: 'Priya Sharma',
    email: 'vol2@demo.com',
    password: 'vol123',
    role: 'volunteer',
    phone: '+91-9000000003',
    isAvailable: true,
    location: { type: 'Point', coordinates: [72.8777, 19.0760] }, // Mumbai
  });

  const civilian1 = await User.create({
    name: 'Amit Verma',
    email: 'civil@demo.com',
    password: 'civil123',
    role: 'civilian',
    phone: '+91-9000000004',
  });

  console.log('👥 Created users (admin, 2 volunteers, 1 civilian)');

  // Create SOS Requests
  const sampleRequests = [
    {
      submittedBy: civilian1._id,
      type: 'rescue',
      urgency: 'critical',
      description: 'Family of 5 trapped on rooftop due to flood water. Need immediate rescue.',
      location: { type: 'Point', coordinates: [77.1025, 28.7041], address: 'Sector 12, Delhi NCR' },
      status: 'pending',
    },
    {
      submittedBy: civilian1._id,
      type: 'medical',
      urgency: 'high',
      description: 'Elderly person needs urgent medical attention. No access to hospital.',
      location: { type: 'Point', coordinates: [72.8777, 19.0760], address: 'Dharavi, Mumbai' },
      status: 'pending',
    },
    {
      submittedBy: civilian1._id,
      type: 'food',
      urgency: 'medium',
      description: '30+ people without food for 2 days in relief camp.',
      location: { type: 'Point', coordinates: [80.2707, 13.0827], address: 'Adyar, Chennai' },
      status: 'assigned',
    },
    {
      submittedBy: civilian1._id,
      type: 'water',
      urgency: 'high',
      description: 'Contaminated water supply. Need clean drinking water urgently.',
      location: { type: 'Point', coordinates: [85.8245, 20.2961], address: 'Bhubaneswar, Odisha' },
      status: 'in_progress',
    },
    {
      submittedBy: civilian1._id,
      type: 'shelter',
      urgency: 'medium',
      description: 'Village homes destroyed. 50 families need temporary shelter.',
      location: { type: 'Point', coordinates: [88.3639, 22.5726], address: 'Kolkata District' },
      status: 'resolved',
    },
    {
      submittedBy: civilian1._id,
      type: 'rescue',
      urgency: 'critical',
      description: 'Mudslide trapped 3 people. Road access blocked.',
      location: { type: 'Point', coordinates: [76.9558, 11.0168], address: 'Coimbatore Hills, TN' },
      status: 'pending',
    },
  ];

  const requests = await Request.insertMany(sampleRequests);
  console.log(`🆘 Created ${requests.length} SOS requests`);

  // Create Resources
  const sampleResources = [
    { name: 'Rice Bags', type: 'food', quantity: 500, unit: 'kg', lowStockThreshold: 50, location: { type: 'Point', coordinates: [77.209, 28.6139], campName: 'Camp Alpha — Delhi' }, managedBy: admin._id },
    { name: 'Drinking Water', type: 'water', quantity: 2000, unit: 'liters', lowStockThreshold: 200, location: { type: 'Point', coordinates: [72.8777, 19.0760], campName: 'Camp Beta — Mumbai' }, managedBy: admin._id },
    { name: 'First Aid Kits', type: 'medical', quantity: 80, unit: 'units', lowStockThreshold: 10, location: { type: 'Point', coordinates: [80.2707, 13.0827], campName: 'Camp Gamma — Chennai' }, managedBy: admin._id },
    { name: 'Emergency Tents', type: 'shelter', quantity: 45, unit: 'units', lowStockThreshold: 5, location: { type: 'Point', coordinates: [85.8245, 20.2961], campName: 'Camp Delta — Bhubaneswar' }, managedBy: admin._id },
    { name: 'Rescue Boats', type: 'vehicle', quantity: 8, unit: 'units', lowStockThreshold: 2, location: { type: 'Point', coordinates: [88.3639, 22.5726], campName: 'Camp Epsilon — Kolkata' }, managedBy: admin._id },
    { name: 'Medicines (Basic)', type: 'medical', quantity: 7, unit: 'boxes', lowStockThreshold: 10, location: { type: 'Point', coordinates: [77.209, 28.6139], campName: 'Camp Alpha — Delhi' }, managedBy: admin._id },
  ];

  await Resource.insertMany(sampleResources);
  console.log(`📦 Created ${sampleResources.length} resources (1 low stock for demo)`);

  console.log('\n🎉 SEED COMPLETE — Demo Credentials:');
  console.log('   Admin:     admin@demo.com     / admin123');
  console.log('   Volunteer: vol@demo.com       / vol123');
  console.log('   Volunteer: vol2@demo.com      / vol123');
  console.log('   Civilian:  civil@demo.com     / civil123');

  process.exit(0);
};

seed().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
