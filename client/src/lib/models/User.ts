import mongoose, { Model } from 'mongoose';

export interface IUser extends mongoose.Document {
	_id: mongoose.Schema.Types.ObjectId;
	name?: string;
	email: string;
	phone?: string;
	otp?: string;
	otpExpiry?: Date;
	isVerified: boolean;
	profilePicture?: string;
	googleId?: string;
	provider?: 'email' | 'google';
	createdAt: Date;
	updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
	{
		name: {
			type: String,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		phone: {
			type: String,
			unique: true,
			sparse: true,
		},
		otp: {
			type: String,
			default: null,
			select: false,
			sparse: true,
		},
		otpExpiry: {
			type: Date,
			default: null,
			select: false,
			sparse: true,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		profilePicture: {
			type: String,
			default: null,
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

const UserDB: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default UserDB;
