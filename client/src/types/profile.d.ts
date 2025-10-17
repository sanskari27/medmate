export interface UserProfile {
	id: string;
	email: string;
	name: string;
	firstName?: string;
	lastName?: string;
	phone?: string;
	phoneNumber?: string;
	address?: {
		street: string;
		city: string;
		state: string;
		zipCode: string;
		country: string;
	};
	dateOfBirth?: string;
	gender?: string;
	isVerified: boolean;
	provider?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface MedicalProfileData {
	medicalConditions: string[];
	allergies: string[];
	currentMedications: string[];
	previousSurgeries: string[];
	emergencyContact: {
		name: string;
		relationship: string;
		phone: string;
	};
	bloodType?: string;
	height?: number;
	weight?: number;
	medicalHistory: string;
}
