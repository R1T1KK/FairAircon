const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const Review = require('./src/models/Review');
    
    // Drop all indexes on Review collection
    await Review.collection.dropIndexes();
    console.log('Dropped old indexes');
    
    // Recreate indexes defined in the schema
    await Review.syncIndexes();
    console.log('Recreated updated indexes');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixIndexes();
