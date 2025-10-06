import { MongoClient } from 'mongodb';
// MongoDB connection
let db = null;
let client = null;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://robinhood:m6lr5FdfWIYrC6T7@cluster0.byak0l1.mongodb.net';
const DB_NAME = process.env.DB_NAME || 'robinhood';
// Connect to MongoDB
export async function connectDB() {
    if (db) {
        return db;
    }
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log(`Connected to MongoDB: ${DB_NAME}`);
        // Create indexes
        await createIndexes();
        return db;
    }
    catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}
// Create indexes for better query performance
async function createIndexes() {
    if (!db)
        return;
    await db.collection('positions').createIndex({ symbol: 1 }, { unique: true });
    await db.collection('transactions').createIndex({ timestamp: -1 });
    await db.collection('transactions').createIndex({ type: 1 });
    await db.collection('transactions').createIndex({ symbol: 1 });
}
// Get database instance
export function getDB() {
    if (!db) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return db;
}
// Close database connection
export async function closeDB() {
    if (client) {
        await client.close();
        db = null;
        client = null;
        console.log('Disconnected from MongoDB');
    }
}
// Collection helpers
export function getPositionsCollection() {
    return getDB().collection('positions');
}
export function getTransactionsCollection() {
    return getDB().collection('transactions');
}
export function getWalletCollection() {
    return getDB().collection('wallet');
}
export function getPortfolioCollection() {
    return getDB().collection('portfolio');
}
// Initialize default wallet if doesn't exist
export async function initializeWallet() {
    const walletCol = getWalletCollection();
    const existingWallet = await walletCol.findOne({});
    if (existingWallet) {
        return existingWallet;
    }
    const newWallet = {
        balance: 10000,
        buying_power: 10000,
        updated_at: new Date()
    };
    const result = await walletCol.insertOne(newWallet);
    return {
        ...newWallet,
        _id: result.insertedId
    };
}
// Get current wallet
export async function getWallet() {
    const walletCol = getWalletCollection();
    const wallet = await walletCol.findOne({});
    if (!wallet) {
        return await initializeWallet();
    }
    return wallet;
}
// Update wallet
export async function updateWallet(balance, buying_power) {
    const walletCol = getWalletCollection();
    await walletCol.updateOne({}, {
        $set: {
            balance,
            buying_power,
            updated_at: new Date()
        }
    }, { upsert: true });
}
