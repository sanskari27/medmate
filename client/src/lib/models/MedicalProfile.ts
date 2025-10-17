import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalProfile extends Document {
	userId: string;
	medicalConditions: string[];
	allergies: string[];
	currentMedications: string[];
	previousSurgeries: string[];
	emergencyContact: {
		name: string;
		relationship: string;
		phone: string;
	};
	bloodType: string;
	height: number; // in cm
	weight: number; // in kg
	medicalHistory: string;
	createdAt: Date;
	updatedAt: Date;
}

const medicalProfileSchema = new Schema<IMedicalProfile>(
	{
		userId: {
			type: String,
			required: true,
			unique: true,
		},
		medicalConditions: [
			{
				type: String,
			},
		],
		allergies: [
			{
				type: String,
			},
		],
		currentMedications: [
			{
				type: String,
			},
		],
		previousSurgeries: [
			{
				type: String,
			},
		],
		emergencyContact: {
			name: {
				type: String,
				required: true,
			},
			relationship: {
				type: String,
				required: true,
			},
			phone: {
				type: String,
				required: true,
			},
		},
		bloodType: {
			type: String,
			enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
		},
		height: {
			type: Number,
			min: 50,
			max: 300,
		},
		weight: {
			type: Number,
			min: 10,
			max: 500,
		},
		medicalHistory: {
			type: String,
			maxLength: 2000,
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.models.MedicalProfile ||
	mongoose.model<IMedicalProfile>('MedicalProfile', medicalProfileSchema);
