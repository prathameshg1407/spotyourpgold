const mongoose = require('mongoose');

async function fixIndexes() {
  try {
    await mongoose.connect('mongodb+srv://prathameshgaikwad964006:Prathamesh1407@cluster.55yfn.mongodb.net/test?retryWrites=true&w=majority');
    
    console.log('✅ Connected to MongoDB');
    
    // Get the collection
    const db = mongoose.connection.db;
    const collection = db.collection('ownerprofiles');
    
    // Show current indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);
    
    // Drop all indexes except _id
    await collection.dropIndexes();
    console.log('✅ All indexes dropped');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixIndexes();