import mongoose from 'mongoose';

export interface INewsletter {
	email: string;
	isActive: boolean;
	subscribedAt: Date;
	unsubscribedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const newsletterSchema = new mongoose.Schema<INewsletter>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		subscribedAt: {
			type: Date,
			default: Date.now,
		},
		unsubscribedAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

// Index for efficient queries
newsletterSchema.index({ email: 1, isActive: 1 });

export default mongoose.models.Newsletter ||
	mongoose.model<INewsletter>('Newsletter', newsletterSchema);
