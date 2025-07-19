// Database Index Setup Script for Ultra-Fast Search
// Run this script once to create all necessary indexes for lightning-fast search

const { MongoClient } = require('mongodb');

async function setupSearchIndexes() {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();
        const collection = db.collection('listings');

        console.log('Creating search indexes for ultra-fast performance...');

        // Create all indexes in parallel for maximum efficiency
        const indexPromises = [
            // 1. Geospatial index
            collection.createIndex({ "location.coordinates": "2dsphere" }),

            // 2. Compound status index (most common query)
            collection.createIndex({
                isActive: 1,
                isApproved: 1,
                isFeatured: -1,
                createdAt: -1
            }),

            // 3. Individual field indexes for specific searches
            collection.createIndex({ pgName: 1 }),
            collection.createIndex({ "location.city": 1 }),
            collection.createIndex({ "location.area": 1 }),
            collection.createIndex({ type: 1 }),
            collection.createIndex({ genderPreference: 1 }),
            collection.createIndex({ "roomTypes.monthlyRent": 1 }),
            collection.createIndex({ amenities: 1 }),

            // 4. Compound indexes for filtered searches
            collection.createIndex({
                isActive: 1,
                isApproved: 1,
                type: 1,
                genderPreference: 1,
                "location.city": 1
            }),

            // 5. Price-based queries
            collection.createIndex({
                isActive: 1,
                isApproved: 1,
                "roomTypes.monthlyRent": 1
            }),

            // 6. Owner-based queries
            collection.createIndex({ ownerId: 1, isActive: 1 }),

            // 7. Text index for comprehensive search (if supported)
            collection.createIndex({
                pgName: "text",
                type: "text",
                subType: "text",
                genderPreference: "text",
                "location.area": "text",
                "location.city": "text",
                "location.state": "text",
                "location.pincode": "text",
                "location.nearbyPlaces": "text",
                amenities: "text",
                additionalDetails: "text",
                rulesAndRegulations: "text",
                "roomTypes.type": "text",
                planType: "text"
            }, {
                weights: {
                    pgName: 10,
                    "location.area": 8,
                    "location.city": 8,
                    type: 6,
                    genderPreference: 4,
                    amenities: 3,
                    "location.nearbyPlaces": 2
                },
                name: "comprehensive_search_index"
            }).catch(err => {
                console.log('Text index creation skipped (may already exist):', err.message);
                return null;
            })
        ];

        const results = await Promise.all(indexPromises);

        console.log('✅ Search indexes created successfully!');
        console.log('📊 Created indexes:', results.filter(r => r).length);

        // Get index information
        const indexes = await collection.listIndexes().toArray();
        console.log('\n📋 Current indexes:');
        indexes.forEach(index => {
            console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        });

        console.log('\n🚀 Database is now optimized for ultra-fast search!');

    } catch (error) {
        console.error('❌ Error setting up indexes:', error);
    } finally {
        await client.close();
    }
}

// Run the setup
setupSearchIndexes(); 