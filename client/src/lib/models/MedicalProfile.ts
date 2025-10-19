import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMedicalProfile extends Document {
	_id: mongoose.Schema.Types.ObjectId;
	linkedTo: mongoose.Schema.Types.ObjectId;
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
		linkedTo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
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
				default: '',
				trim: true,
			},
			relationship: {
				type: String,
				default: '',
				trim: true,
			},
			phone: {
				type: String,
				default: '',
				trim: true,
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

const MedicalProfileDB: Model<IMedicalProfile> =
	mongoose.models.MedicalProfile ||
	mongoose.model<IMedicalProfile>('MedicalProfile', medicalProfileSchema);

export default MedicalProfileDB;
