import { Db, Collection, ObjectId } from 'mongodb';
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
export declare function connectDB(): Promise<Db>;
export declare function getDB(): Db;
export declare function closeDB(): Promise<void>;
export declare function getPositionsCollection(): Collection<Position>;
export declare function getTransactionsCollection(): Collection<Transaction>;
export declare function getWalletCollection(): Collection<Wallet>;
export declare function getPortfolioCollection(): Collection<Portfolio>;
export declare function initializeWallet(): Promise<Wallet>;
export declare function getWallet(): Promise<Wallet>;
export declare function updateWallet(balance: number, buying_power: number): Promise<void>;
