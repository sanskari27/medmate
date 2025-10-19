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

// Connection event handlers
function setupConnectionHandlers() {
	mongoose.connection.on('connected', () => {
		console.log('✅ MongoDB connected successfully');
	});

	mongoose.connection.on('error', (err) => {
		console.error('❌ MongoDB connection error:', err);
	});

	mongoose.connection.on('disconnected', () => {
		console.warn('⚠️ MongoDB disconnected');
	});

	// Handle process termination
	process.on('SIGINT', async () => {
		await mongoose.connection.close();
		console.log('🔌 MongoDB connection closed through app termination');
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
			serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
			socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
			// Connection pool settings
			maxPoolSize: 10, // Maintain up to 10 socket connections
			minPoolSize: 5, // Maintain a minimum of 5 socket connections
			// Additional options for better reliability
			heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
		};

		cached.promise = mongoose.connect(MONGODB_URI!, opts);

		// Setup connection handlers only once
		setupConnectionHandlers();
	}

	try {
		console.log('🔄 Connecting to MongoDB...');
		cached.conn = await cached.promise;
		return cached.conn;
	} catch (error) {
		console.error('❌ Error connecting to MongoDB:', error);
		// Reset promise on error to allow retry
		cached.promise = null;
		throw error;
	}
}

export default dbConnect;
