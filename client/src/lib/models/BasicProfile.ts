import mongoose, { Model } from 'mongoose';

export interface IBasicProfile {
	_id: mongoose.Schema.Types.ObjectId;
	linkedTo: mongoose.Schema.Types.ObjectId;
	firstName?: string;
	lastName?: string;
	email: string;
	phone?: string;
	address?: {
		street: string;
		city: string;
		state: string;
		zipCode: string;
		country: string;
	};
	dateOfBirth?: string;
	gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
	createdAt: Date;
	updatedAt: Date;
}

const basicProfileSchema = new mongoose.Schema<IBasicProfile>(
	{
		linkedTo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
			unique: true,
		},
		email: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},
		phone: {
			type: String,
			unique: true,
			sparse: true, // Allow multiple null values
		},
		firstName: {
			type: String,
			trim: true,
		},
		lastName: {
			type: String,
			trim: true,
		},
		address: {
			street: {
				type: String,
				trim: true,
			},
			city: {
				type: String,
				trim: true,
			},
			state: {
				type: String,
				trim: true,
			},
			zipCode: {
				type: String,
				trim: true,
			},
			country: {
				type: String,
				trim: true,
			},
		},
		dateOfBirth: {
			type: String,
		},
		gender: {
			type: String,
			enum: ['male', 'female', 'other', 'prefer-not-to-say'],
		},
	},
	{
		timestamps: true,
	}
);

const BasicProfileDB: Model<IBasicProfile> =
	mongoose.models.BasicProfile || mongoose.model<IBasicProfile>('BasicProfile', basicProfileSchema);

export default BasicProfileDB;
