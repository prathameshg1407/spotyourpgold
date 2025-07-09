// /scripts/setupGeoIndex.ts
import { MongoClient } from "mongodb"

async function setupIndex() {
  const client = new MongoClient(process.env.MONGODB_URI!)

  try {
    await client.connect()
    const collection = client.db(process.env.MONGODB_DB_NAME!).collection("listings")

    await collection.createIndex({ "location.coordinates": "2dsphere" })
    console.log("✅ 2dsphere index created on location.coordinates")

    const indexes = await collection.listIndexes().toArray()
    console.log("📋 Current indexes:", indexes.map((i) => i.name))
  } catch (error) {
    console.error("❌ Failed to create index:", error)
  } finally {
    await client.close()
  }
}

setupIndex()




// run it once
// ts-node scripts/setupGeoIndex.ts
