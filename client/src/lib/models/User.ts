import mongoose from 'mongoose';

export interface IUser {
	email: string;
	phoneNumber?: string;
	name: string;
	otp?: string;
	otpExpiry?: Date;
	isVerified: boolean;
	googleId?: string;
	provider?: 'email' | 'google';
	createdAt: Date;
	updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		phoneNumber: {
			type: String,
			unique: true,
			sparse: true, // Allow multiple null values
		},
		name: {
			type: String,
			trim: true,
		},
		otp: {
			type: String,
			default: null,
		},
		otpExpiry: {
			type: Date,
			default: null,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		googleId: {
			type: String,
			unique: true,
			sparse: true, // Allow multiple null values
		},
		provider: {
			type: String,
			enum: ['email', 'google'],
			default: 'email',
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
