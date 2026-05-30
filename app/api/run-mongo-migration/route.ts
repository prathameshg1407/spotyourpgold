import { NextResponse } from "next/server";
import mongoose from "mongoose";

const OLD_URI = "mongodb+srv://prathameshgaikwad964006:Prathamesh1407@cluster.55yfn.mongodb.net/?appName=cluster";
// Automatically URL-encoded password (Amit@sypg1234 -> Amit%40sypg1234)
const NEW_URI = "mongodb+srv://spotyourpg:Amit%40sypg1234@spotyourpg.n0c44zx.mongodb.net/?appName=spotyourpg";

export async function GET() {
  let oldConn, newConn;
  try {
    oldConn = await mongoose.createConnection(OLD_URI).asPromise();
    newConn = await mongoose.createConnection(NEW_URI).asPromise();

    const oldDb = oldConn.db;
    const newDb = newConn.db;
    
    if (!oldDb || !newDb) {
      throw new Error("Could not access native db objects");
    }

    const collections = await oldDb.listCollections().toArray();
    const logs: string[] = [];
    let totalDocs = 0;

    for (const collInfo of collections) {
      if (collInfo.name.startsWith("system.")) continue; // Skip internal MongoDB collections
      
      const oldCollection = oldDb.collection(collInfo.name);
      const newCollection = newDb.collection(collInfo.name);

      const docs = await oldCollection.find({}).toArray();
      
      if (docs.length > 0) {
        // Drop new collection first to safely allow re-running the migration without Duplicate Key errors
        try {
          await newCollection.drop();
        } catch (e) {
          // ignore drop error if collection didn't exist yet in the new DB
        }
        
        await newCollection.insertMany(docs);
        totalDocs += docs.length;
        logs.push(`✅ Migrated ${docs.length} documents for collection: ${collInfo.name}`);
      } else {
        logs.push(`⚠️ Skipped empty collection: ${collInfo.name}`);
      }
    }

    await oldConn.close();
    await newConn.close();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully migrated ${totalDocs} total documents across ${collections.length} collections!`,
      logs 
    });
  } catch (error: any) {
    if (oldConn) await oldConn.close();
    if (newConn) await newConn.close();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
