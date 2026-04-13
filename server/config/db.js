const mongoose = require('mongoose');

let memServer = null;

const connectDB = async () => {
  // First try Atlas
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // fail fast if Atlas is unreachable
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    console.warn(`⚠️  Atlas unreachable (${error.message.substring(0, 80)})`);
    console.log('🔄 Falling back to in-memory MongoDB...');
  }

  // Fallback: MongoDB Memory Server
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memServer = await MongoMemoryServer.create();
    const uri = memServer.getUri();
    await mongoose.connect(uri);
    console.log('✅ MongoDB Memory Server started (data resets on restart)');
    console.log('   ℹ️  To use Atlas, fix your network/IP whitelist in Atlas dashboard');

    // Seed demo data automatically in memory mode
    await seedDemoData();
  } catch (err) {
    console.error('❌ Memory server also failed:', err.message);
    process.exit(1);
  }
};

// Seed minimal demo data when running in memory mode
const seedDemoData = async () => {
  try {
    // Small delay to ensure models are loaded
    await new Promise(r => setTimeout(r, 500));

    const User = require('../models/User');
    const Request = require('../models/Request');
    const Resource = require('../models/Resource');

    const existing = await User.countDocuments();
    if (existing > 0) return; // already seeded

    const admin = await User.create({ name: 'Admin Coordinator', email: 'admin@demo.com', password: 'admin123', role: 'admin', phone: '+91-9000000001' });
    await User.create({ name: 'Ravi Kumar', email: 'vol@demo.com', password: 'vol123', role: 'volunteer', phone: '+91-9000000002', isAvailable: true, location: { type: 'Point', coordinates: [77.209, 28.6139] } });
    const civilian = await User.create({ name: 'Amit Verma', email: 'civil@demo.com', password: 'civil123', role: 'civilian', phone: '+91-9000000004' });

    await Request.create({ submittedBy: civilian._id, type: 'rescue', urgency: 'critical', description: 'Family of 5 trapped on rooftop due to flood water.', location: { type: 'Point', coordinates: [77.1025, 28.7041], address: 'Sector 12, Delhi NCR' }, status: 'pending', numberOfPeople: 5 });
    await Request.create({ submittedBy: civilian._id, type: 'medical', urgency: 'high', description: 'Elderly person needs urgent medical help.', location: { type: 'Point', coordinates: [72.8777, 19.076], address: 'Dharavi, Mumbai' }, status: 'pending', numberOfPeople: 1 });
    await Request.create({ submittedBy: civilian._id, type: 'food', urgency: 'medium', description: '30+ people without food for 2 days.', location: { type: 'Point', coordinates: [80.2707, 13.0827], address: 'Adyar, Chennai' }, status: 'assigned', numberOfPeople: 30 });
    await Request.create({ submittedBy: civilian._id, type: 'water', urgency: 'high', description: 'Contaminated water supply. Need clean water.', location: { type: 'Point', coordinates: [85.8245, 20.2961], address: 'Bhubaneswar, Odisha' }, status: 'in_progress', numberOfPeople: 15 });
    await Request.create({ submittedBy: civilian._id, type: 'shelter', urgency: 'medium', description: '50 families need temporary shelter.', location: { type: 'Point', coordinates: [88.3639, 22.5726], address: 'Kolkata District' }, status: 'resolved', numberOfPeople: 200 });
    await Request.create({ submittedBy: civilian._id, type: 'rescue', urgency: 'critical', description: 'Mudslide trapped 3 people. Road blocked.', location: { type: 'Point', coordinates: [76.9558, 11.0168], address: 'Coimbatore Hills, TN' }, status: 'pending', numberOfPeople: 3 });

    await Resource.create({ name: 'Rice Bags', type: 'food', quantity: 500, unit: 'kg', lowStockThreshold: 50, location: { type: 'Point', coordinates: [77.209, 28.6139], campName: 'Camp Alpha — Delhi' }, managedBy: admin._id });
    await Resource.create({ name: 'Drinking Water', type: 'water', quantity: 2000, unit: 'liters', lowStockThreshold: 200, location: { type: 'Point', coordinates: [72.8777, 19.076], campName: 'Camp Beta — Mumbai' }, managedBy: admin._id });
    await Resource.create({ name: 'First Aid Kits', type: 'medical', quantity: 80, unit: 'units', lowStockThreshold: 10, location: { type: 'Point', coordinates: [80.2707, 13.0827], campName: 'Camp Gamma — Chennai' }, managedBy: admin._id });
    await Resource.create({ name: 'Emergency Tents', type: 'shelter', quantity: 45, unit: 'units', lowStockThreshold: 5, location: { type: 'Point', coordinates: [85.8245, 20.2961], campName: 'Camp Delta — Bhubaneswar' }, managedBy: admin._id });
    await Resource.create({ name: 'Rescue Boats', type: 'vehicle', quantity: 8, unit: 'units', lowStockThreshold: 2, location: { type: 'Point', coordinates: [88.3639, 22.5726], campName: 'Camp Epsilon — Kolkata' }, managedBy: admin._id });
    await Resource.create({ name: 'Medicines (Basic)', type: 'medical', quantity: 7, unit: 'boxes', lowStockThreshold: 10, location: { type: 'Point', coordinates: [77.209, 28.6139], campName: 'Camp Alpha — Delhi' }, managedBy: admin._id });

    console.log('🌱 Demo data auto-seeded! Credentials: admin@demo.com/admin123 · vol@demo.com/vol123 · civil@demo.com/civil123');
  } catch (err) {
    console.warn('⚠️  Auto-seed skipped:', err.message.substring(0, 80));
  }
};

module.exports = connectDB;
