import mongoose from 'mongoose';

// Validate environment variable first
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
	throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Type-safe global interface
interface Cached {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
}

// Declare global mongoose type
declare global {
	var mongoose: Cached | undefined;
}

// Initialize cached connection
let cached: Cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
	global.mongoose = cached;
}

// Logger helper
const logger = {
	info: (msg: string) => {
		if (process.env.NODE_ENV !== 'production') {
			console.log(`[MongoDB] ${msg}`);
		}
	},
	warn: (msg: string) => {
		console.warn(`[MongoDB] ${msg}`);
	},
	error: (msg: string) => {
		console.error(`[MongoDB] ${msg}`);
	},
};

// Connection event handlers
function setupConnectionHandlers() {
	mongoose.connection.on('connected', () => {
		logger.info('Successfully connected to MongoDB');
	});

	mongoose.connection.on('error', (err) => {
		logger.error(`Connection error: ${err.message}`);
	});

	mongoose.connection.on('disconnected', () => {
		logger.warn('Disconnected from MongoDB');
	});

	// Handle process termination
	process.on('SIGINT', async () => {
		await mongoose.connection.close();
		logger.info('Connection closed due to application termination');
		process.exit(0);
	});
}

async function dbConnect() {
	// Return existing connection if available
	if (cached.conn) {
		return cached.conn;
	}

	// Create new connection if no promise exists
	if (!cached.promise) {
		const opts: mongoose.ConnectOptions = {
			bufferCommands: false,
			// Connection timeout settings
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
			// Connection pool settings
			maxPoolSize: 10,
			minPoolSize: 5,
			// Additional options for better reliability
			heartbeatFrequencyMS: 10000,
		};

		cached.promise = mongoose.connect(MONGODB_URI!, opts);

		// Setup connection handlers only once
		setupConnectionHandlers();
	}

	try {
		logger.info('Connecting to MongoDB...');
		cached.conn = await cached.promise;
		return cached.conn;
	} catch (error) {
		logger.error(
			`Error connecting to MongoDB: ${error instanceof Error ? error.message : String(error)}`
		);
		// Reset promise on error to allow retry
		cached.promise = null;
		throw error;
	}
}

export default dbConnect;
