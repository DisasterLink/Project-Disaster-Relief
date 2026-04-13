const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['food', 'water', 'medical', 'vehicle', 'shelter', 'clothing', 'other'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true, // 'kg', 'liters', 'units', 'boxes'
      trim: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      campName: {
        type: String,
        trim: true,
      },
    },
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    allocatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

resourceSchema.index({ location: '2dsphere' });
resourceSchema.index({ type: 1, isAvailable: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
