const { MongoClient } = require('mongodb');

async function transferDatabase() {
  const oldUri = 'mongodb://Aditya:Aditya421@fewtechnologies-shard-00-00.tstur.mongodb.net:27017,fewtechnologies-shard-00-01.tstur.mongodb.net:27017,fewtechnologies-shard-00-02.tstur.mongodb.net:27017/?ssl=true&replicaSet=atlas-bneo4y-shard-0&authSource=admin&retryWrites=true&w=majority';
  
  // NOTE: URL-encoded @ in password: Amit%40sypg1234
  const newUri = 'mongodb://spotyourpg:Amit%40sypg1234@ac-fbl4l4e-shard-00-00.n0c44zx.mongodb.net:27017,ac-fbl4l4e-shard-00-01.n0c44zx.mongodb.net:27017,ac-fbl4l4e-shard-00-02.n0c44zx.mongodb.net:27017/?ssl=true&replicaSet=atlas-hnvi98-shard-0&authSource=admin&retryWrites=true&w=majority&appName=spotyourpg';

  console.log('Connecting to old database...');
  const oldClient = new MongoClient(oldUri);
  await oldClient.connect();
  const oldDb = oldClient.db('sypg'); 
  console.log('Connected to old database (fewtechnologies).');

  console.log('Connecting to new database...');
  const newClient = new MongoClient(newUri);
  await newClient.connect();
  const newDb = newClient.db('sypg'); 
  console.log('Connected to new database (spotyourpg).');

  try {
    const collections = await oldDb.listCollections().toArray();
    
    for (const colInfo of collections) {
      if (colInfo.type === 'view') continue; // skip views
      const colName = colInfo.name;
      console.log(`\n--- Processing collection: ${colName} ---`);
      
      const oldCol = oldDb.collection(colName);
      const newCol = newDb.collection(colName);
      
      const docs = await oldCol.find({}).toArray();
      console.log(`Found ${docs.length} documents in ${colName}`);
      
      if (docs.length > 0) {
        // Drop destination collection if it exists to ensure a clean copy
        try {
          await newCol.drop();
          console.log(`Dropped existing collection ${colName} in new DB.`);
        } catch (e) {
          // Ignore error if it doesn't exist
        }
        
        console.log(`Inserting ${docs.length} documents into ${colName}...`);
        await newCol.insertMany(docs);
        console.log(`✅ Success for ${colName}`);
      } else {
        console.log(`Skipped ${colName} (empty)`);
      }
    }
    console.log('\n🎉 ALL DATA TRANSFERRED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Error during transfer:', error);
  } finally {
    await oldClient.close();
    await newClient.close();
  }
}

transferDatabase().catch(console.error);
