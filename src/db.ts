import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

// MongoDB connection
let db: Db | null = null;
let client: MongoClient | null = null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://robinhood:m6lr5FdfWIYrC6T7@cluster0.byak0l1.mongodb.net';
const DB_NAME = process.env.DB_NAME || 'robinhood';

// Database interfaces
export interface Position {
  _id?: ObjectId;
  symbol: string;
  shares: number;
  avg_cost: number;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  _id?: ObjectId;
  type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL';
  symbol?: string;
  shares?: number;
  price?: number;
  amount: number;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

export interface Wallet {
  _id?: ObjectId;
  balance: number;
  buying_power: number;
  updated_at: Date;
}

export interface Portfolio {
  _id?: ObjectId;
  account_value: number;
  total_return: number;
  total_return_percent: number;
  day_change: number;
  day_change_percent: number;
  updated_at: Date;
}

// Connect to MongoDB
export async function connectDB(): Promise<Db> {
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
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Create indexes for better query performance
async function createIndexes() {
  if (!db) return;

  await db.collection('positions').createIndex({ symbol: 1 }, { unique: true });
  await db.collection('transactions').createIndex({ timestamp: -1 });
  await db.collection('transactions').createIndex({ type: 1 });
  await db.collection('transactions').createIndex({ symbol: 1 });
}

// Get database instance
export function getDB(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
}

// Close database connection
export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    db = null;
    client = null;
    console.log('Disconnected from MongoDB');
  }
}

// Collection helpers
export function getPositionsCollection(): Collection<Position> {
  return getDB().collection<Position>('positions');
}

export function getTransactionsCollection(): Collection<Transaction> {
  return getDB().collection<Transaction>('transactions');
}

export function getWalletCollection(): Collection<Wallet> {
  return getDB().collection<Wallet>('wallet');
}

export function getPortfolioCollection(): Collection<Portfolio> {
  return getDB().collection<Portfolio>('portfolio');
}

// Initialize default wallet if doesn't exist
export async function initializeWallet(): Promise<Wallet> {
  const walletCol = getWalletCollection();
  
  const existingWallet = await walletCol.findOne({});
  
  if (existingWallet) {
    return existingWallet;
  }
  
  const newWallet: Wallet = {
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
export async function getWallet(): Promise<Wallet> {
  const walletCol = getWalletCollection();
  const wallet = await walletCol.findOne({});
  
  if (!wallet) {
    return await initializeWallet();
  }
  
  return wallet;
}

// Update wallet
export async function updateWallet(balance: number, buying_power: number): Promise<void> {
  const walletCol = getWalletCollection();
  
  await walletCol.updateOne(
    {},
    {
      $set: {
        balance,
        buying_power,
        updated_at: new Date()
      }
    },
    { upsert: true }
  );
}

