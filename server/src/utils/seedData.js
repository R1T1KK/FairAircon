require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Service = require('../models/Service');

const services = [
  {
    name: 'AC Repair',
    description: 'Expert diagnosis and repair of all AC issues including compressor failure, refrigerant leaks, electrical faults, and unusual noises. Our certified technicians handle all brands.',
    category: 'repair',
    basePrice: 499,
    discountPrice: 399,
    duration: 90,
    icon: 'repair',
    features: ['All brand support', 'Genuine spare parts', '3 months Warranty', 'Same-day service']
  },
  {
    name: 'AC Installation',
    description: 'Professional installation of split ACs, window ACs, and central air conditioning systems. Includes mounting, piping, electrical connections, and testing.',
    category: 'installation',
    basePrice: 1499,
    discountPrice: 1399,
    duration: 180,
    icon: 'installation',
    features: ['Free site inspection', 'Copper piping included', 'Demo & testing', '3 months Warranty']
  },
  {
    name: 'Gas Refill / Recharge',
    description: 'AC gas top-up and complete recharge service using high-quality refrigerant (R22/R32/R410A). Includes leak detection and pressure testing.',
    category: 'gas-refill',
    basePrice: 3800,
    discountPrice: 3500,
    duration: 60,
    icon: 'gas',
    features: ['Leak detection included', 'Premium refrigerant', 'Pressure testing', '3 months Warranty']
  },
  {
    name: 'Annual Maintenance (AMC)',
    description: 'only provide services which is 2 wet and dry services quarterly',
    category: 'maintenance',
    basePrice: 1800,
    discountPrice: 1500,
    duration: 120,
    icon: 'maintenance',
    features: ['2 wet and dry services', 'Priority scheduling', 'Phone support', '3 months Warranty']
  },
  {
    name: 'Deep Cleaning',
    description: 'Thorough AC deep cleaning service including filter wash, coil cleaning, drain line flush, and sanitization for better air quality and efficiency.',
    category: 'cleaning',
    basePrice: 800,
    discountPrice: 650,
    duration: 90,
    icon: 'cleaning',
    features: ['Filter deep wash', 'Coil jet cleaning', 'Sanitization spray', '3 months Warranty']
  },
  {
    name: 'Emergency Repair',
    description: 'Urgent AC repair service available for breakdowns. Fast response with priority dispatching of experienced technicians for critical situations.',
    category: 'repair',
    basePrice: 400,
    discountPrice: 349,
    duration: 60,
    icon: 'emergency',
    features: ['2-hour response', '24/7 availability', 'Priority dispatching', '3 months Warranty']
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Service.deleteMany({});
    await User.deleteMany({ role: { $in: ['admin', 'technician'] } });

    // Create services
    await Service.insertMany(services);
    console.log('✅ Services seeded');

    // Create admin user
    await User.create({
      name: 'Admin',
      email: 'admin@airfix.com',
      phone: '9999999999',
      password: 'Admin@123',
      role: 'admin',
      isVerified: true
    });
    console.log('✅ Admin user created (admin@airfix.com / Admin@123)');

    // Create a demo technician
    await User.create({
      name: 'Rajesh Kumar',
      email: 'tech@airfix.com',
      phone: '8888888888',
      password: 'Tech@123',
      role: 'technician',
      isVerified: true
    });
    console.log('✅ Demo technician created (tech@airfix.com / Tech@123)');

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
